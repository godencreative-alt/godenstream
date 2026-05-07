"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  LanguageIcon,
} from "@heroicons/react/24/solid";
import { STORAGE_KEYS } from "@/lib/constants";

interface VideoPlayerProps {
  src: string;
  qualities?: Record<string, string> | null;
  subtitleUrl?: string | null;
  subtitles?: { lang: string; url: string }[] | null;
  backHref?: string;
  dramaTitle?: string;
  episodeLabel?: string;
  prevHref?: string | null;
  nextHref?: string | null;
  episodeOptions?: {
    label: string;
    href: string;
    active?: boolean;
    locked?: boolean;
  }[];
  isLandscape?: boolean;
  accentColor?: string;
  subscriptionTier?: string;
  startTime?: number;
  onProgress?: (progress: number, duration: number) => void;
  onEnded?: () => void;
}

function parseTimestamp(ts: string): number {
  const parts = ts.split(":");
  if (parts.length === 3) {
    return (
      parseFloat(parts[0]) * 3600 +
      parseFloat(parts[1]) * 60 +
      parseFloat(parts[2])
    );
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(parts[0]);
}

function parseVTT(
  vttText: string,
): { start: number; end: number; text: string }[] {
  const blocks = vttText.split(/\n\s*\n/).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.trim().split("\n");
      const timeLine = lines.findIndex((l) => l.includes("-->"));
      if (timeLine < 0) return null;

      const [startStr, endStr] = lines[timeLine].split("-->");
      const start = parseTimestamp(startStr.trim());
      const end = parseTimestamp(endStr.trim());

      const text = lines
        .slice(timeLine + 1)
        .join("\n")
        .replace(
          /<(i|b|u|em|strong)\b[^>]*>/gi,
          (_, t: string) => `<${t.toLowerCase()}>`,
        )
        .replace(
          /<\/(i|b|u|em|strong)>/gi,
          (_, t: string) => `</${t.toLowerCase()}>`,
        )
        .replace(/<[^>]*>/g, "");

      return { start, end, text };
    })
    .filter(Boolean) as { start: number; end: number; text: string }[];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
  qualities,
  subtitleUrl,
  subtitles,
  backHref,
  dramaTitle,
  episodeLabel,
  episodeOptions,
  isLandscape = true,
  accentColor = "var(--dc-gold)",
  startTime,
  onProgress,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSaveRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const skipTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<string>("");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [currentSubLang, setCurrentSubLang] = useState<string | null>(null);
  const [cues, setCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [skipIndicator, setSkipIndicator] = useState<string | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sortedQualities = qualities
    ? Object.keys(qualities).sort((a, b) => {
        const order: Record<string, number> = {
          "1080p": 4,
          "720p": 3,
          "480p": 2,
          "360p": 1,
        };
        return (order[b] ?? 0) - (order[a] ?? 0);
      })
    : [];

  const activeSrc = currentQuality && qualities?.[currentQuality]
    ? qualities[currentQuality]
    : src;

  useEffect(() => {
    if (sortedQualities.length > 0 && !currentQuality) {
      setCurrentQuality(sortedQualities[0]);
    }
  }, [sortedQualities, currentQuality]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    if (activeSrc.endsWith(".m3u8") || activeSrc.includes(".m3u8?")) {
      if (Hls.isSupported()) {
        hlsRef.current?.destroy();
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(activeSrc);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (
        video.canPlayType("application/vnd.apple.mpegurl")
      ) {
        video.src = activeSrc;
      }
    } else {
      video.src = activeSrc;
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [activeSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !startTime) return;
    function handleLoaded() {
      if (startTime && video) video.currentTime = startTime;
    }
    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, [startTime]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
      if (saved) setVolume(parseFloat(saved));
    }
  }, []);

  useEffect(() => {
    const subUrl = currentSubLang
      ? subtitles?.find((s) => s.lang === currentSubLang)?.url || subtitleUrl
      : subtitleUrl;

    if (!subUrl) {
      setCues([]);
      return;
    }

    fetch(subUrl)
      .then((r) => r.text())
      .then((text) => setCues(parseVTT(text)))
      .catch(() => setCues([]));
  }, [currentSubLang, subtitleUrl, subtitles]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      container.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const maxTime = Number.isFinite(video.duration) ? video.duration : video.currentTime + seconds;
    video.currentTime = Math.max(0, Math.min(maxTime, video.currentTime + seconds));
    setCurrentTime(video.currentTime);
    setSkipIndicator(seconds > 0 ? "+10 detik" : "-10 detik");
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = setTimeout(() => setSkipIndicator(null), 700);
  }, []);

  const goBack = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
      return;
    }
    if (backHref) {
      window.location.href = backHref;
      return;
    }
    window.history.back();
  }, [backHref]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowLeft":
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "ArrowRight":
          video.currentTime = Math.min(
            video.duration,
            video.currentTime + 10,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          setVolume(video.volume);
          break;
        case "ArrowDown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          setVolume(video.volume);
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    const now = Date.now();
    if (now - lastSaveRef.current >= 10_000) {
      lastSaveRef.current = now;
      onProgress?.(video.currentTime, video.duration);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * duration;
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
    localStorage.setItem(STORAGE_KEYS.VOLUME, String(val));
  }

  function showControlsTemporarily() {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && Boolean(target.closest("button, input, select, a"));
  }

  function handlePlayerPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (isInteractiveTarget(e.target)) return;
    showControlsTemporarily();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const now = Date.now();
    const lastTap = lastTapRef.current;
    const isDoubleTap = lastTap && now - lastTap.time < 300 && Math.abs(x - lastTap.x) < 90;

    if (isDoubleTap) {
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
      lastTapRef.current = null;
      seekBy(x < rect.width / 2 ? -10 : 10);
      return;
    }

    lastTapRef.current = { time: now, x };
    if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
    singleTapTimeoutRef.current = setTimeout(() => {
      lastTapRef.current = null;
      togglePlay();
    }, 240);
  }

  const currentCue = cues.find(
    (c) => currentTime >= c.start && currentTime <= c.end,
  );
  const playerSizeClass = isFullscreen
    ? "h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] rounded-none"
    : isLandscape
      ? "aspect-video max-h-[calc(100svh-9rem)] max-w-full"
      : "aspect-[9/16] max-h-[calc(100svh-9rem)] w-full max-w-[min(100%,44svh)]";

  return (
    <div
      ref={containerRef}
      className={`group relative mx-auto bg-black ${playerSizeClass} overflow-hidden`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onPointerUp={handlePlayerPointerUp}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => onEnded?.()}
      />

      {isFullscreen && (
        <div
          className={`absolute left-0 right-0 top-0 z-40 flex items-center justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent px-3 py-3 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex min-w-0 items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold text-white hover:bg-black/70"
            aria-label="Kembali"
          >
            <ArrowLeftIcon className="h-4 w-4 shrink-0" />
            <span className="hidden max-w-[34vw] truncate sm:block">
              {dramaTitle || "Kembali"}
            </span>
          </button>

          {episodeOptions?.length ? (
            <label className="relative flex items-center rounded-full bg-black/50 px-3 py-2 text-xs font-semibold text-white">
              <span className="mr-2">{episodeLabel || "Episode"}</span>
              <select
                value={episodeOptions.find((option) => option.active)?.href || ""}
                onChange={(event) => {
                  if (event.target.value) window.location.href = event.target.value;
                }}
                className="appearance-none bg-transparent pr-5 text-white outline-none"
                aria-label="Pilih episode"
              >
                {episodeOptions.map((option) => (
                  <option key={option.href} value={option.href} className="bg-zinc-950 text-white">
                    {option.locked ? "🔒 " : ""}{option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-white/70" />
            </label>
          ) : null}
        </div>
      )}

      {skipIndicator && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/65 px-4 py-2 text-sm font-bold text-white">
          {skipIndicator}
        </div>
      )}

      {/* Subtitle overlay */}
      {currentCue && (
        <div
          className="pointer-events-none absolute bottom-16 left-0 right-0 z-50 text-center"
          style={{ transform: "translateZ(0)" }}
        >
          <span className="inline-block whitespace-pre-line rounded bg-black/70 px-3 py-1 text-sm text-white">
            {currentCue.text}
          </span>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-16">
          {/* Progress bar */}
          <div
            className="mb-3 h-1 cursor-pointer rounded-full bg-white/20"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-white/80"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>

              <div className="hidden items-center gap-1 sm:flex">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-white/80"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <SpeakerXMarkIcon className="h-5 w-5" />
                  ) : (
                    <SpeakerWaveIcon className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-16 accent-white"
                />
              </div>

              <span className="whitespace-nowrap text-[12px] text-white/60">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Quality selector */}
              {sortedQualities.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowSubMenu(false);
                    }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/10"
                    aria-label="Quality settings"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    {currentQuality || "Auto"}
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-white/[0.08] bg-[#0e0e0e]/98 p-1 shadow-2xl">
                      {sortedQualities.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setCurrentQuality(q);
                            setShowQualityMenu(false);
                          }}
                          className={`block w-full rounded-lg px-3 py-1.5 text-left text-[12px] ${
                            q === currentQuality
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/[0.05]"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitle selector */}
              {subtitles && subtitles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSubMenu(!showSubMenu);
                      setShowQualityMenu(false);
                    }}
                    className="rounded-lg p-1 text-white/70 hover:bg-white/10"
                    aria-label="Subtitles"
                  >
                    <LanguageIcon className="h-4 w-4" />
                  </button>
                  {showSubMenu && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-white/[0.08] bg-[#0e0e0e]/98 p-1 shadow-2xl">
                      <button
                        onClick={() => {
                          setCurrentSubLang(null);
                          setShowSubMenu(false);
                        }}
                        className={`block w-full rounded-lg px-3 py-1.5 text-left text-[12px] ${
                          !currentSubLang
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/[0.05]"
                        }`}
                      >
                        Off
                      </button>
                      {subtitles.map((s) => (
                        <button
                          key={s.lang}
                          onClick={() => {
                            setCurrentSubLang(s.lang);
                            setShowSubMenu(false);
                          }}
                          className={`block w-full rounded-lg px-3 py-1.5 text-left text-[12px] ${
                            s.lang === currentSubLang
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/[0.05]"
                          }`}
                        >
                          {s.lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-white/80"
                aria-label="Fullscreen"
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Play overlay when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="rounded-full bg-black/50 p-4 text-white transition-transform hover:scale-110"
            aria-label="Play"
          >
            <PlayIcon className="h-12 w-12" />
          </button>
        </div>
      )}
    </div>
  );
}
