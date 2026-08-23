'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, AlertTriangle, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl border border-slate-800 bg-[#0d1117] overflow-hidden shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono">
          <Terminal className="size-3.5 text-indigo-400" />
          <span className="text-slate-300 font-semibold">{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-slate-700/50"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  )
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null

  return (
    <div className={cn("text-gray-800 dark:text-gray-200 text-sm leading-relaxed space-y-3", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-6 mb-3 pb-1 border-b border-gray-100 dark:border-gray-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-5 mb-2.5 pb-1 border-b border-gray-100 dark:border-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-indigo-500 shrink-0" />
              <span>{children}</span>
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mt-3 mb-1.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900 dark:text-gray-100">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800 dark:text-gray-200">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2.5 list-none pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2.5 list-decimal pl-5 text-gray-800 dark:text-gray-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              <span className="size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 mt-2" />
              <div className="flex-1">{children}</div>
            </li>
          ),
          blockquote: ({ children }) => {
            return (
              <div className="my-3 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-2xs">
                <AlertTriangle className="size-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs font-medium leading-relaxed [&>p]:mb-0">
                  {children}
                </div>
              </div>
            )
          },
          hr: () => (
            <hr className="my-4 border-t border-gray-200 dark:border-gray-800" />
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')
            const isInline = !match && !codeString.includes('\n')

            if (isInline) {
              return (
                <code
                  className="mx-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-[12px] font-semibold border border-indigo-200/50 dark:border-indigo-800/40"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock
                language={match?.[1] || ''}
                code={codeString}
              />
            )
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
              <table className="w-full text-xs text-left text-gray-700 dark:text-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-gray-900 dark:text-gray-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
