import { db } from "@/db";
import { repositories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { repoId, userId, name, full_name, private_, html_url, description, language, updated_at, default_branch, owner } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        console.log("Saving repository with details:", {
            repoId,
            userId,
            name,
            fullName: full_name,
            private: private_ ? 1 : 0,
            htmlUrl: html_url,
            description,
            owner
        });

        //@ts-ignore
        const result = await db.insert(repositories).values({
            repoId,
            userId,
            name,
            fullName: full_name,
            private: private_ ? 1 : 0,
            htmlUrl: html_url,
            description,
            owner
        }).returning();

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
        const result = await db.select().from(repositories).where(
            eq(repositories.userId, userId)
        );
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error fetching repositories:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch repositories" }, { status: 500 });
    }
}