export const runtime = "nodejs";

const getAccessToken = async () => {
  const clientId = process.env.YOUTUBE_CLIENT_ID ?? "";
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET ?? "";
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN ?? "";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing YouTube OAuth credentials");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`YouTube token error: ${message}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("YouTube token error: missing access token");
  }

  return data.access_token;
};

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const message = await response.text();
      return Response.json(
        { success: false, error: `YouTube channel error: ${message}` },
        { status: 500 }
      );
    }

    const data = (await response.json()) as {
      items?: { id: string; snippet?: { title?: string } }[];
    };
    const channel = data.items?.[0];

    if (!channel) {
      return Response.json(
        { success: false, error: "No channel found for this account" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      channelId: channel.id,
      channelName: channel.snippet?.title ?? "",
    });
  } catch (error) {
    console.error("YouTube Channel Error:", error);
    return Response.json(
      { success: false, error: "Unknown YouTube channel error occurred" },
      { status: 500 }
    );
  }
}
