<div align="center">

# 🧠 RepoMind

### Give your codebase a second brain.

An AI-powered codebase intelligence platform that indexes your GitHub repositories, performs semantic vector search over source code, generates automated commit summaries, and delivers context-grounded code answers.

<p>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL_pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white">
  <img alt="Google Gemini" src="https://img.shields.io/badge/Google_Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white">
  <img alt="Clerk" src="https://img.shields.io/badge/Clerk_Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white">
</p>

<p>
  <img alt="tRPC v11" src="https://img.shields.io/badge/tRPC-v11_Typesafe-2563EB?style=flat-square&logo=trpc&logoColor=white">
  <img alt="pgvector" src="https://img.shields.io/badge/pgvector-768D_Embeddings-059669?style=flat-square">
  <img alt="Gemini Embedding" src="https://img.shields.io/badge/Gemini-Embedding--001-7c3aed?style=flat-square">
  <img alt="RAG Architecture" src="https://img.shields.io/badge/architecture-RAG_Code_Search-d97706?style=flat-square">
  <img alt="Theme" src="https://img.shields.io/badge/theme-Light_%26_Dark-172033?style=flat-square">
</p>

<br>

[✨ Features](#-features) · [🏗 Architecture](#-architecture) · [🔄 RAG Pipeline](#-rag--embedding-pipeline) · [⚡ Quick Start](#-quick-start) · [🔐 Environment Variables](#-environment-variables) · [📁 Project Structure](#-project-structure)

</div>

---

## 📖 Overview

**RepoMind** transforms static Git repositories into interactive, queryable knowledge bases. By combining GitHub API indexing, Google Gemini's multimodal LLMs, and PostgreSQL `pgvector` cosine similarity embeddings, developers and teams can onboard onto unfamiliar codebases in minutes.

Ask broad architectural questions (*"How does routing work?"* or *"Where is authentication handled?"*) or specific implementation queries (*"Which file should I edit to update the checkout modal?"*), and RepoMind retrieves the precise source code chunks and explains them step-by-step with interactive syntax-highlighted code tabs.

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🔍 **Semantic Codebase Q&A** | Query any repository in natural language; receives structured AI responses grounded directly in repository files. |
| ⚡ **768-D Vector Embeddings** | Leverages Google Gemini `gemini-embedding-001` with cosine similarity search (`<=>`) in PostgreSQL via `pgvector`. |
| 💻 **Interactive Code Viewer** | Multi-tab code reference inspector in answer modals and slide-overs to inspect the exact source files cited by the AI. |
| 📜 **AI Commit Summaries** | Automatically polls latest Git commits via Octokit and generates concise, bulleted change summaries using Gemini AI. |
| 💾 **Persistent Q&A Knowledge Base** | Save verified answers with one click into a shared project Q&A library for team-wide discovery. |
| 📂 **Multi-Project Switching** | Connect multiple public or private GitHub repositories and switch between them instantly in the sidebar. |
| 🌓 **Light & Dark Theme Switcher** | Modern minimalist UI with built-in theme toggle powered by shadcn UI and `next-themes` (defaults to clean light theme). |
| 🔐 **Clerk Authentication** | Seamless developer authentication supporting GitHub and Google OAuth, webhook syncing, and protected procedures. |
| 💳 **Credit & Token Management** | Built-in credit calculation per indexed file with user balance tracking and billing readiness. |

---

## 🏗 Architecture

```mermaid
flowchart TB
  classDef client fill:#1e293b,color:#fff,stroke:#3b82f6,stroke-width:2px
  classDef app fill:#f8fafc,color:#0f172a,stroke:#94a3b8,stroke-width:1px
  classDef ai fill:#f3e8ff,color:#581c87,stroke:#a855f7,stroke-width:1px
  classDef data fill:#ecfdf5,color:#064e3b,stroke:#10b981,stroke-width:1px
  classDef external fill:#eff6ff,color:#1e3a8a,stroke:#3b82f6,stroke-width:1px

  Browser["💻 Client Browser<br/>(Next.js 15 · React 19 · shadcn UI)"]:::client

  subgraph NextApp ["Next.js App Router (Fullstack)"]
    Auth["🔐 Clerk Authentication"]:::app
    TRPC["⚡ tRPC v11 API Router"]:::app
    ServerActions["⚙️ Next.js Server Actions<br/>(Streaming AI Responses)"]:::app
    Loader["📦 GitHub Repository Indexer"]:::app
  end

  subgraph Database ["Neon PostgreSQL (Serverless)"]
    Prisma["Prisma ORM"]:::data
    PGVector[("pgvector Extension<br/>SourceCodeEmbedding [768]")]:::data
  end

  subgraph AI_Engine ["Google Gemini AI"]
    GeminiModel["Gemini 1.5 Flash<br/>(Code Explanation & Summaries)"]:::ai
    GeminiEmbed["gemini-embedding-001<br/>(768-Dimensional Embeddings)"]:::ai
  end

  subgraph ExternalServices ["External Integrations"]
    GitHub["🐙 GitHub API (Octokit)"]:::external
    ClerkAuth["🔑 Clerk Identity Provider"]:::external
  end

  Browser <--> Auth & TRPC & ServerActions
  Auth <--> ClerkAuth
  TRPC <--> Prisma
  Prisma <--> PGVector
  Loader --> GitHub
  Loader --> GeminiModel
  Loader --> GeminiEmbed
  Loader --> PGVector
  ServerActions --> GeminiEmbed
  ServerActions --> PGVector
  ServerActions --> GeminiModel
```

---

## 🔄 RAG & Embedding Pipeline

```mermaid
sequenceDiagram
  autonumber
  actor Dev as Developer
  participant UI as RepoMind Dashboard
  participant Action as Server Action (askQuestion)
  participant Emb as Gemini Embedding API
  participant DB as PostgreSQL (pgvector)
  participant LLM as Gemini 1.5 Flash

  Dev->>UI: Types question: "How does user authentication work?"
  UI->>Action: Submits question + current projectId
  Action->>Emb: Generate 768-D vector for question text
  Emb-->>Action: Returns query embedding vector
  Action->>DB: Cosine similarity search (1 - (summaryEmbedding <=> vector))
  DB-->>Action: Top matching source files & summaries
  Action->>LLM: Stream prompt (Question + Context Source Files)
  LLM-->>UI: Real-time streamed answer + cited source references
  UI-->>Dev: Displays structured answer with interactive code tabs
```

---

## 🛠 Tech Stack

### **Frontend**
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Component Primitives**: [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) (Light / Dark Mode)
- **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)

