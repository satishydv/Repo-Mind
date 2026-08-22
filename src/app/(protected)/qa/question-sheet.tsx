"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, FileCode2 } from "lucide-react";
import { CodeReferences, type FileReference } from "@/components/code-references";

export type QuestionData = {
  id: string;
  question: string;
  answer: string;
  filesReferences?: any;
  createdAt: Date;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    emailAddress?: string;
  } | null;
};

interface QuestionSheetProps {
  question: QuestionData | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const QuestionSheet: React.FC<QuestionSheetProps> = ({
  question,
  open,
  setOpen,
}) => {
  if (!question) return null;

  const rawFiles = question.filesReferences;
  let parsedFiles: FileReference[] = [];
  if (Array.isArray(rawFiles)) {
    parsedFiles = rawFiles as FileReference[];
  } else if (typeof rawFiles === "string") {
    try {
      parsedFiles = JSON.parse(rawFiles);
    } catch {
      parsedFiles = [];
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col h-full border-l border-gray-200 dark:border-gray-800 transition-colors">
                  {/* Top Bar with Close X matching Image 5 */}
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {question.question}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* Scrollable Content Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Answer Text */}
                    <div className="text-gray-800 dark:text-gray-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                      {question.answer}
                    </div>

                    {/* Source Context Tabs & Code Viewer */}
                    {parsedFiles.length > 0 && (
                      <CodeReferences filesReferences={parsedFiles} />
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
