import { SignUp } from "@clerk/nextjs";
import { Brain, Sparkles, Zap, Shield, Globe } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Left side - Marketing/Visual */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-mesh p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pastel-pink rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pastel-blue rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl">
            <Brain className="size-8 text-primary" />
          </div>
          <span className="text-3xl font-black tracking-tighter text-foreground uppercase">RepoMind</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tight leading-[1.1]">
              Join the <span className="text-gradient">future</span> <br />
              of development.
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg font-medium leading-relaxed">
              Unlock the power of AI to understand, analyze, and automate your
              software projects in minutes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-xl">
            {[
              { icon: Sparkles, label: "AI Insights", color: "text-rose-500", bg: "bg-rose-500/10" },
              { icon: Zap, label: "Fast Indexing", color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: Shield, label: "Secure Analysis", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { icon: Globe, label: "Global Search", color: "text-blue-500", bg: "bg-blue-500/10" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 glass rounded-2xl border-white/10 group hover:border-primary/50 transition-all">
                <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon className="size-5" />
                </div>
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-muted-foreground">
          © 2024 RepoMind. All rights reserved.
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative overflow-y-auto custom-scrollbar">
        <div className="absolute lg:hidden inset-0 bg-mesh opacity-20" />
        <div className="relative z-10 w-full max-w-[400px] animate-in fade-in slide-in-from-right-8 duration-700 my-auto">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Brain className="size-8 text-primary" />
            <span className="text-2xl font-bold uppercase tracking-tighter">RepoMind</span>
          </div>

          <div className="bg-white/50 dark:bg-black/20 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-2xl border border-white/20">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent w-full",
                  headerTitle: "text-2xl font-bold tracking-tight",
                  headerSubtitle: "text-muted-foreground",
                  socialButtonsBlockButton: "rounded-xl border-border bg-white dark:bg-white/5 hover:bg-muted font-medium transition-all",
                  formButtonPrimary: "rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm font-bold transition-all h-11",
                  formFieldInput: "rounded-xl border-border bg-white dark:bg-white/5 h-11",
                  footerActionLink: "text-primary hover:text-primary/80 font-bold",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground font-medium"
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}