
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

import { db, withRetry } from "@/db";
import { cookies } from "next/headers";
import { TestCasesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const maxDuration = 300;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const ALLOWED_EXTENSIONS = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".py",
    ".cpp",
    ".h",
    ".hpp",
    ".c",
    ".cc",
    ".java",
    ".go",
    ".rs",
];

const IMPORTANT_FILES = [
    "package.json",
    "next.config",
    "middleware",
    "app/",
    "pages/",
    "components/",
    "src/",
    "lib/",
    "utils/",
    "actions/",
    "api/",
    "server/",
];

const IGNORE_PATHS = [
    "node_modules",
    ".next",
    "dist",
    "build",
    ".git",
    "coverage",
    "public/",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".webp",
    ".mp4",
    ".mov",
];

function isUsefulFile(path: string) {
    const isIgnored = IGNORE_PATHS.some((item) => path.includes(item));

    const isAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
        path.endsWith(ext)
    );

    const isRootFile = !path.includes("/");

    const isImportantPath = isRootFile || IMPORTANT_FILES.some((item) =>
        path.includes(item)
    );

    return !isIgnored && isAllowedExtension && isImportantPath;
}

async function getRepoTree({
    owner,
    repo,
    branch,
    githubToken,
}: {
    owner: string;
    repo: string;
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
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers }
    );

    if (!res.ok) {
        throw new Error("Failed to fetch GitHub repo tree");
    }

    const data = await res.json();

    return data.tree
        .filter((item: any) => item.type === "blob")
        .filter((item: any) => isUsefulFile(item.path))
        .slice(0, 25);
}

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