### **Backend & AI**
- **API Protocol**: [tRPC v11](https://trpc.io/) (End-to-End Type Safety)
- **AI Models**: [Google Gemini 1.5 Flash](https://ai.google.dev/) & `gemini-embedding-001`
- **SDKs**: `@google/generative-ai`, `@ai-sdk/google`, `ai`
- **Git Integration**: [Octokit](https://github.com/octokit/rest.js/)

### **Database & Infrastructure**
- **Database**: [Neon PostgreSQL](https://neon.tech/) (Serverless Postgres)
- **Vector Search**: `pgvector` (`vector(768)`)
- **ORM**: [Prisma ORM v6](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/satishydv/Repo-Mind.git
cd Repo-Mind
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and configure the required keys:

```env
# Database (Neon PostgreSQL with pgvector)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."

# GitHub Personal Access Token (Optional / Default)
GITHUB_TOKEN="ghp_..."
```

### 4. Setup Database & Vector Schema
```bash
# Push schema to PostgreSQL database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using RepoMind!

---

## 🔐 Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (must have `pgvector` enabled) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk publishable frontend API key |
| `CLERK_SECRET_KEY` | **Yes** | Clerk backend secret key |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for embeddings and Q&A inference |
| `GITHUB_TOKEN` | Optional | GitHub personal access token for private repos or higher rate limits |

---

## 📁 Project Structure

```
gitsas/
├── prisma/
│   └── schema.prisma            # Database models (User, Project, Commit, SourceCodeEmbedding, Question)
├── src/
│   ├── app/
│   │   ├── (protected)/         # Authenticated routes
│   │   │   ├── dashboard/       # Project dashboard, Q&A modal, commit timeline
│   │   │   ├── create/          # Link GitHub repository page
│   │   │   ├── qa/              # Saved Q&A list & slide-over drawer
│   │   │   ├── meetings/        # Meeting analysis (Coming Soon)
│   │   │   ├── billing/         # Credit & billing management (Coming Soon)
│   │   │   └── app-sidebar.tsx  # Project navigation sidebar
│   │   ├── sign-in/             # Minimalist Clerk sign-in page
│   │   ├── sign-up/             # Minimalist Clerk sign-up page
│   │   ├── layout.tsx           # Root layout with ThemeProvider & Clerk
│   │   └── page.tsx             # Landing / redirect page
│   ├── components/
│   │   ├── ui/                  # shadcn UI components (button, dialog, dropdown, etc.)
│   │   ├── code-references.tsx  # Multi-tab code syntax viewer
│   │   ├── theme-toggle.tsx     # Light/Dark mode switcher
│   │   └── theme-provider.tsx   # next-themes wrapper
│   ├── hooks/
│   │   └── use-project.ts       # Active project state management hook
│   ├── lib/
│   │   ├── gemini.ts            # Gemini 1.5 & gemini-embedding-001 client
│   │   ├── github.ts            # Octokit commit polling & AI summary helpers
│   │   └── github-loader.ts     # Recursive repo fetching & chunk embedding
│   ├── server/
│   │   └── api/
│   │       ├── routers/         # tRPC routers (project, question, user)
│   │       ├── root.ts          # Root tRPC definition
│   │       └── trpc.ts          # tRPC context & procedures
│   └── styles/
│       └── globals.css          # Tailwind CSS v4 design tokens & dark mode variables
└── package.json
```

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js dev server with Turbopack |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Runs production server |
| `npm run typecheck` | Type-checks all TypeScript files without emitting code |
| `npx prisma db push` | Pushes the Prisma schema state to the database |
| `npx prisma studio` | Launches interactive Prisma visual database GUI |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/satishydv/Repo-Mind/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for developers by <a href="https://github.com/satishydv">Satish Yadav</a></sub>
</div>