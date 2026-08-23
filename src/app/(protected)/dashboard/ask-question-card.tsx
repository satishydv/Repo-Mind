"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { askQuestion } from "./action";
import { Sparkles, GitBranch, BookmarkPlus, X } from "lucide-react";
import useProject from "@/hooks/use-project";
import Modal from "@/components/Modal";
import { readStreamableValue } from 'ai/rsc';
import { CodeReferences, type FileReference } from "@/components/code-references";
import { api } from "@/trpc/react";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [filesReferences, setFilesReferences] = useState<FileReference[]>([]);
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);

  const saveAnswer = api.project.saveAnswer.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Answer saved to Q&A!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save answer");
    }
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project?.id || !question.trim()) return;
    setLoading(true);
    setOpen(true);
    setAnswer('');
    setFilesReferences([]);
    setSaved(false);
    setCurrentPrompt(question);

    try {
      const { output, filesReferences } = await askQuestion(question, project.id);
      setFilesReferences(filesReferences || []);

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAnswer(ans => ans + delta);
        }
      }
    } catch (error) {
      toast.error("Failed to get answer");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!project?.id || !answer) return;
    saveAnswer.mutate({
      projectId: project.id,
      question: currentPrompt,
      answer,
      filesReferences,
    });
  };

  return (
    <>
      <Modal open={open} setOpen={setOpen}>
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl max-w-4xl w-full mx-auto space-y-6 transition-colors">
          {/* Top Bar matching Image 3 */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg premium-gradient-glow flex items-center justify-center text-white shrink-0">
                <GitBranch className="size-4.5" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={loading || !answer || saved || saveAnswer.isPending}
                className="h-8 px-3 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <BookmarkPlus className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{saved ? "Saved" : saveAnswer.isPending ? "Saving..." : "Save Answer"}</span>
              </Button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* AI Answer Content */}
          <div className="space-y-3">
            {currentPrompt && (
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                {currentPrompt}
              </h3>
            )}

            <div className="text-gray-800 dark:text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-normal">
              {answer ? (
                answer
              ) : loading ? (
                <div className="space-y-3 animate-pulse py-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-5/6"></div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No answer generated. Please try again.
                </p>
              )}
            </div>
          </div>

          {/* Source Context Tabs & Code Viewer matching Image 3 */}
          {filesReferences.length > 0 && (
            <CodeReferences filesReferences={filesReferences} />
          )}

          {/* Bottom Close Button matching Image 3 */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-10 rounded-lg premium-gradient-glow text-white font-medium text-sm transition-all cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ask Question Card on Page matching Image 1 */}
      <div className="border border-sky-100 dark:border-sky-950/50 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl p-6 shadow-2xs hover:border-sky-200 dark:hover:border-sky-800/60 transition-all flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="size-9 rounded-lg bg-sky-100/80 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/60 dark:border-sky-800/60 shrink-0">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">Ask a question</h2>
              <p className="text-xs text-sky-600/80 dark:text-sky-400/80 font-medium">
                RepoMind has knowledge of the codebase
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <Textarea
            placeholder="Which file should I edit to change the home page?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[105px] rounded-lg border-sky-200/70 dark:border-sky-900/50 bg-white/95 dark:bg-gray-950 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-y shadow-2xs transition-colors"
          />

          <Button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-lg h-9 px-5 premium-gradient-glow text-white font-medium text-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>RepoMind is thinking...</span>
              </>
            ) : (
              <span>Ask RepoMind!</span>
            )}
          </Button>
        </form>
      </div>
    </>
  );
};

export default AskQuestionCard;

