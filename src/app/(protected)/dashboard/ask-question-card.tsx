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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import useProject from "@/hooks/use-project";

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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Image src="/logo.png" alt="dionysus" width={40} height={40} />
            </DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap">{answer}</div>
          <h1>Files References</h1>
          {filesReferences.map(file => {
            return <span key={file.fileName}>{file.fileName}</span>
          })}
        </DialogContent>
      </Dialog>
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
