"use client";

import React from "react";
import Link from "next/link";
import { GitBranch, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthBackgroundProps {
  children: React.ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#dceaf7] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ========================================================================= */}
      {/* 1. BACKGROUND SCENE (CYAN GRID + RED SUN MEDALLION + CHERRY BLOSSOMS)     */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10">
        {/* Soft Sky / Cyan Grid Background Texture */}
        <svg
          className="absolute inset-0 w-full h-full text-[#9ec4e8]/40 dark:text-slate-800/40"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="sakura-grid-pattern"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sakura-grid-pattern)" />
        </svg>

        {/* Ambient Top & Bottom Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-400/20 dark:bg-sky-600/10 blur-[130px] rounded-full" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-400/20 dark:bg-rose-600/10 blur-[140px] rounded-full" />

        {/* ======================================================================= */}
        {/* WARM CORAL/RED CIRCLE MEDALLION (AS SEEN IN REFERENCE IMAGE)            */}
        {/* ======================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] sm:w-[540px] sm:h-[540px] md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-tr from-[#e11d48] via-[#f43f5e] to-[#fb7185] dark:from-[#9f1239] dark:via-[#be123c] dark:to-[#e11d48] shadow-[0_0_80px_rgba(244,63,94,0.35)] opacity-95 transition-all duration-700" />

        {/* ======================================================================= */}
        {/* ARTISTIC CHERRY BLOSSOM SAKURA BRANCHES (LEFT & RIGHT)                  */}
        {/* ======================================================================= */}
        {/* Left Sakura Branch */}
        <svg
          className="absolute left-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 md:w-80 h-[500px] pointer-events-none opacity-90 drop-shadow-md"
          viewBox="0 0 200 400"
          fill="none"
        >
          {/* Main Dark Branch */}
          <path
            d="M -20 180 Q 40 190 70 160 T 130 110 Q 150 100 175 70"
            stroke="#2d1b18"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 60 170 Q 90 220 140 250"
            stroke="#2d1b18"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 110 130 Q 140 145 160 170"
            stroke="#2d1b18"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 20 185 Q 30 260 80 300"
            stroke="#2d1b18"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Sakura Pink Blossoms */}
          {/* Cluster 1 (Top Branch) */}
          <circle cx="175" cy="70" r="10" fill="#fbcfe8" />
          <circle cx="175" cy="70" r="5" fill="#f472b6" />
          <circle cx="185" cy="60" r="8" fill="#fdf2f8" />
          <circle cx="160" cy="85" r="9" fill="#fbcfe8" />
          <circle cx="160" cy="85" r="4.5" fill="#ec4899" />
          <circle cx="145" cy="70" r="7" fill="#fdf2f8" />

          {/* Cluster 2 (Middle Branch) */}
          <circle cx="130" cy="115" r="11" fill="#fbcfe8" />
          <circle cx="130" cy="115" r="5.5" fill="#f472b6" />
          <circle cx="120" cy="100" r="8" fill="#fdf2f8" />
          <circle cx="145" cy="125" r="9" fill="#fbcfe8" />
          <circle cx="160" cy="170" r="10" fill="#fbcfe8" />
          <circle cx="160" cy="170" r="5" fill="#f472b6" />
          <circle cx="175" cy="165" r="8" fill="#fdf2f8" />

          {/* Cluster 3 (Lower Branch) */}
          <circle cx="140" cy="250" r="12" fill="#fbcfe8" />
          <circle cx="140" cy="250" r="6" fill="#f472b6" />
          <circle cx="155" cy="245" r="9" fill="#fdf2f8" />
          <circle cx="130" cy="265" r="8" fill="#fbcfe8" />
          <circle cx="80" cy="300" r="10" fill="#fbcfe8" />
          <circle cx="80" cy="300" r="5" fill="#f472b6" />
          <circle cx="95" cy="310" r="7" fill="#fdf2f8" />

          {/* Drifting Petals */}
          <ellipse cx="110" cy="50" rx="4" ry="7" fill="#fbcfe8" transform="rotate(30 110 50)" />
          <ellipse cx="190" cy="120" rx="3.5" ry="6" fill="#fbcfe8" transform="rotate(-20 190 120)" />
          <ellipse cx="165" cy="210" rx="4" ry="7" fill="#fbcfe8" transform="rotate(45 165 210)" />
          <ellipse cx="105" cy="230" rx="3" ry="5" fill="#fdf2f8" transform="rotate(15 105 230)" />
        </svg>

        {/* Right Sakura Branch */}
        <svg
          className="absolute right-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 md:w-80 h-[500px] pointer-events-none opacity-90 drop-shadow-md"
          viewBox="0 0 200 400"
          fill="none"
        >
          {/* Main Dark Branch */}
          <path
            d="M 220 200 Q 160 180 130 210 T 70 260 Q 50 270 25 300"
            stroke="#2d1b18"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 140 200 Q 110 150 60 120"
            stroke="#2d1b18"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 90 240 Q 60 225 40 200"
            stroke="#2d1b18"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 180 185 Q 170 110 120 70"
            stroke="#2d1b18"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Sakura Pink Blossoms */}
          {/* Cluster 1 (Top Branch) */}
          <circle cx="120" cy="70" r="10" fill="#fbcfe8" />
          <circle cx="120" cy="70" r="5" fill="#f472b6" />
          <circle cx="105" cy="65" r="8" fill="#fdf2f8" />
          <circle cx="135" cy="85" r="9" fill="#fbcfe8" />

          {/* Cluster 2 (Middle Branch) */}
          <circle cx="60" cy="120" r="12" fill="#fbcfe8" />
          <circle cx="60" cy="120" r="6" fill="#f472b6" />
          <circle cx="45" cy="110" r="8" fill="#fdf2f8" />
          <circle cx="75" cy="135" r="9" fill="#fbcfe8" />
          <circle cx="40" cy="200" r="10" fill="#fbcfe8" />
          <circle cx="40" cy="200" r="5" fill="#f472b6" />
          <circle cx="25" cy="195" r="8" fill="#fdf2f8" />

          {/* Cluster 3 (Lower Branch) */}
          <circle cx="25" cy="300" r="11" fill="#fbcfe8" />
          <circle cx="25" cy="300" r="5.5" fill="#f472b6" />
          <circle cx="10" cy="310" r="8" fill="#fdf2f8" />
          <circle cx="40" cy="290" r="8" fill="#fbcfe8" />

          {/* Drifting Petals */}
          <ellipse cx="90" cy="170" rx="4" ry="7" fill="#fbcfe8" transform="rotate(-35 90 170)" />
          <ellipse cx="35" cy="250" rx="3.5" ry="6" fill="#fbcfe8" transform="rotate(25 35 250)" />
          <ellipse cx="80" cy="320" rx="4" ry="7" fill="#fdf2f8" transform="rotate(-15 80 320)" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP HEADER NAVIGATION                                                  */}
      {/* ========================================================================= */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-20">
        {/* Brand & Back Button */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 border border-white/60 dark:border-zinc-800/80 backdrop-blur-md transition-all shadow-xs hover:shadow-md"
        >
          <ArrowLeft className="size-4 text-slate-600 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <div className="size-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <GitBranch className="size-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            RepoMind
          </span>
        </Link>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-zinc-900/70 border border-white/60 dark:border-zinc-800/50 text-slate-700 dark:text-slate-300 text-xs font-medium backdrop-blur-sm shadow-2xs">
            <Sparkles className="size-3 text-sky-500 animate-pulse" />
            <span>AI Brain for Git</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN CENTER CONTAINER (THE AUTH CARD)                                  */}
      {/* ========================================================================= */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 z-10">
        {children}
      </main>

      {/* ========================================================================= */}
      {/* 4. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-500 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Enterprise-grade 256-bit encrypted authentication</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-slate-800 dark:hover:text-zinc-300 transition-colors">
            Home
          </Link>
          <span>•</span>
          <span>© 2026 RepoMind</span>
        </div>
      </footer>
    </div>
  );
}
