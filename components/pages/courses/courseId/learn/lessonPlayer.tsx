"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

export interface VideoPlayerProps {
  lessonId: string;
  poster?: string;
  autoPlay?: boolean;
  markLessonComplete: () => void | Promise<void>;
  goToNextLesson?: () => void;
  onDurationChange?: (duration: number) => void;
}

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

  const [src, setSrc] = useState<string | null>(null);
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

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state
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

      // Resize the YouTube iframe to match the new container size
      const player = youtubePlayerRef.current;
      if (player?.getIframe) {
        const iframe = player.getIframe() as HTMLIFrameElement;
        if (fs) {
          iframe.style.width = "100%";
          iframe.style.height = "100%";
        } else {
          iframe.style.width = "";
          iframe.style.height = "";
        }
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

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

  // Mute/unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Change playback speed
  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  // Format time (MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
          },
          events: {
            onReady: (event: any) => {
              const total = event?.target?.getDuration?.() ?? 0;
              setDuration(total);
              if (onDurationChange) {
                onDurationChange(Math.floor(total));
              }
            },
            onStateChange: (event: any) => {
              const YT = (window as any).YT;
              if (event?.data === YT?.PlayerState?.PLAYING) {
                setYtPlaying(true);
              } else if (
                event?.data === YT?.PlayerState?.PAUSED ||
                event?.data === YT?.PlayerState?.BUFFERING
              ) {
                setYtPlaying(false);
              }
              if (event?.data === YT?.PlayerState?.ENDED) {
                setYtPlaying(false);
                markLessonComplete();
                goToNextLesson?.();
              }
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
  }, [
    isYoutube,
    youtubeVideoId,
    autoPlay,
    markLessonComplete,
    goToNextLesson,
    onDurationChange,
  ]);

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

  if (isYoutube) {
    return (
      <div
        ref={playerWrapperRef}
        className={`relative bg-black rounded-lg overflow-hidden group ${isFullscreen ? "w-screen h-screen" : ""}`}
        onContextMenu={(e) => e.preventDefault()}>
        {/* YouTube player sits at z-0 */}
        <div
          ref={youtubeContainerRef}
          className={`relative z-0 w-full ${isFullscreen ? "h-full" : "aspect-video"}`}
        />

        {/* Transparent overlay blocks right-click on the iframe */}
        <div
          className="absolute inset-0 z-10"
          style={{ background: "transparent" }}
          onClick={toggleYtPlay}
          onDoubleClick={() => toggleFullscreen(playerWrapperRef.current)}
        />

        {/* Custom controls (visible on hover) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Seek bar */}
          <div className="mb-2">
            <Progress
              value={duration > 0 ? (ytCurrentTime / duration) * 100 : 0}
              className="h-2 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                seekYt(duration * percent);
              }}
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Play / Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleYtPlay();
              }}
              className="text-white hover:bg-white/20">
              {ytPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            {/* Skip back 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                seekYt(Math.max(0, ytCurrentTime - 10));
              }}
              className="text-white hover:bg-white/20">
              <SkipBack className="w-5 h-5" />
            </Button>

            {/* Skip forward 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                seekYt(Math.min(duration, ytCurrentTime + 10));
              }}
              className="text-white hover:bg-white/20">
              <SkipForward className="w-5 h-5" />
            </Button>

            {/* Time display */}
            <span className="text-white text-sm">
              {formatTime(ytCurrentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Playback speed */}
            <select
              value={playbackSpeed}
              onChange={(e) => {
                e.stopPropagation();
                const speed = Number(e.target.value);
                setPlaybackSpeed(speed);
                youtubePlayerRef.current?.setPlaybackRate?.(speed);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm">
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen(playerWrapperRef.current);
              }}
              className="text-white hover:bg-white/20">
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Large play button when paused */}
        {!ytPlaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-4">
              <Play className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={playerWrapperRef}
      className="relative bg-black rounded-lg overflow-hidden">
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
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Controls omitted for brevity */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-4 mb-2">
          {/* Play / Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="text-white hover:bg-white/20">
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          {/* Skip back */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSeek(Math.max(0, currentTime - 10))}
            className="text-white hover:bg-white/20">
            <SkipBack className="w-5 h-5" />
          </Button>

          {/* Skip forward */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
            className="text-white hover:bg-white/20">
            <SkipForward className="w-5 h-5" />
          </Button>

          {/* Timeline */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-white text-sm">
              {formatTime(currentTime)}
            </span>
            <Progress
              value={(currentTime / duration) * 100}
              className="flex-1 h-2 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(duration * percent);
              }}
            />
            <span className="text-white text-sm">{formatTime(duration)}</span>
          </div>

          {/* Mute / Volume */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white hover:bg-white/20">
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>

          {/* Playback speed */}
          <select
            value={playbackSpeed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm">
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFullscreen(playerWrapperRef.current)}
            className="text-white hover:bg-white/20">
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
