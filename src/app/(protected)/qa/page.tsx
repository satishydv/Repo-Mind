"use client";

import React, { useState } from "react";
import useProject from "@/hooks/use-project";
import AskQuestionCard from "@/app/(protected)/dashboard/ask-question-card";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { QuestionSheet, type QuestionData } from "./question-sheet";
import { GitBranch, MessageSquareCode, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const QAPage = () => {
  const { project, projectId } = useProject();
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: questions, isLoading } = api.project.getQuestions.useQuery(
    { projectId: projectId || "" },
    { enabled: !!projectId }
  );

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white rounded-2xl border border-gray-200 p-8">
        <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <GitBranch className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No project selected</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          Select an existing project from the sidebar or link a new repository to access Q&A.
        </p>
        <Link href="/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-2 text-sm font-medium">
            <Plus className="size-4" />
            Create Project
          </Button>
        </Link>
      </div>
    );
  }

  const handleOpenQuestion = (q: any) => {
    setSelectedQuestion(q);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Ask a Question Card matching Image 4 */}
      <div>
        <AskQuestionCard />
      </div>

      {/* Saved Questions Section matching Image 4 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Saved Questions
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse p-4 rounded-xl border border-gray-200 bg-white flex items-center gap-4"
              >
                <div className="size-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !questions || questions.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-10 bg-white text-center">
            <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <MessageSquareCode className="size-6" />
            </div>
            <p className="text-base font-semibold text-gray-900">No saved questions yet</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
              Ask a question above and click <span className="font-semibold text-gray-700">"Save Answer"</span> in the response modal to save it here for quick reference.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => {
              let timeAgo = "";
              try {
                timeAgo = formatDistanceToNow(new Date(q.createdAt), { addSuffix: true });
              } catch {
                timeAgo = "";
              }

              // Extract first line of answer as preview snippet
              const answerPreview = q.answer
                ? q.answer.replace(/\n+/g, " ").slice(0, 160) + "..."
                : "View saved answer";

              return (
                <div
                  key={q.id}
                  onClick={() => handleOpenQuestion(q)}
                  className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 hover:shadow-2xs transition-all cursor-pointer flex items-center gap-4 group"
                >
                  {/* User Avatar */}
                  <img
                    src={q.user?.imageUrl || "https://github.com/identicons/app.png"}
                    alt={q.user?.firstName || "User"}
                    className="size-10 rounded-full bg-gray-100 border border-gray-200 shrink-0"
                  />

                  {/* Question & Snippet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {q.question}
                      </h3>
                      {timeAgo && (
                        <span className="text-xs text-gray-400 font-normal shrink-0">
                          {timeAgo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate font-normal">
                      {answerPreview}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right-Side Slide-Over Drawer matching Image 5 */}
      <QuestionSheet
        question={selectedQuestion}
        open={sheetOpen}
        setOpen={setSheetOpen}
      />
    </div>
  );
};

export default QAPage;
