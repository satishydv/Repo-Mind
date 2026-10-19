"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, FileCode2, Sparkles } from "lucide-react";
import { CodeReferences, type FileReference } from "@/components/code-references";
import { MarkdownRenderer } from "@/components/markdown-renderer";

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
                    <>
                      <MarkdownRenderer content={question.answer.split('---FOLLOWUP---')[0] ?? question.answer} />
                      {(() => {
                        const parts = question.answer.split('---FOLLOWUP---');
                        const followUpJson = parts[1];
                        if (followUpJson) {
                          try {
                            const questions = JSON.parse(followUpJson.trim());
                            if (Array.isArray(questions)) {
                              return (
                                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                  <span className="w-full text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 text-blue-500" />
                                    Suggested follow-ups
                                  </span>
                                  {questions.map((q, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setOpen(false);
                                        window.dispatchEvent(new CustomEvent('ask-question', { detail: q }));
                                      }}
                                      className="text-left px-3 py-1.5 text-xs font-medium bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/50 dark:border-blue-800/50 transition-colors shadow-2xs cursor-pointer"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              );
                            }
                          } catch (e) {
                            // Silently fail if JSON parsing fails
                          }
                        }
                        return null;
                      })()}
                    </>

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
