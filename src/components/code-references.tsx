"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FileCode2, Copy, Check } from "lucide-react";

export type FileReference = {
  fileName: string;
  sourceCode: string;
  summary?: string;
};

interface CodeReferencesProps {
  filesReferences: FileReference[];
}

export const CodeReferences: React.FC<CodeReferencesProps> = ({
  filesReferences,
}) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!filesReferences || filesReferences.length === 0) return null;

  const currentFile = filesReferences[selectedFileIdx] || filesReferences[0];

  const handleCopy = () => {
    if (currentFile?.sourceCode) {
      navigator.clipboard.writeText(currentFile.sourceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-0 mt-6 pt-4 border-t border-gray-100">
      {/* File Tabs matching Image 3 & Image 5 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0 custom-scrollbar">
        {filesReferences.map((file, idx) => {
          const isActive = idx === selectedFileIdx;
          return (
            <button
              type="button"
              key={file.fileName + idx}
              onClick={() => setSelectedFileIdx(idx)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-t border-x border-transparent flex items-center gap-1.5 shrink-0 cursor-pointer",
                isActive
                  ? "premium-gradient-glow text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200/60"
              )}
            >
              <FileCode2 className="size-3.5 opacity-80" />
              <span>{file.fileName}</span>
            </button>
          );
        })}
      </div>

      {/* Code Container Window matching Image 3 & Image 5 */}
      <div className="relative rounded-b-xl rounded-tr-xl bg-[#18181b] border border-gray-800 text-gray-100 p-4 shadow-inner">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs text-gray-400">
          <span className="font-mono">{currentFile?.fileName}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800 text-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="font-mono text-xs text-gray-200 leading-relaxed overflow-x-auto max-h-72 custom-scrollbar p-1 whitespace-pre">
          <code>{currentFile?.sourceCode || "// No source code available"}</code>
        </pre>
      </div>
    </div>
  );
};
