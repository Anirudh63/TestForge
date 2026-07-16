import { db, withRetry } from "@/db";
import { TestCasesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { title, description, targetRoute, expectedResult, type, priority, testCaseId } = await req.json();

        if (!testCaseId) {
            return NextResponse.json({ error: "testCaseId is required" }, { status: 400 });
        }

        const updateData: Record<string, any> = {
            title,
            description,
            targetRoute,
            expectedResult,
            browserbaseScript: null, // Clear cached script on settings change
            status: "generated",    // Reset status
        };

        // Only update type and priority if provided
        if (type) updateData.type = type;
        if (priority) updateData.priority = priority;

        const result = await withRetry(() =>
            db.update(TestCasesTable).set(updateData)
                .where(eq(TestCasesTable.id, testCaseId)).returning()
        );

        if (result.length === 0) {
            return NextResponse.json({ error: "Test case not found" }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error("Update test case settings error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update test case" },
            { status: 500 }
        );
    }
}