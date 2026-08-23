import { SignIn } from "@clerk/nextjs";
import { GitBranch } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 text-gray-900">
      {/* Brand Logo Header */}
      <Link href="/" className="flex items-center gap-2.5 mb-6 transition-opacity hover:opacity-80">
        <div className="size-9 rounded-xl premium-gradient-glow flex items-center justify-center text-white shrink-0">
          <GitBranch className="size-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">RepoMind</span>
      </Link>

      {/* Clerk SignIn Component */}
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-[420px] flex justify-center",
            card: "bg-white border border-gray-200 rounded-2xl shadow-xs p-6 sm:p-8 w-full",
            headerTitle: "text-2xl font-bold text-gray-900 tracking-tight text-center",
            headerSubtitle: "text-sm text-gray-500 text-center mt-1",
            socialButtonsBlockButton: "rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm h-10 transition-colors shadow-2xs",
            socialButtonsBlockButtonText: "font-medium text-gray-700 text-sm",
            dividerRow: "my-4",
            dividerLine: "bg-gray-200",
            dividerText: "text-xs text-gray-400 font-normal uppercase",
            formFieldLabel: "text-xs font-semibold text-gray-700 mb-1",
            formFieldInput: "rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm h-10 transition-colors placeholder:text-gray-400",
            formButtonPrimary: "rounded-lg premium-gradient-glow text-white font-medium text-sm h-10 transition-all cursor-pointer mt-2",
            footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold text-xs",
            footerActionText: "text-xs text-gray-500",
            identityPreviewText: "text-sm text-gray-700 font-medium",
            identityPreviewEditButton: "text-blue-600 hover:text-blue-700 text-xs font-semibold",
            formFieldSuccessText: "text-xs text-green-600",
            formFieldErrorText: "text-xs text-red-500",
            alert: "bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3",
            footer: "mt-4 pt-4 border-t border-gray-100",
          }
        }}
      />

      {/* Footer */}
      <footer className="text-xs text-gray-400 mt-8 text-center">
        © 2026 RepoMind. AI-powered codebase intelligence.
      </footer>
    </div>
  );
}


