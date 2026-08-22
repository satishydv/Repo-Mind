"use client";

import React from "react";
import { Presentation, Sparkles, Video, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const MeetingsPage = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 md:p-16 shadow-2xs min-h-[calc(100vh-120px)] flex items-center justify-center text-center transition-colors">
      <div className="max-w-md mx-auto space-y-6">
        <div className="size-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-xs">
          <Presentation className="size-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Clock className="size-3.5" />
            <span>Coming Soon</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Meetings Analysis
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Record, transcribe, and automatically analyze codebase engineering discussions with RepoMind AI.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 h-10 text-sm font-medium transition-colors shadow-2xs cursor-pointer">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MeetingsPage;
