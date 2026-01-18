"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { askQuestion } from "./action";
import { Brain, Sparkles, Code2 } from "lucide-react";
import Image from "next/image";
import useProject from "@/hooks/use-project";
import Modal from "@/components/Modal";
import { readStreamableValue } from 'ai/rsc'

const AskQuestionCard = () => {
  const { project } = useProject();
  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [filesReferences, setFilesReferences] = React.useState<{ fileName: string; sourceCode: string; summary: string }[]>([]);
  const [answer, setAnswer] = React.useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);
    setOpen(true);
    setAnswer(''); // Reset answer
    setFilesReferences([]); // Reset file references

    try {
      const { output, filesReferences } = await askQuestion(question, project.id);
      setFilesReferences(filesReferences);

      // Handle the text stream using readStreamableValue
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

  return (
    <>
      <Modal open={open} setOpen={setOpen}>
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 shadow-sm">
              <Brain className="size-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold tracking-tight">AI Assistant Response</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <Sparkles className="size-3.5" />
                <span>Powered by Dionysus Intelligence</span>
              </div>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-base md:text-lg leading-relaxed text-foreground/90 font-medium">
              {answer || (loading && <div className="animate-pulse flex space-x-2"><div className="h-4 bg-primary/20 rounded w-full"></div></div>)}
            </div>
          </div>

          {filesReferences.length > 0 && (
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
                <Code2 className="size-4" />
                <span>Source Context</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filesReferences.map(file => (
                  <div key={file.fileName} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-lg text-xs font-semibold text-primary transition-colors cursor-default">
                    <span className="opacity-60">📁</span>
                    {file.fileName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Card className="relative w-full border-none bg-transparent shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold tracking-tight">Ask your codebase</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Search naturally for logic, files, or specific functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit}>
            <div className="relative group">
              <Textarea
                placeholder="Which file should I edit to change the home page?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[120px] rounded-2xl border-white/20 bg-white/50 dark:bg-white/5 focus:bg-white focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground/50"
              />
              <div className="absolute top-3 right-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                <div className="px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-black uppercase text-primary tracking-widest">AI Ready</div>
              </div>
            </div>
            <Button
              disabled={loading}
              className="mt-6 w-full rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-bold transition-all hover:scale-[1.01] active:scale-95 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dionysus is thinking...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 group-hover:rotate-12 transition-transform" />
                  <span>Ask Dionysus!</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