// Maximum test cases allowed per repository
const MAX_TEST_CASES_PER_REPO = 15;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cookiesStore = await cookies();
        const githubToken = cookiesStore.get('gh_token')?.value;

        const {
            userId,
            repoId,
            owner,
            repo,
            branch = "main",
        } = body;

        if (!userId || !owner || !repo) {
            console.log("Validation failed:", { userId, owner, repo });
            return NextResponse.json(
                {
                    error: "userId, owner, and repo are required",
                },
                { status: 400 }
            );
        }

        // Check how many test cases already exist for this repo (with retry)
        const existingTestCases = await withRetry(() =>
            db
                .select()
                .from(TestCasesTable)
                .where(eq(TestCasesTable.repoId, String(repoId)))
        );

        const existingCount = existingTestCases.length;

        if (existingCount >= MAX_TEST_CASES_PER_REPO) {
            return NextResponse.json(
                {
                    error: `Maximum of ${MAX_TEST_CASES_PER_REPO} test cases allowed per repository. You currently have ${existingCount}. Please delete some existing test cases before generating new ones.`,
                },
                { status: 400 }
            );
        }

        const remainingSlots = MAX_TEST_CASES_PER_REPO - existingCount;
        const testCaseCount = Math.min(remainingSlots, 10); // Generate up to 10 at a time, capped by remaining slots

        // 1. Get repo tree
        const repoFiles = await getRepoTree({
            owner,
            repo,
            branch,
            githubToken,
        });

        // 2. Read useful files
        const fileContents = await Promise.all(
            repoFiles.map((file: any) =>
                readGithubFile({
                    owner,
                    repo,
                    branch,
                    path: file.path,
                    githubToken,
                })
            )
        );

        const validFiles = fileContents.filter(Boolean);

        if (validFiles.length === 0) {
            console.log("No useful files found in repository:", { owner, repo, branch });
            return NextResponse.json(
                {
                    error: "No useful source files found in this repository",
                },
                { status: 400 }
            );
        }

        // 3. Prepare compact repo context
        const repoContext = validFiles
            .map(
                (file: any) => `
File Path: ${file.path}

File Content:
${file.content}
`
            )
            .join("\n\n----------------------\n\n");

        // 4. Ask Gemini to generate test cases with metadata
        const prompt = `
You are an expert QA automation engineer specializing in frontend browser-based testing.

Analyze the GitHub repository source code and generate useful test cases that can ALL be executed entirely through the frontend browser UI on the deployed website.

CRITICAL REQUIREMENT: Every test case must be testable by a headless browser visiting the deployed web application's frontend pages. The browser will navigate to pages, interact with UI elements (forms, buttons, links, inputs), and verify visible results. Do NOT generate test cases that require direct backend API calls, database queries, or server-side operations.

Repository:
Owner: ${owner}
Repo: ${repo}
Branch: ${branch}

Repository File Context:
${repoContext}

Generate exactly ${testCaseCount} test cases, ensuring a VARIETY across these testing categories:

Test Type Definitions (use these exact type values):
- "functional" — Tests core features by interacting with the UI (e.g., submitting a form, navigating between pages, completing a workflow)
- "ui" — Tests visual layout, responsive design, element visibility, and CSS styling by inspecting rendered DOM
- "auth" — Tests authentication flows through the frontend (login page, sign-up page, protected route redirects, logout)
- "form" — Tests form validation (required fields, input formats, error messages) by filling and submitting forms
- "integration" — Tests end-to-end user workflows that span multiple pages or components
- "regression" — Tests for previously working features to ensure they haven't broken (page loads correctly, key elements present)
- "smoke" — Quick sanity tests: page loads, critical elements visible, no console errors, core navigation works
- "performance" — Tests page load time, measures time to interactive, checks for slow renders through the browser
- "accessibility" — Tests for ARIA labels, keyboard navigation, color contrast, screen reader compatibility via DOM inspection
- "security" — Tests for XSS vulnerability by attempting script injection in input fields, tests CSRF protections through forms
- "edge-case" — Tests boundary conditions through the UI (empty inputs, very long strings, special characters in forms)

Each test case must include:
- title: clear, specific test case title
- description: one-line description of the browser-based user action (e.g. "Navigate to /login, fill email and password fields, click submit, verify dashboard loads")
- type: one of the types listed above
- priority: "low", "medium", or "high"
- targetRoute: the frontend route/page path where the browser should navigate to test (e.g. /, /sign-in, /dashboard, /workspace). NEVER target backend API paths like /api/...
- targetFiles: related source file paths from the repository context that contain the UI code being tested
- expectedResult: what the browser should see/verify after the test action (visible text, element state, URL change, visual feedback)

Important rules:
- ALL test cases must be executable through a browser visiting the deployed website
- Only target frontend pages/routes, NEVER API routes
- Only reference file paths that exist in the provided repository context
- Ensure a mix of different test types — do NOT generate all of the same type
- Prioritize "high" for auth, core functional flows. "medium" for form validations, UI checks. "low" for edge-cases and performance.
- Keep description short, action-oriented, one line only
- Return only valid JSON
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        testCases: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: {
                                        type: Type.STRING,
                                    },
                                    description: {
                                        type: Type.STRING,
                                    },
                                    type: {
                                        type: Type.STRING,
                                        enum: [
                                            "functional",
                                            "ui",
                                            "auth",
                                            "form",
                                            "integration",
                                            "regression",
                                            "smoke",
                                            "performance",
                                            "accessibility",
                                            "security",
                                            "edge-case",
                                            "api",
                                        ],
                                    },
                                    priority: {
                                        type: Type.STRING,
                                        enum: ["low", "medium", "high"],
                                    },
                                    targetRoute: {
                                        type: Type.STRING,
                                    },
                                    targetFiles: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.STRING,
                                        },
                                    },
                                    expectedResult: {
                                        type: Type.STRING,
                                    },
                                },
                                required: [
                                    "title",
                                    "description",
                                    "type",
                                    "priority",
                                    "targetRoute",
                                    "targetFiles",
                                    "expectedResult",
                                ],
                            },
                        },
                    },
                    required: ["testCases"],
                },
            },
        });

        const aiResult = JSON.parse(response.text || "{}");
        let testCases = aiResult.testCases || [];

        // Enforce maximum cap
        if (testCases.length + existingCount > MAX_TEST_CASES_PER_REPO) {
            testCases = testCases.slice(0, MAX_TEST_CASES_PER_REPO - existingCount);
        }

        if (!testCases.length) {
            console.log("Gemini did not generate any test cases from response:", response.text);
            return NextResponse.json(
                {
                    error: "Gemini did not generate any test cases",
                },
                { status: 400 }
            );
        }

        // 5. Save generated test cases to Neon DB (with retry)
        const insertedTestCases = await withRetry(() =>
            db
                .insert(TestCasesTable)
                .values(
                    testCases.map((testCase: any) => ({
                        userId,
                        repoId,
                        repoName: repo,
                        repoOwner: owner,
                        branch,

                        title: testCase.title,
                        description: testCase.description,
                        type: testCase.type,
                        priority: testCase.priority,

                        targetRoute: testCase.targetRoute,
                        targetFiles: testCase.targetFiles || [],
                        expectedResult: testCase.expectedResult,

                        status: "generated",
                    }))
                )
                .returning()
        );

        return NextResponse.json({
            success: true,
            message: "Test cases generated successfully",
            count: insertedTestCases.length,
            totalCount: existingCount + insertedTestCases.length,
            maxAllowed: MAX_TEST_CASES_PER_REPO,
            testCases: insertedTestCases,
        });
    } catch (error: any) {
        console.error("Generate test cases error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to generate test cases",
            },
            { status: 500 }
        );
    }
}