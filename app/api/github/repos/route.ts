import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookiesStore = await cookies();
    const token = cookiesStore.get('gh_token')?.value;

    if (!token) {
        return NextResponse.json({ error: "Github token not found" }, { status: 401 });
    }

    const allRespo = [];
    let page = 1;

    while (true) {
        const res = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json'
            }
        }
        )

        const respos = await res.json();
        if (!res.ok) {
            console.error(`GitHub API error status ${res.status}:`, respos);
            if (res.status === 401) {
                cookiesStore.delete('gh_token');
            }
            return NextResponse.json(
                { error: "GitHub API error", details: respos },
                { status: res.status }
            );
        }
        if (!Array.isArray(respos)) {
            console.error("GitHub API returned non-array response:", respos);
            break;
        }
        if (!respos.length) break;
        allRespo.push(...respos);
        page++;
    }


    console.log(`Fetched ${allRespo.length} repositories from GitHub.`);
    if (allRespo.length === 0) {
        console.log("No repositories were returned. Token preview:", token ? token.substring(0, 10) + "..." : "none");
    }

    return NextResponse.json(allRespo.map(r => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private_: r.private,
        html_url: r.html_url,
        description: r.description,
        updated_at: r.updated_at,
        language: r.language,
        default_branch: r.default_branch,
        owner: r.owner.login,

    })));
}