import "server-only";

export interface InstagramPost {
  id: string;
  imageUrl: string;
  permalink: string;
  caption?: string;
}

/** Latest posts from the Instagram Graph API, when INSTAGRAM_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN are set. */
export async function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
  const account = process.env.INSTAGRAM_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!account || !token) return [];
  const url = new URL(`https://graph.facebook.com/v20.0/${encodeURIComponent(account)}/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", token);
  try {
    const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: Array<Record<string, string>> };
    return (body.data ?? [])
      .map((m) => ({
        id: m.id,
        imageUrl: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
        permalink: m.permalink,
        caption: m.caption,
      }))
      .filter((p) => p.imageUrl && p.permalink)
      .slice(0, limit);
  } catch {
    return [];
  }
}
