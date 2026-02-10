const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export const isYoutubeUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return YOUTUBE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};

export const toYoutubeEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.pathname.startsWith("/embed/")) {
      return url;
    }

    const id = parsed.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
};
