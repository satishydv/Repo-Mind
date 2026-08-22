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
        <div className="bg-white p-6 sm:p-8 rounded-2xl max-w-4xl w-full mx-auto space-y-6">
          {/* Top Bar matching Image 3 */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <GitBranch className="size-4.5" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={loading || !answer || saved || saveAnswer.isPending}
                className="h-8 px-3 rounded-lg border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
              >
                <BookmarkPlus className="size-3.5 text-blue-600" />
                <span>{saved ? "Saved" : saveAnswer.isPending ? "Saving..." : "Save Answer"}</span>
              </Button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* AI Answer Content */}
          <div className="space-y-3">
            {currentPrompt && (
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                {currentPrompt}
              </h3>
            )}

            <div className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-normal">
              {answer ? (
                answer
              ) : loading ? (
                <div className="space-y-3 animate-pulse py-2">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">
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
              className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ask Question Card on Page matching Image 1 */}
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-2xs">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Ask a question</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            RepoMind has knowledge of the codebase
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea
            placeholder="Which file should I edit to change the home page?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[110px] rounded-lg border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-gray-400 resize-y"
          />

          <Button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-lg h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
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

