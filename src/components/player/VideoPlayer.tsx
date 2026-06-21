"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  LanguageIcon,
  ForwardIcon,
} from "@heroicons/react/24/solid";
import { STORAGE_KEYS } from "@/lib/constants";

// Lazy-load hls.js only when needed — saves ~200KB from the initial bundle.
let HlsModule: typeof import("hls.js").default | null = null;
async function loadHls() {
  if (HlsModule) return HlsModule;
  const mod = await import("hls.js");
  HlsModule = mod.default;
  return HlsModule;
}

interface VideoPlayerProps {
  src: string;
  sourceType?: string;
  qualities?: Record<string, string> | null;
  subtitleUrl?: string | null;
  subtitles?: { lang: string; url: string }[] | null;
  isLandscape?: boolean;
  accentColor?: string;
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
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoPlayer({
  src,
  sourceType,
  qualities,
  subtitleUrl,
  subtitles,
  isLandscape = true,
  accentColor = "var(--dc-gold)",
  startTime,
  onProgress,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<InstanceType<typeof import("hls.js").default> | null>(null);
  const lastSaveRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  // Only store floored seconds for display — avoids re-rendering 4x/sec
  const [displayTime, setDisplayTime] = useState({ current: 0, duration: 0 });
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<string>("");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentSubLang, setCurrentSubLang] = useState<string | null>(null);
  const [cues, setCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Ref for raw currentTime — updated via DOM, not React state
  const currentTimeRef = useRef(0);

  const sortedQualities = useMemo(() => {
    if (!qualities) return [];
    return Object.keys(qualities).sort((a, b) => {
      const order: Record<string, number> = {
        "1080p": 4, "720p": 3, "480p": 2, "360p": 1,
      };
      return (order[b] ?? 0) - (order[a] ?? 0);
    });
  }, [qualities]);

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

    const isHls =
      sourceType === "hls" ||
      activeSrc.endsWith(".m3u8") ||
      activeSrc.includes(".m3u8?");

    let cancelled = false;

    if (isHls) {
      loadHls().then((Hls) => {
        if (cancelled || !Hls) return;
        if (Hls.isSupported()) {
          hlsRef.current?.destroy();
          const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          });
          hls.loadSource(activeSrc);
          hls.attachMedia(video);
          hlsRef.current = hls;
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = activeSrc;
        }
      });
    } else {
      video.src = activeSrc;
    }

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
    };
  }, [activeSrc, sourceType]);

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

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      /* PiP not supported */
    }
  }, []);

  const changeSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setCurrentSpeed(speed);
  }, []);

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
        case "p":
          togglePiP();
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
        case "<":
          if (currentSpeed > 0.5) changeSpeed(Math.max(0.5, currentSpeed - 0.25));
          break;
        case ">":
          if (currentSpeed < 2) changeSpeed(Math.min(2, currentSpeed + 0.25));
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, togglePiP, currentSpeed, changeSpeed]);

  /** Optimized time update: directly manipulates DOM for progress bar
   *  and only updates React state once per second for the time display. */
  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    const ct = video.currentTime;
    const dur = video.duration || 0;
    currentTimeRef.current = ct;

    // Direct DOM update for progress bar — no React re-render
    if (progressFillRef.current && dur > 0) {
      progressFillRef.current.style.width = `${(ct / dur) * 100}%`;
    }

    // Only update React state once per second for the display text
    const flooredCurrent = Math.floor(ct);
    const flooredDuration = Math.floor(dur);
    setDisplayTime((prev) => {
      if (prev.current === flooredCurrent && prev.duration === flooredDuration) return prev;
      return { current: flooredCurrent, duration: flooredDuration };
    });

    const now = Date.now();
    if (now - lastSaveRef.current >= 10_000) {
      lastSaveRef.current = now;
      onProgress?.(ct, dur);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !displayTime.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * displayTime.duration;
  }

  function handleSeekKeyboard(e: React.KeyboardEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !displayTime.duration) return;
    if (e.key === "ArrowLeft") {
      video.currentTime = Math.max(0, video.currentTime - 5);
    } else if (e.key === "ArrowRight") {
      video.currentTime = Math.min(displayTime.duration, video.currentTime + 5);
    }
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

  // Memoized subtitle cue lookup — floor to 1 decimal for stable memo key
  const currentCue = useMemo(() => {
    const t = currentTimeRef.current;
    return cues.find((c) => t >= c.start && t <= c.end);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cues, displayTime.current]);

  function closeAllMenus() {
    setShowQualityMenu(false);
    setShowSubMenu(false);
    setShowSpeedMenu(false);
  }

  return (
    <div
      ref={containerRef}
      className={`group relative w-full bg-black ${isLandscape ? "aspect-video" : "aspect-[9/16]"} overflow-hidden rounded-2xl`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => onEnded?.()}
        onClick={togglePlay}
      />

      {/* Subtitle overlay */}
      {currentCue && (
        <div
          className="pointer-events-none absolute bottom-16 left-0 right-0 z-50 text-center"
          style={{ transform: "translateZ(0)" }}
        >
          <span
            className="inline-block rounded bg-black/70 px-3 py-1 text-sm text-white"
            dangerouslySetInnerHTML={{ __html: currentCue.text }}
          />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-16">
          {/* Progress bar — keyboard accessible */}
          <div
            className="mb-3 h-1.5 cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
            onClick={handleSeek}
            onKeyDown={handleSeekKeyboard}
            role="slider"
            tabIndex={0}
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={Math.floor(displayTime.duration)}
            aria-valuenow={displayTime.current}
            aria-valuetext={`${formatTime(displayTime.current)} of ${formatTime(displayTime.duration)}`}
          >
            <div
              ref={progressFillRef}
              className="h-full rounded-full"
              style={{
                width: `${displayTime.duration ? (displayTime.current / displayTime.duration) * 100 : 0}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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

              <div className="flex items-center gap-1">
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
                  className="hidden h-1 w-16 accent-white sm:block"
                  aria-label="Volume"
                />
              </div>

              <span ref={timeDisplayRef} className="text-[12px] text-white/60">
                {formatTime(displayTime.current)} / {formatTime(displayTime.duration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Speed selector */}
              <div className="relative">
                <button
                  onClick={() => { closeAllMenus(); setShowSpeedMenu(!showSpeedMenu); }}
                  className="rounded-lg px-1.5 py-1 text-[11px] font-bold text-white/70 hover:bg-white/10"
                  aria-label="Playback speed"
                >
                  {currentSpeed === 1 ? "1×" : `${currentSpeed}×`}
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-white/[0.08] bg-[#0e0e0e]/98 p-1 shadow-2xl" role="menu">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { changeSpeed(s); setShowSpeedMenu(false); }}
                        className={`block w-full rounded-lg px-3 py-1.5 text-left text-[12px] ${
                          s === currentSpeed
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/[0.05]"
                        }`}
                        role="menuitem"
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality selector */}
              {sortedQualities.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => { closeAllMenus(); setShowQualityMenu(!showQualityMenu); }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/10"
                    aria-label="Quality settings"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentQuality || "Auto"}</span>
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-white/[0.08] bg-[#0e0e0e]/98 p-1 shadow-2xl" role="menu">
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
                          role="menuitem"
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
                    onClick={() => { closeAllMenus(); setShowSubMenu(!showSubMenu); }}
                    className="rounded-lg p-1 text-white/70 hover:bg-white/10"
                    aria-label="Subtitles"
                  >
                    <LanguageIcon className="h-4 w-4" />
                  </button>
                  {showSubMenu && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-white/[0.08] bg-[#0e0e0e]/98 p-1 shadow-2xl" role="menu">
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
                        role="menuitem"
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
                          role="menuitem"
                        >
                          {s.lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Picture-in-Picture */}
              <button
                onClick={togglePiP}
                className="hidden text-white hover:text-white/80 sm:block"
                aria-label="Picture in picture"
              >
                <ForwardIcon className="h-4 w-4 rotate-180" />
              </button>

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
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <div className="rounded-full bg-black/50 p-4 transition-transform hover:scale-110">
            <PlayIcon className="h-12 w-12 text-white" />
          </div>
        </button>
      )}
    </div>
  );
}
