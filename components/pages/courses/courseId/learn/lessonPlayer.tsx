"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Captions,
  FileText,
  PictureInPicture2,
  Settings,
  Search,
  X,
} from "lucide-react";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";
import { fetchVttCues, findActiveCueIndex, formatCueTimestamp, type VttCue } from "@/lib/vtt";

export interface VideoPlayerProps {
  lessonId: string;
  poster?: string;
  autoPlay?: boolean;
  markLessonComplete: () => void | Promise<void>;
  goToNextLesson?: () => void;
  onDurationChange?: (duration: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time < 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function VideoPlayer({
  lessonId,
  poster,
  autoPlay = false,
  markLessonComplete,
  goToNextLesson,
  onDurationChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const controlsHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The parent re-creates these callback props on every render of its own
  // (e.g. opening the AI assistant just toggles unrelated state there). Kept
  // in refs so the YouTube-init effect below can call whatever the latest
  // version is without listing them as dependencies — otherwise that effect
  // re-runs on every unrelated parent render, destroying and recreating the
  // YouTube player and restarting the video from 0.
  const markLessonCompleteRef = useRef(markLessonComplete);
  const goToNextLessonRef = useRef(goToNextLesson);
  const onDurationChangeRef = useRef(onDurationChange);
  useEffect(() => {
    markLessonCompleteRef.current = markLessonComplete;
    goToNextLessonRef.current = goToNextLesson;
    onDurationChangeRef.current = onDurationChange;
  });

  const [src, setSrc] = useState<string | null>(null);
  const [captionsUrl, setCaptionsUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);

  const isYoutube = src ? isYoutubeUrl(src) : false;
  const youtubeEmbedUrl = isYoutube && src ? toYoutubeEmbedUrl(src) : "";
  const youtubeVideoId = isYoutube
    ? youtubeEmbedUrl.split("/embed/")[1]?.split("?")[0]
    : "";

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Captions & transcript — both driven by the same WebVTT cues, one file
  // covering the burned-in caption overlay and the searchable side panel.
  const [cues, setCues] = useState<VttCue[]>([]);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const transcriptListRef = useRef<HTMLDivElement>(null);

  const [isPiP, setIsPiP] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Track fullscreen state and resize YouTube iframe
  useEffect(() => {
    const onFsChange = () => {
      const doc = document as any;
      const fs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(fs);
      // No iframe resize needed here: it's pinned absolute/inset-0 to its
      // wrapper permanently (see onReady above), and the wrapper itself
      // already switches between aspect-video and h-full based on isFullscreen.
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Picture-in-picture state (native <video> only — a cross-origin YouTube
  // iframe cannot be handed to the browser's PiP API).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnter = () => setIsPiP(true);
    const onLeave = () => setIsPiP(false);
    video.addEventListener("enterpictureinpicture", onEnter);
    video.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnter);
      video.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, [src]);

  // YouTube-specific state tracking
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const ytIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track YouTube playback time
  useEffect(() => {
    if (!isYoutube) return;
    ytIntervalRef.current = setInterval(() => {
      const player = youtubePlayerRef.current;
      if (player?.getCurrentTime) {
        setYtCurrentTime(player.getCurrentTime());
      }
    }, 500);
    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    };
  }, [isYoutube, src]);

  const toggleYtPlay = () => {
    const player = youtubePlayerRef.current;
    if (!player) return;
    if (ytPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const seekYt = (time: number) => {
    const player = youtubePlayerRef.current;
    if (!player) return;
    player.seekTo(time, true);
    setYtCurrentTime(time);
  };

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setCaptionsUrl(null);
    setCues([]);
    setVideoError(null);
    setIsLoadingUrl(true);

    fetch(`/api/lessons/${lessonId}/video`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load video");
        }
        const data = await res.json();
        if (!cancelled) {
          setSrc(data.videoUrl || null);
          setCaptionsUrl(data.captionsUrl || null);
        }
      })
      .catch((err) => {
        if (!cancelled) setVideoError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUrl(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // Load and parse the transcript/captions file once we know its URL.
  useEffect(() => {
    if (!captionsUrl) {
      setCues([]);
      return;
    }
    let cancelled = false;
    fetchVttCues(captionsUrl)
      .then((parsed) => {
        if (!cancelled) setCues(parsed);
      })
      .catch((error) => {
        // Missing/broken captions file: the CC and transcript controls just
        // stay hidden (hasCaptions is derived from cues.length), same as a
        // lesson with none at all — never worth breaking video playback over.
        console.warn("[lesson video] failed to load captions:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [captionsUrl]);

  const hasCaptions = cues.length > 0;
  const playedTime = isYoutube ? ytCurrentTime : currentTime;
  const activeCueIndex = useMemo(
    () => (hasCaptions ? findActiveCueIndex(cues, playedTime) : -1),
    [cues, hasCaptions, playedTime],
  );
  const activeCue = activeCueIndex >= 0 ? cues[activeCueIndex] : null;

  const filteredCues = useMemo(() => {
    const query = transcriptQuery.trim().toLowerCase();
    if (!query) return cues.map((cue, index) => ({ cue, index }));
    return cues
      .map((cue, index) => ({ cue, index }))
      .filter(({ cue }) => cue.text.toLowerCase().includes(query));
  }, [cues, transcriptQuery]);

  // Keep the active transcript line in view as playback progresses.
  useEffect(() => {
    if (!showTranscript || activeCueIndex < 0) return;
    const el = transcriptListRef.current?.querySelector(
      `[data-cue-index="${activeCueIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeCueIndex, showTranscript]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle metadata loaded (duration available)
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const loadDuration = videoRef.current.duration;
      setDuration(loadDuration);
      if (onDurationChange) {
        onDurationChange(Math.floor(loadDuration));
      }
    }
  };

  // When video ends → mark complete & auto-advance
  const handleVideoEnded = () => {
    markLessonComplete();
    goToNextLesson?.();
  };

  // Play/pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Seek
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const seek = isYoutube ? seekYt : handleSeek;
  const togglePlayPause = isYoutube ? toggleYtPlay : togglePlay;
  const playing = isYoutube ? ytPlaying : isPlaying;

  // Mute/unmute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (isYoutube) {
      const player = youtubePlayerRef.current;
      if (next) player?.mute?.();
      else player?.unMute?.();
    } else if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  const changeVolume = (next: number) => {
    const clamped = Math.min(1, Math.max(0, next));
    setVolume(clamped);
    if (clamped === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
    if (isYoutube) {
      const player = youtubePlayerRef.current;
      player?.setVolume?.(Math.round(clamped * 100));
      if (clamped === 0) player?.mute?.();
      else player?.unMute?.();
    } else if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
  };

  // Change playback speed
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (isYoutube) {
      youtubePlayerRef.current?.setPlaybackRate?.(speed);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // Some browsers refuse PiP outside a direct user gesture context or
      // when unsupported — fail quietly rather than surface a dead feature.
    }
  };

  // Cross-browser fullscreen toggle
  const toggleFullscreen = (el: HTMLElement | null | undefined) => {
    if (!el) return;
    const doc = document as any;
    if (
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement
    ) {
      (
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.msExitFullscreen
      )?.call(doc);
    } else {
      (
        el.requestFullscreen ||
        (el as any).webkitRequestFullscreen ||
        (el as any).msRequestFullscreen
      )?.call(el);
    }
  };

  // Auto-hide the control bar during playback, like every other video player.
  const wakeControls = useCallback(() => {
    setShowControls(true);
    if (controlsHideTimer.current) clearTimeout(controlsHideTimer.current);
    controlsHideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 2800);
  }, []);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (controlsHideTimer.current) clearTimeout(controlsHideTimer.current);
      return;
    }
    wakeControls();
    return () => {
      if (controlsHideTimer.current) clearTimeout(controlsHideTimer.current);
    };
  }, [playing, wakeControls]);

  useEffect(() => {
    if (autoPlay && videoRef.current && src) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [autoPlay, src]);

  useEffect(() => {
    if (!isYoutube || !youtubeVideoId) return;

    const initPlayer = () => {
      if (!youtubeContainerRef.current) return;
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
      youtubePlayerRef.current = new (window as any).YT.Player(
        youtubeContainerRef.current,
        {
          // Without these, the IFrame API defaults to a fixed 640x390 iframe
          // regardless of the container it's given — which is exactly the
          // "video floating in a sea of black" bug. "100%" lets it track
          // whatever size the absolutely-positioned wrapper below gives it.
          width: "100%",
          height: "100%",
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            controls: 0,
            disablekb: 1,
            iv_load_policy: 3,
            showinfo: 0,
            fs: 0,
            // We render our own caption overlay from the lesson's VTT file;
            // YouTube's own captions (auto-generated ones can default to
            // "on" at the account level, ignoring this param in some
            // browsers) would otherwise double up with it. Belt-and-braces
            // unloadModule call below covers that case.
            cc_load_policy: 0,
          },
          events: {
            onReady: (event: any) => {
              event?.target?.unloadModule?.("captions");
              event?.target?.setOption?.("captions", "track", {});
              // Belt-and-braces: force the actual <iframe> the API created to
              // pin to the wrapper's edges, since "100%" above isn't honoured
              // consistently across browsers when the parent isn't a plain
              // block box (ours is absolutely positioned on purpose for this).
              const iframe = event?.target?.getIframe?.();
              if (iframe) {
                iframe.style.position = "absolute";
                iframe.style.inset = "0";
                iframe.style.width = "100%";
                iframe.style.height = "100%";
              }
              const total = event?.target?.getDuration?.() ?? 0;
              setDuration(total);
              onDurationChangeRef.current?.(Math.floor(total));
            },
            onStateChange: (event: any) => {
              const YT = (window as any).YT;
              if (event?.data === YT?.PlayerState?.PLAYING) {
                setYtPlaying(true);
                // YouTube can (re)load its captions module right as playback
                // starts, after onReady/onApiChange already ran — catch that
                // case too, on every play, not just once.
                event?.target?.unloadModule?.("captions");
                event?.target?.setOption?.("captions", "track", {});
              } else if (
                event?.data === YT?.PlayerState?.PAUSED ||
                event?.data === YT?.PlayerState?.BUFFERING
              ) {
                setYtPlaying(false);
              }
              if (event?.data === YT?.PlayerState?.ENDED) {
                setYtPlaying(false);
                markLessonCompleteRef.current();
                goToNextLessonRef.current?.();
              }
            },
            // onReady's unloadModule call is too early in some browsers —
            // YouTube (re)loads its captions module lazily once playback
            // actually starts, which re-enables the native overlay right on
            // top of ours. onApiChange fires whenever that module list
            // changes, so it's the one reliable place to keep unloading it.
            onApiChange: (event: any) => {
              event?.target?.unloadModule?.("captions");
              event?.target?.setOption?.("captions", "track", {});
            },
          },
        },
      );
    };

    if ((window as any).YT?.Player) {
      initPlayer();
      return () => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }
      };
    }

    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "youtube-iframe-api";
      document.body.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [isYoutube, youtubeVideoId, autoPlay]);

  if (isLoadingUrl) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (videoError || !src) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center">
        <p className="text-red-400 text-sm">
          {videoError || "Video not available"}
        </p>
      </div>
    );
  }

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={playerWrapperRef}
      className={`relative bg-black rounded-lg overflow-hidden group flex ${
        isFullscreen ? "w-screen h-screen" : ""
      }`}
      onMouseMove={wakeControls}
      onContextMenu={(e) => e.preventDefault()}>
      {/* Video area */}
      <div className="relative flex-1 min-w-0">
        {isYoutube ? (
          <>
            {/* YT.Player replaces the inner div with a bare <iframe> sized to
                whatever width/height its constructor got (640x390 by default) —
                it does NOT inherit this wrapper's classes. The wrapper carries
                the real aspect ratio; the inner div is pinned edge-to-edge so
                the iframe it becomes actually fills it, instead of sitting as a
                small fixed-size video inside a much larger black box. */}
            <div className={`relative z-0 w-full ${isFullscreen ? "h-full" : "aspect-video"}`}>
              <div ref={youtubeContainerRef} className="absolute inset-0" />
            </div>
            {/* Transparent overlay: click to play/pause, blocks right-click on the iframe */}
            <div
              className="absolute inset-0 z-10"
              style={{ background: "transparent" }}
              onClick={togglePlayPause}
              onDoubleClick={() => toggleFullscreen(playerWrapperRef.current)}
            />
            {!ytPlaying && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 rounded-full p-4">
                  <Play className="w-10 h-10 text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              className={`w-full ${isFullscreen ? "h-full object-contain" : "aspect-video"}`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                handleLoadedMetadata();
                setIsBuffering(false);
              }}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onEnded={handleVideoEnded}
              onClick={togglePlay}
            />
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
              </div>
            )}
          </>
        )}

        {/* Caption overlay — same cues drive this and the transcript panel */}
        {showCaptions && activeCue && (
          <div className="absolute left-0 right-0 bottom-16 z-20 flex justify-center px-6 pointer-events-none">
            <span className="max-w-[85%] rounded-md bg-black/80 px-3 py-1.5 text-center text-sm sm:text-base text-white leading-snug">
              {activeCue.text}
            </span>
          </div>
        )}

        {/* Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-4 pt-8 pb-3 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          }`}>
          {/* Seek bar */}
          <div className="mb-2">
            <Progress
              value={duration > 0 ? (playedTime / duration) * 100 : 0}
              className="h-1.5 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                seek(duration * percent);
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="text-white hover:bg-white/20 shrink-0">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                seek(Math.max(0, playedTime - 10));
              }}
              className="text-white hover:bg-white/20 hidden sm:inline-flex shrink-0">
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                seek(Math.min(duration, playedTime + 10));
              }}
              className="text-white hover:bg-white/20 hidden sm:inline-flex shrink-0">
              <SkipForward className="w-5 h-5" />
            </Button>

            {/* Volume */}
            <div
              className="relative flex items-center shrink-0"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="text-white hover:bg-white/20">
                <VolumeIcon className="w-5 h-5" />
              </Button>
              {showVolumeSlider && (
                <div
                  className="hidden sm:flex items-center bg-black/70 rounded-full px-3 py-1.5 ml-1"
                  onClick={(e) => e.stopPropagation()}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : Math.round(volume * 100)}
                    onChange={(e) => changeVolume(Number(e.target.value) / 100)}
                    className="w-20 accent-white cursor-pointer"
                    aria-label="Volume"
                  />
                </div>
              )}
            </div>

            <span className="text-white text-xs sm:text-sm tabular-nums whitespace-nowrap">
              {formatTime(playedTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Captions */}
            {hasCaptions && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCaptions((v) => !v);
                }}
                title="Captions"
                className={`hover:bg-white/20 shrink-0 ${showCaptions ? "text-white bg-white/10" : "text-white/60"}`}>
                <Captions className="w-5 h-5" />
              </Button>
            )}

            {/* Playback speed */}
            <div className="relative shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu((v) => !v);
                }}
                title="Playback speed"
                className="text-white hover:bg-white/20">
                <Settings className="w-5 h-5" />
              </Button>
              {showSpeedMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-28 rounded-lg bg-black/90 border border-white/15 py-1 z-30"
                  onClick={(e) => e.stopPropagation()}>
                  <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-white/50">
                    Speed
                  </p>
                  {SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 ${
                        speed === playbackSpeed ? "text-neon-blue font-medium" : "text-white"
                      }`}>
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Transcript */}
            {hasCaptions && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTranscript((v) => !v);
                }}
                title="Transcript"
                className={`hover:bg-white/20 shrink-0 ${showTranscript ? "text-white bg-white/10" : "text-white/60"}`}>
                <FileText className="w-5 h-5" />
              </Button>
            )}

            {/* Picture-in-picture: native video only */}
            {!isYoutube && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePiP();
                }}
                title="Minimize (picture-in-picture)"
                className={`hover:bg-white/20 shrink-0 hidden sm:inline-flex ${isPiP ? "text-white bg-white/10" : "text-white"}`}>
                <PictureInPicture2 className="w-5 h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen(playerWrapperRef.current);
              }}
              title="Fullscreen"
              className="text-white hover:bg-white/20 shrink-0">
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Transcript panel */}
      {showTranscript && hasCaptions && (
        <div className="w-full max-w-[320px] shrink-0 bg-[#0b0f10] border-l border-white/10 flex flex-col z-20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-white text-sm font-semibold">Transcript</p>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-white/60 hover:text-white"
              aria-label="Close transcript">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-3 py-2 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={transcriptQuery}
                onChange={(e) => setTranscriptQuery(e.target.value)}
                placeholder="Search transcript"
                className="w-full bg-white/5 border border-white/15 rounded-md pl-8 pr-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-neon-blue/50"
              />
            </div>
          </div>
          <div ref={transcriptListRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {filteredCues.length === 0 ? (
              <p className="text-white/40 text-sm px-2 py-4 text-center">
                No matching lines.
              </p>
            ) : (
              filteredCues.map(({ cue, index }) => (
                <button
                  key={index}
                  data-cue-index={index}
                  onClick={() => seek(cue.start)}
                  className={`w-full text-left rounded-md px-2 py-1.5 text-sm leading-snug transition-colors ${
                    index === activeCueIndex
                      ? "bg-neon-blue/20 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}>
                  <span className="text-[11px] text-neon-blue/80 tabular-nums mr-2">
                    {formatCueTimestamp(cue.start)}
                  </span>
                  {cue.text}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
