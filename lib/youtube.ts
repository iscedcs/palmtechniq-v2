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
    let videoId = "";

    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      videoId = parsed.pathname.replace("/", "");
    } else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1]?.split("?")[0] || "";
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }

    if (!videoId) return url;

    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      iv_load_policy: "3",
      showinfo: "0",
    });

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return url;
  }
};
