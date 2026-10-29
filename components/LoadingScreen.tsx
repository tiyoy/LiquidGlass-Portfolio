"use client";

import { useEffect, useRef, useState } from "react";
import { stepDisplay } from "@/lib/loader-progress";

type LoadingScreenProps = {
  /** Progres NYATA 0–100 dari proses memuat (font, data database, gambar, lanyard). */
  target: number;
  /** true kalau semua tahap sudah benar-benar selesai. */
  complete: boolean;
  /** Dipanggil setelah layar selesai memudar dan boleh dihapus dari halaman. */
  onDone: () => void;
};

// Lama minimum animasi 0 → 100% supaya angkanya naik halus walau semua asset sudah ada di cache.
const MIN_MS = 1200;
const HOLD_MS = 320; // jeda singkat di 100% sebelum layar dibuka
const FADE_MS = 650; // harus sama dengan transition di .app-loader (globals.css)
const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export default function LoadingScreen({ target, complete, onDone }: LoadingScreenProps) {
  const [value, setValue] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const targetRef = useRef(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    // Sebelum 100% selesai, angka ditahan di 99 supaya "100%" benar-benar berarti semuanya sudah siap.
    targetRef.current = complete ? 100 : Math.min(target, 99);
    onDoneRef.current = onDone;
  }, [target, complete, onDone]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("is-loading"); // kunci scroll & jeda animasi halaman selama loading
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minMs = reduceMotion ? 300 : MIN_MS;
    const start = performance.now();
    const timers: number[] = [];
    let current = 0;
    let frame = 0;
    let finished = false;

    const tick = (now: number) => {
      const timeCap = Math.min(100, ((now - start) / minMs) * 100);
      const cap = Math.min(targetRef.current, timeCap);
      current = stepDisplay(current, cap);
      setValue(current);
      if (current >= 100 && !finished) {
        finished = true;
        timers.push(window.setTimeout(() => setLeaving(true), HOLD_MS));
        timers.push(window.setTimeout(() => {
          root.classList.remove("is-loading");
          onDoneRef.current();
        }, HOLD_MS + FADE_MS));
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      root.classList.remove("is-loading");
    };
  }, []);

  const shown = Math.min(100, Math.floor(value));

  return (
    <div
      className={`app-loader${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Memuat asset ${shown}%`}
    >
      <div className="app-loader-ambient" aria-hidden="true" />
      <div className="app-loader-inner">
        <div className="loader-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="loaderGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d4c9ff" />
                <stop offset="1" stopColor="#7fd6ff" />
              </linearGradient>
            </defs>
            <circle className="loader-ring-track" cx="60" cy="60" r={RING_RADIUS} />
            <circle
              className="loader-ring-bar"
              cx="60"
              cy="60"
              r={RING_RADIUS}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - value / 100)}
            />
          </svg>
          <div className="loader-percent">
            <b>{shown}</b>
            <span>%</span>
          </div>
        </div>
        <p className="loader-caption">
          Memuat asset
          <span className="loader-dots" aria-hidden="true"><i /><i /><i /></span>
        </p>
      </div>
    </div>
  );
}
