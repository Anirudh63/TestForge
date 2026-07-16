import { db, withRetry } from "@/db";
import { repositories, TestCasesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { repoId, userId } = await req.json();

        if (!repoId || !userId) {
            return NextResponse.json(
                { error: "repoId and userId are required" },
                { status: 400 }
            );
        }

        // Delete all test cases associated with this repo
        await withRetry(() =>
            db
                .delete(TestCasesTable)
                .where(eq(TestCasesTable.repoId, String(repoId)))
        );

        // Delete the repository record
        const deleted = await withRetry(() =>
            db
                .delete(repositories)
                .where(
                    and(
                        eq(repositories.repoId, repoId),
                        eq(repositories.userId, userId)
                    )
                )
                .returning()
        );

        if (deleted.length === 0) {
            return NextResponse.json(
                { error: "Repository not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Repository and associated test cases deleted successfully",
        });
    } catch (error: any) {
        console.error("Delete repository error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete repository" },
            { status: 500 }
        );
    }
}
