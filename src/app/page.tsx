import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Github, Sparkles, Brain, Code2, ArrowRight } from "lucide-react";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient selection:bg-primary/30 selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/10 glass z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <Brain className="size-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">RepoMind</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="hover:bg-white/10 transition-colors">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="size-4" />
            <span>AI-Powered Repository Insights</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Give your GitHub repo <br />
            <span className="text-gradient">a second brain.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            RepoMind uses advanced AI to analyze your source code, summarize commits,
            and help you understand your projects faster than ever before.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 group">
                Start for free
                <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/20 hover:bg-white/10 transition-colors group">
              <Github className="mr-2 size-5" />
              View on GitHub
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
            <div className="p-8 rounded-2xl glass border-white/10 transition-all hover:border-primary/50 group">
              <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Code2 className="size-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Code Analysis</h3>
              <p className="text-muted-foreground">Deeply understands your codebase structure and logical flow.</p>
            </div>

            <div className="p-8 rounded-2xl glass border-white/10 transition-all hover:border-primary/50 group">
              <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Github className="size-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Commit Summaries</h3>
              <p className="text-muted-foreground">Automatically generates human-readable summaries for every git push.</p>
            </div>

            <div className="p-8 rounded-2xl glass border-white/10 transition-all hover:border-primary/50 group">
              <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Brain className="size-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Semantic Search</h3>
              <p className="text-muted-foreground">Ask questions about your code and find answers using vector search.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 RepoMind. Built with ❤️ for developers.</p>
        </div>
      </footer>
    </div>
  );
}