import jwt from "jsonwebtoken";

/**
 * Zoom API Integration for Mentorship Sessions
 * Uses Zoom REST API with OAuth 2.0 server-to-server authentication
 */

interface ZoomMeetingInput {
  topic: string;
  startTime: string; // ISO 8601 format: 2024-02-19T14:00:00Z
  duration: number; // minutes
  mentorEmail: string;
  studentEmail: string;
  description?: string;
}

interface ZoomMeetingResponse {
  meetingId: string;
  joinUrl: string;
  startUrl: string;
  password?: string;
  createdAt: string;
}

class ZoomIntegrationError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "ZoomIntegrationError";
  }
}

/**
 * Generate Zoom OAuth access token using server-to-server authentication
 */
async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new ZoomIntegrationError("Zoom credentials not configured");
  }

  try {
    const payload = {
      iss: clientId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
    };

    const token = jwt.sign(payload, clientSecret, {
      algorithm: "HS256",
    });

    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "account_credentials",
        account_id: accountId,
        assertion: token,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ZoomIntegrationError(
        `Failed to get Zoom token: ${error.reason || "Unknown error"}`,
        response.status
      );
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    if (error instanceof ZoomIntegrationError) throw error;
    throw new ZoomIntegrationError(`Token generation failed: ${error}`);
  }
}

/**
 * Create a Zoom meeting for a mentorship session
 */
export async function createZoomMeeting(input: ZoomMeetingInput): Promise<ZoomMeetingResponse> {
  try {
    const accessToken = await getZoomAccessToken();
    const startTime = new Date(input.startTime);
    const payload = {
      topic: input.topic,
      type: 2, // Scheduled meeting
      start_time: startTime.toISOString().replace("Z", ""),
      duration: input.duration,
      timezone: "UTC",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        waiting_room: false,
        auto_recording: "cloud",
        close_registration: false,
        meeting_authentication: false,
      },
    };

    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ZoomIntegrationError(
        `Failed to create Zoom meeting: ${error.message || "Unknown error"}`,
        response.status
      );
    }

    const data = await response.json();

    return {
      meetingId: data.id,
      joinUrl: data.join_url,
      startUrl: data.start_url,
      password: data.password || undefined,
      createdAt: data.created_at,
    };
  } catch (error) {
    if (error instanceof ZoomIntegrationError) throw error;
    throw new ZoomIntegrationError(`Failed to create meeting: ${error}`);
  }
}

/**
 * Get Zoom meeting details
 */
export async function getZoomMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ZoomIntegrationError(
        `Failed to fetch meeting: ${error.message || "Unknown error"}`,
        response.status
      );
    }

    const data = await response.json();

    return {
      meetingId: data.id,
      joinUrl: data.join_url,
      startUrl: data.start_url,
      password: data.password || undefined,
      createdAt: data.created_at,
    };
  } catch (error) {
    if (error instanceof ZoomIntegrationError) throw error;
    throw new ZoomIntegrationError(`Failed to get meeting: ${error}`);
  }
}

/**
 * Update a Zoom meeting
 */
export async function updateZoomMeeting(
  meetingId: string,
  updates: Partial<ZoomMeetingInput>
): Promise<void> {
  try {
    const accessToken = await getZoomAccessToken();
    const payload: Record<string, any> = {};

    if (updates.topic) payload.topic = updates.topic;
    if (updates.duration) payload.duration = updates.duration;
    if (updates.startTime) {
      const startTime = new Date(updates.startTime);
      payload.start_time = startTime.toISOString().replace("Z", "");
    }

    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ZoomIntegrationError(
        `Failed to update meeting: ${error.message || "Unknown error"}`,
        response.status
      );
    }
  } catch (error) {
    if (error instanceof ZoomIntegrationError) throw error;
    throw new ZoomIntegrationError(`Failed to update meeting: ${error}`);
  }
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new ZoomIntegrationError(
        `Failed to delete meeting: ${error.message || "Unknown error"}`,
        response.status
      );
    }
  } catch (error) {
    if (error instanceof ZoomIntegrationError) throw error;
    throw new ZoomIntegrationError(`Failed to delete meeting: ${error}`);
  }
}

/**
 * Get meeting recordings
 */
export async function getZoomMeetingRecordings(
  meetingId: string
): Promise<Array<{ id: string; startTime: string; topic: string; recordingUrl?: string }>> {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ZoomIntegrationError(
        `Failed to fetch recordings: ${error.message || "Unknown error"}`,
        response.status
      );
    }

    const data = await response.json();

    return (data.recording_files || []).map((file: any) => ({
      id: file.id,
      startTime: data.start_time,
      topic: data.topic,
      recordingUrl: file.download_url,
    }));
  } catch (error) {
    if (error instanceof ZoomIntegrationError) throw error;
    throw new ZoomIntegrationError(`Failed to get recordings: ${error}`);
  }
}
