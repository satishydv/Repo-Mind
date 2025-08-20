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
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="dionysus" width={40} height={40} />
            <h2 className="text-xl font-semibold">Dionysus's Answer</h2>
          </div>
          
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{answer}</div>
          </div>
          
          {filesReferences.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Files Referenced:</h3>
              <div className="flex flex-wrap gap-2">
                {filesReferences.map(file => (
                  <span key={file.fileName} className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {file.fileName}
                  </span>
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
