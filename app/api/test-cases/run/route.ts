import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db, withRetry } from "@/db";
import { TestCasesTable, repositories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { Browserbase } from "@browserbasehq/sdk";
import { chromium } from "playwright-core";

export const maxDuration = 300;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "placeholder",
});

const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY || "placeholder",
});

async function readGithubFile({
    owner,
    repo,
    path,
    branch,
    githubToken,
}: {
    owner: string;
    repo: string;
    path: string;
    branch: string;
    githubToken?: string;
}) {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "TestForge-AI-Agent",
    };
    if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
    }

    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        { headers }
    );

    if (!res.ok) {
        return null;
    }

    const data = await res.json();

    if (!data.content) {
        return null;
    }

    const decodedContent = Buffer.from(data.content, "base64").toString("utf-8");

    return {
        path,
        content: decodedContent.slice(0, 5000),
    };
}

// Type-specific testing instructions for the AI to generate more targeted scripts
function getTypeSpecificInstructions(type: string): string {
    const instructions: Record<string, string> = {
        functional: `
FUNCTIONAL TEST FOCUS:
- Test the core feature workflow end-to-end through the browser
- Navigate to the page, interact with all relevant UI elements
- Verify the feature produces the correct visual outcome
- Test both happy path and basic error scenarios
- Assert that state changes are reflected in the UI`,

        ui: `
UI/VISUAL TEST FOCUS:
- Verify that key UI elements are visible and correctly positioned
- Check that text content, headings, and labels are rendered properly
- Test responsive behavior if applicable (viewport checks)
- Verify CSS classes and visual styles are applied
- Check for proper element hierarchy and semantic HTML
- Assert that images, icons, and media load correctly`,

        auth: `
AUTHENTICATION TEST FOCUS:
- Test login/signup forms through the frontend UI
- Verify that protected routes redirect unauthenticated users
- Test the full auth flow: navigate to login page, fill credentials, submit
- Check for proper error messages on invalid credentials
- Verify that auth state is reflected in the UI (user name, avatar, logout button)
- Test logout functionality if accessible`,

        form: `
FORM VALIDATION TEST FOCUS:
- Test all form fields by filling them with various inputs
- Test required field validation by submitting empty forms
- Test input format validation (email, phone, etc.)
- Verify error messages appear for invalid inputs
- Test edge cases: very long inputs, special characters, emoji
- Verify success feedback after valid submission
- Check that form state resets properly after submission`,

        integration: `
INTEGRATION TEST FOCUS:
- Test a complete user workflow spanning multiple pages/components
- Navigate through a multi-step process (e.g., search → select → configure → save)
- Verify data flows correctly between pages
- Test that actions on one page reflect correctly on another
- Assert that the full workflow completes successfully`,

        regression: `
REGRESSION TEST FOCUS:
- Verify that critical page elements are present and functional
- Check that core navigation links work correctly
- Verify that previously working features still function
- Test basic CRUD operations through the UI
- Assert that no error states appear on page load`,

        smoke: `
SMOKE TEST FOCUS:
- Quickly verify the page loads without errors
- Check that critical elements are visible (headers, navigation, main content)
- Verify no JavaScript console errors on page load
- Test that basic navigation works
- This should be a fast, lightweight check`,

        performance: `
PERFORMANCE TEST FOCUS:
- Measure page load time using browser timing APIs
- Use page.evaluate() to access performance.timing data
- Check that the page loads within acceptable time limits
- Test time-to-interactive by measuring when key elements become clickable
- Log performance metrics for analysis
- Assert that load time is under reasonable thresholds (e.g., 5 seconds)
Example: const loadTime = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);`,

        accessibility: `
ACCESSIBILITY TEST FOCUS:
- Check for ARIA labels on interactive elements using DOM queries
- Verify that images have alt text
- Test keyboard navigation (Tab key focus order)
- Check for proper heading hierarchy (h1, h2, h3)
- Verify that form labels are properly associated with inputs
- Test that color contrast is sufficient (check text vs background)
- Use page.evaluate() to inspect accessibility attributes`,

        security: `
SECURITY TEST FOCUS:
- Test for XSS by entering script tags in input fields: <script>alert('xss')</script>
- Verify that injected scripts are NOT executed (check page content is sanitized)
- Test SQL injection strings in input fields
- Verify that sensitive data is not exposed in the page source
- Check that forms have proper CSRF protection
- Test that error pages don't leak stack traces or server info`,

        'edge-case': `
EDGE CASE TEST FOCUS:
- Test with empty/blank inputs
- Test with extremely long strings (500+ characters)
- Test with special characters: <>&"'/\\
- Test with unicode and emoji characters
- Test rapid repeated clicks/submissions
- Test with boundary values (0, negative numbers, max values)`,

        api: `
API INTEGRATION UI TEST FOCUS:
- Test that API-driven UI features work through the frontend
- Trigger API calls via button clicks or form submissions
- Verify that API responses are correctly rendered in the UI
- Test loading states while API calls are in progress
- Test error handling when API responses indicate failure`,
    };

    return instructions[type] || instructions.functional;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { testCaseId, baseUrl, mode = "generate", customPrompt = "" } = body;

        if (!testCaseId || !baseUrl) {
            return NextResponse.json(
                { error: "testCaseId and baseUrl are required" },
                { status: 400 }
            );
        }

        // 1. Fetch test case from DB (with retry for Neon cold-start timeouts)
        const [testCase] = await withRetry(() =>
            db
                .select()
                .from(TestCasesTable)
                .where(eq(TestCasesTable.id, testCaseId))
        );

        if (!testCase) {
            return NextResponse.json({ error: "Test case not found" }, { status: 404 });
        }

        // Fetch repository settings for global instructions
        let repoRecord = null;
        if (testCase.repoId) {
            const [r] = await withRetry(() =>
                db
                    .select()
                    .from(repositories)
                    .where(eq(repositories.repoId, parseInt(testCase.repoId!)))
            );
            repoRecord = r;
        }
        if (!repoRecord) {
            const [r] = await withRetry(() =>
                db
                    .select()
                    .from(repositories)
                    .where(eq(repositories.fullName, `${testCase.repoOwner}/${testCase.repoName}`))
            );
            repoRecord = r;
        }

        let scriptText = testCase.browserbaseScript;
        const forceRegenerate = mode === "generate" || !scriptText;

        // 2. Generate script using Gemini if forced, or if no script is cached
        if (forceRegenerate) {
            const cookiesStore = await cookies();
            const githubToken = cookiesStore.get("gh_token")?.value;

            // Fetch target files context
            const targetFiles = testCase.targetFiles || [];
            let repoContext = "";

            if (targetFiles.length > 0) {
                const fileContents = await Promise.all(
                    targetFiles.map((path) =>
                        readGithubFile({
                            owner: testCase.repoOwner,
                            repo: testCase.repoName,
                            branch: testCase.branch || "main",
                            path,
                            githubToken,
                        })
                    )
                );

                const validFiles = fileContents.filter(Boolean);
                repoContext = validFiles
                    .map(
                        (file: any) => `
                            File Path: ${file.path}

                            File Content:
                            ${file.content}
                            `
                    )
                    .join("\n\n----------------------\n\n");
            }

            // Build global instructions and runtime prompts
            const globalIns = repoRecord?.gloablInstruction
                ? `\n[GLOBAL PROJECT INSTRUCTIONS] (Follow strictly):\n${repoRecord.gloablInstruction}\n`
                : "";

            const tempIns = customPrompt
                ? `\n[ADDITIONAL RUNTIME INSTRUCTIONS] (Follow strictly):\n${customPrompt}\n`
                : "";

            // Get type-specific testing instructions
            const typeInstructions = getTypeSpecificInstructions(testCase.type);

            // Determine timeout based on test type
            const timeoutMs = testCase.type === 'performance' ? 30000 : 15000;

            // Prompt Gemini for Playwright code string
            const prompt = `
You are an expert QA automation engineer.
Your task is to write a Playwright Node.js script body that executes a test case strictly by interacting with the frontend UI on a deployed web application running at URL: "${baseUrl}". 

CRITICAL: This test runs on a DEPLOYED WEBSITE through Browserbase cloud browser. 
- Do NOT write backend/server-side fetch requests inside the page.
- Always navigate the browser to the actual deployed URL, interact with real UI elements (forms, inputs, buttons, links), and verify visible results in the DOM.
- The target website is live at "${baseUrl}" — all tests must work against this URL.

Test Case Details:
- Title: ${testCase.title}
- Description: ${testCase.description}
- Test Type: ${testCase.type}
- Priority: ${testCase.priority || 'medium'}
- Target Route: ${testCase.targetRoute || "/"}
- Expected Result: ${testCase.expectedResult}
${globalIns}
${tempIns}

${typeInstructions}

Source File Context for Reference (Read this to extract exact tags, component text, input fields, and class names):
${repoContext || "No source file context available for this test case."}

Write only the JavaScript code that executes within an async function context.

The following variables are pre-injected into your runtime environment:
1. 'page': The Playwright Page object.
2. 'console': The custom console object to output log messages.

IMPORTANT:
- Do NOT assume Node.js 'assert' is available.
- Do NOT import assert or any other module.
- At the top of the generated script, always define this custom assert helper:

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

Rules for your code:
1. DO NOT import playwright, browserbase, assert, or any other modules.
2. Set the default timeout on the page at the very beginning of the script:
   \`page.setDefaultTimeout(15000);\`
3. Navigate to the target route using: 
   \`await page.goto('${baseUrl}${testCase.targetRoute || ""}', { waitUntil: 'load', timeout: ${timeoutMs} })\`
   followed by a short settle wait: \`await page.waitForTimeout(1500)\`.
4. Carefully analyze the Source File Context provided to find the EXACT forms, inputs, placeholders, buttons, and elements. Look for:
   - Input names, placeholder texts, or labels (e.g. \`page.getByPlaceholder('Enter your name')\` or \`page.locator('input[name="email"]')\`).
   - Button texts (e.g. \`page.getByRole('button', { name: /submit/i })\` or \`page.locator('button:has-text("Submit")')\`).
5. Apply extreme selector resilience:
   - Playwright enforces strict mode for locators. If a locator matches multiple elements (e.g. \`.status-badge\` or \`div\`), calling methods like \`.click()\`, \`.isVisible()\`, \`.innerText()\`, or \`.waitFor()\` will throw a "strict mode violation" error.
   - To prevent strict mode violations, ALWAYS resolve locators to a single element. If you declare a locator in a variable, ALWAYS append \`.first()\` or \`.nth(0)\` immediately in the variable declaration itself!
      Incorrect: \`const badge = page.locator('.status-badge');\` (followed by \`await badge.waitFor();\`)
      Correct: \`const badge = page.locator('.status-badge').first();\` (followed by \`await badge.waitFor();\`)
    - ALWAYS resolve locators to a single element: \`await page.locator('.status-badge').first().waitFor({ state: 'visible', timeout: 3000 })\` or \`await locator.first().click()\`
   - If a specific selector or locator might fail, use flexible text-matching locators or check multiple variations.
   - ALWAYS wait for an element to be visible before interacting with it: \`await page.waitForSelector('selector-or-text', { state: 'visible', timeout: 3000 }).catch(() => {})\`.
   - **CRITICAL**: Scroll elements into view before interaction, but ALWAYS specify a short timeout AND catch errors with \`.catch(() => {})\` to prevent CSS transition/stability animations from throwing timeouts: \`await locator.first().scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});\`
   - **CRITICAL**: If standard click fails, throws a timeout, or times out due to stability, try forcing it or using DOM-based dispatch click as a safe backup (always specify a short timeout):
     \`await locator.first().click({ force: true, timeout: 2500 }).catch(async () => { await locator.first().evaluate(node => node.click()).catch(() => {}) })\`
6. Introduce generous settling times:
   - Add \`await page.waitForTimeout(1000)\` after major actions (clicks, inputs, typing, form submissions) to allow React, Next.js, or server state updates to propagate and elements to render.
7. Use lenient, substring-based assertions:
   - Do NOT use strict case-sensitive equality matches on text contents.
   - Instead, search for presence or substring content in a relaxed, case-insensitive way. E.g.:
     \`const bodyText = await page.innerText('body');\`
     \`assert(bodyText.toLowerCase().includes('${testCase?.expectedResult?.toLowerCase().replace(/'/g, "\\'")}'), 'Expected result state not matched');\`
   - Or assert visibility of key success elements instead of exact string matching.
8. Print descriptive logs at each step using \`console.log()\` to make debugging a breeze for the user.
9. Return ONLY the raw JavaScript executable code.
10. DO NOT wrap the code in markdown code blocks like \`\`\`javascript or \`\`\`.
11. DO NOT include any explanation.
12. Just return the executable code.
13. To prevent Playwright network response race conditions, never use 'page.waitForResponse()' after a 'page.goto()' or 'page.click()'. Instead, either set up the response listener/promise *before* the action using Promise.all(), or don't use 'page.waitForResponse()' at all if the navigation/action already loaded the content.
14. Always test through the frontend interface. Do NOT use page.evaluate() to run browser-side fetch() API calls to the server. Instead, simulate a real user by locating fields, typing values, and clicking buttons (e.g. using page.fill(), page.click(), etc.). The ONLY exception is when using page.evaluate() to read DOM properties, check accessibility attributes, or measure performance timing.
`;

            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: prompt,
            });

            let generatedCode = response.text || "";
            // Clean up any stray markdown wrappers just in case
            generatedCode = generatedCode.replace(/^```javascript\s*/i, "");
            generatedCode = generatedCode.replace(/^```js\s*/i, "");
            generatedCode = generatedCode.replace(/```$/, "");
            generatedCode = generatedCode.trim();

            if (!generatedCode) {
                return NextResponse.json(
                    { error: "Gemini failed to generate an automation script" },
                    { status: 500 }
                );
            }

            scriptText = generatedCode;

            // Save the generated script immediately to database
            await withRetry(() =>
                db
                    .update(TestCasesTable)
                    .set({
                        browserbaseScript: scriptText,
                        status: "running",
                    })
                    .where(eq(TestCasesTable.id, testCase.id))
            );
        } else {
            // 3. Mark database status as running
            await withRetry(() =>
                db
                    .update(TestCasesTable)
                    .set({ status: "running" })
                    .where(eq(TestCasesTable.id, testCase.id))
            );
        }

        const logs: string[] = [];
        const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            error: (...args: any[]) => logs.push(`[ERROR] ` + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            warn: (...args: any[]) => logs.push(`[WARN] ` + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        };

        let session: any = null;
        let browser: any = null;

        try {
            // 4. Create Browserbase Session (with 5-minute timeout)
            session = await bb.sessions.create({
                projectId: process.env.BROWSERBASE_PROJECT_ID!,
                timeout: 300,
            });

            logs.push(`[SYSTEM] Browserbase session created successfully with ID: ${session.id}`);
            logs.push(`[SYSTEM] Test Type: ${testCase.type.toUpperCase()} | Priority: ${(testCase as any).priority || 'medium'}`);
            logs.push(`[SYSTEM] Target: ${baseUrl}${testCase.targetRoute || '/'}`);

            browser = await chromium.connectOverCDP(session.connectUrl);
            const context = browser.contexts()[0];
            const page = context.pages()[0];

            // 6. Listen to Browser Console Events
            page.on("console", (msg: any) => {
                logs.push(`[BROWSER] [${msg.type().toUpperCase()}] ${msg.text()}`);
            });

            logs.push(`[SYSTEM] Connected to Browserbase cloud browser, executing ${testCase.type} test script...`);

            // 7. Compile and run script
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            const runFn = new AsyncFunction("page", "assert", "console", scriptText);

            // Mock assertion helper for runtime container if script assumes assert is global
            const assertHelper = (condition: boolean, message?: string) => {
                if (!condition) {
                    throw new Error(message || "Assertion failed");
                }
            };

            await runFn(page, assertHelper, customConsole);

            logs.push(`[SYSTEM] ✅ ${testCase.type.toUpperCase()} test execution completed successfully!`);

            // 8. Clean up session and browser
            await page.close().catch(() => { });
            await browser.close().catch(() => { });

            // 9. Update DB Status to passed
            await withRetry(() =>
                db
                    .update(TestCasesTable)
                    .set({
                        status: "passed",
                        browserbaseScript: scriptText,
                        logs: logs,
                        sessionId: session.id,
                        sessionUrl: `https://www.browserbase.com/sessions/${session.id}`,
                    })
                    .where(eq(TestCasesTable.id, testCase.id))
            );

            return NextResponse.json({
                success: true,
                status: "passed",
                sessionId: session.id,
                sessionUrl: `https://www.browserbase.com/sessions/${session.id}`,
                logs,
                browserbaseScript: scriptText,
            });
        } catch (execError: any) {
            console.error("Script execution error:", execError);
            logs.push(`[SYSTEM ERROR] ❌ ${testCase.type.toUpperCase()} test failed: ${execError.message || String(execError)}`);

            // Clean up session and browser if still active
            if (browser) {
                await browser.close().catch(() => { });
            }

            // 10. Update DB Status to failed
            await withRetry(() =>
                db
                    .update(TestCasesTable)
                    .set({
                        status: "failed",
                        browserbaseScript: scriptText,
                        logs: logs,
                        sessionId: session?.id || null,
                        sessionUrl: session ? `https://www.browserbase.com/sessions/${session.id}` : null,
                    })
                    .where(eq(TestCasesTable.id, testCase.id))
            );

            return NextResponse.json({
                success: false,
                status: "failed",
                error: execError.message || String(execError),
                sessionId: session?.id,
                sessionUrl: session ? `https://www.browserbase.com/sessions/${session.id}` : null,
                logs,
                browserbaseScript: scriptText,
            });
        }
    } catch (error: any) {
        console.error("API endpoint error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "An unexpected error occurred",
            },
            { status: 500 }
        );
    }
}