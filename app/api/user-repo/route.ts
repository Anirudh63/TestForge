import { db, withRetry } from "@/db";
import { repositories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { repoId, userId, name, full_name, private_, html_url, description, language, updated_at, default_branch, owner } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Check if this repo is already added by this user (with retry)
        const existing = await withRetry(() =>
            db.select().from(repositories).where(
                and(
                    eq(repositories.repoId, repoId),
                    eq(repositories.userId, userId)
                )
            )
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: "This repository is already added to your workspace" },
                { status: 409 }
            );
        }

        console.log("Saving repository with details:", {
            repoId,
            userId,
            name,
            fullName: full_name,
            private: private_ ? 1 : 0,
            htmlUrl: html_url,
            description,
            owner,
            language,
            defaultBranch: default_branch
        });

        const result = await withRetry(() =>
            db.insert(repositories).values({
                repoId,
                userId,
                name,
                fullName: full_name,
                private: private_ ? 1 : 0,
                htmlUrl: html_url,
                description,
                owner,
                language,
                defaultBranch: default_branch
            }).returning()
        );

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error("Error saving repository to DB:", error);
        return NextResponse.json({ error: error.message || "Failed to save repository" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get("userId");

    if (!userIdStr) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userId = Number(userIdStr);
    if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid User ID format" }, { status: 400 });
    }

    try {
        const result = await withRetry(() =>
            db.select().from(repositories).where(
                eq(repositories.userId, userId)
            )
        );
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error fetching repositories:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch repositories" }, { status: 500 });
    }
}