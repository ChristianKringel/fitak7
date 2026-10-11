"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface ClipPlayer {
  status: PlayerStatus;
  /** Seconds played in the current clip, counted from its start. */
  position: number;
  /** Limit of the current clip in seconds (null: full preview). */
  limit: number | null;
  /** Loads a source ahead of time so playback starts faster. */
  prepare: (src: string) => void;
  /**
   * Must be called from a user gesture (iOS). The clip starts `startSeconds`
   * into the source (default 0).
   */
  play: (src: string, limitSeconds: number | null, startSeconds?: number) => void;
  stop: () => void;
  /** Stops and clears progress, keeping the loaded source. */
  reset: () => void;
}

/**
 * Plays N seconds of an audio source, from the start or from a given point,
 * with a single shared <audio> element. The source is our API URL, which redirects to a fresh
 * Deezer preview.
 */
export function useClipPlayer(): ClipPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const limitRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [position, setPosition] = useState(0);
  const [limit, setLimit] = useState<number | null>(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const stopTicking = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  useEffect(() => {
    const audio = getAudio();
    const reachedLimit = () => {
      const max = limitRef.current;
      if (max === null || audio.currentTime < startRef.current + max) return false;
      audio.pause();
      stopTicking();
      setPosition(max);
      setStatus("paused");
      return true;
    };
    // Follows playback every frame for a smooth progress ring.
    const loop = () => {
      if (reachedLimit()) return;
      setPosition(Math.max(0, audio.currentTime - startRef.current));
      frameRef.current = requestAnimationFrame(loop);
    };
    // Frames don't run in background tabs; timeupdate still enforces the limit.
    const onTimeUpdate = () => {
      reachedLimit();
    };
    const onPlaying = () => {
      setStatus("playing");
      stopTicking();
      frameRef.current = requestAnimationFrame(loop);
    };
    const onWaiting = () => setStatus("loading");
    const onEnded = () => {
      stopTicking();
      setStatus("paused");
    };
    const onError = () => {
      // Errors while nothing was requested (e.g. after src reset) are noise.
      if (!audio.getAttribute("src")) return;
      stopTicking();
      setStatus("error");
    };
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      stopTicking();
    };
  }, [getAudio, stopTicking]);

  const setSource = useCallback(
    (src: string) => {
      const audio = getAudio();
      // Reload after an error too: the preview URL behind src may have expired.
      if (audio.getAttribute("src") !== src || audio.error) {
        audio.setAttribute("src", src);
        audio.load();
      }
      return audio;
    },
    [getAudio],
  );

  const prepare = useCallback(
    (src: string) => {
      const audio = getAudio();
      audio.pause();
      stopTicking();
      setStatus("idle");
      setPosition(0);
      setLimit(null);
      setSource(src);
    },
    [getAudio, setSource, stopTicking],
  );

  const play = useCallback(
    (src: string, limitSeconds: number | null, startSeconds = 0) => {
      const audio = setSource(src);
      limitRef.current = limitSeconds;
      startRef.current = startSeconds;
      setLimit(limitSeconds);
      setPosition(0);
      setStatus("loading");
      audio.currentTime = startSeconds;
      audio.play().catch((error: unknown) => {
        // AbortError: playback was interrupted by a newer pause/load; not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    },
    [setSource],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    stopTicking();
    setStatus((s) => (s === "error" ? s : "paused"));
  }, [stopTicking]);

  const reset = useCallback(() => {
    audioRef.current?.pause();
    stopTicking();
    setStatus("idle");
    setPosition(0);
    setLimit(null);
  }, [stopTicking]);

  return { status, position, limit, prepare, play, stop, reset };
}
