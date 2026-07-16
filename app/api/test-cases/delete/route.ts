import { db, withRetry } from "@/db";
import { TestCasesTable } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { testCaseIds } = await req.json();

        if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
            return NextResponse.json(
                { error: "testCaseIds (array) is required" },
                { status: 400 }
            );
        }

        const deleted = await withRetry(() =>
            db
                .delete(TestCasesTable)
                .where(inArray(TestCasesTable.id, testCaseIds))
                .returning()
        );

        return NextResponse.json({
            success: true,
            deletedCount: deleted.length,
        });
    } catch (error: any) {
        console.error("Delete test cases error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete test cases" },
            { status: 500 }
        );
    }
}
