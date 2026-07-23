import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const host = req.headers.get("host") || "testforge-autotest.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/github/callback`;

    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        redirect_uri: redirectUri,
        scope: 'repo read:user'
    });

    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}