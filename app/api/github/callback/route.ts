import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/workspace?error=missing_code', req.url))
    }

    const host = req.headers.get("host") || "testforge-autotest.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/github/callback`;

    const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID!,
            client_secret: process.env.GITHUB_CLIENT_SECRET!,
            code,
            redirect_uri: redirectUri,
        })
    })

    const data = await res.json();
    console.log("GitHub Token Exchange Response:", data);
    const token = data.access_token;

    if (!token) {
        const errorType = data.error || 'token_exchange-failed';
        const errorReason = data.error_description || '';
        return NextResponse.redirect(new URL(`/workspace?error=${errorType}&reason=${encodeURIComponent(errorReason)}`, req.url));
    }

    const cookieStore = await cookies();

    // store token in http-only cookie via Next.js cookies API
    cookieStore.set('gh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax'
    });

    return NextResponse.redirect(new URL('/workspace', req.url));
}