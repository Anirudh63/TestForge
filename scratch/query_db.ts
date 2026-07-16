const { db, withRetry } = require("../db");
const { TestCasesTable } = require("../db/schema");

async function main() {
    console.log("Querying database test cases...");
    try {
        const cases = await withRetry(() => db.select().from(TestCasesTable));
        console.log(`Found ${cases.length} test cases:`);
        for (const tc of cases) {
            console.log(`\n========================================`);
            console.log(`ID: ${tc.id}`);
            console.log(`Title: ${tc.title}`);
            console.log(`Description: ${tc.description}`);
            console.log(`Type: ${tc.type}`);
            console.log(`Route: ${tc.targetRoute}`);
            console.log(`Expected Result: ${tc.expectedResult}`);
            console.log(`Status: ${tc.status}`);
            console.log(`Target Files:`, tc.targetFiles);
            console.log(`Session ID: ${tc.sessionId}`);
            console.log(`Session URL: ${tc.sessionUrl}`);
            console.log(`Script Preview:`);
            console.log(tc.browserbaseScript ? tc.browserbaseScript.substring(0, 1000) : "No script generated yet.");
            console.log(`Logs:`);
            console.log(tc.logs ? tc.logs.slice(-10).join("\n") : "No logs.");
        }
    } catch (err) {
        console.error("Error querying db:", err);
    }
}

main();
