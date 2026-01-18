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

      // Handle the text stream
      for await (const delta of output) {
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

      <Card className="relative w-full">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
          <CardDescription>
            Dionysus has knowledge of the codebase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button disabled={loading} className="mt-4">
              {loading ? "Thinking..." : "Ask Dionysus!"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
