import { GoogleGenerativeAI } from '@google/generative-ai'
import 'dotenv/config'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type FindingCategory = 'secrets' | 'injection' | 'web_security' | 'anti_patterns' | 'best_practices'
export type FindingStatus = 'open' | 'fixed' | 'ignored'

export interface SecurityFinding {
  id: string
  file: string
  line: number
  endLine?: number
  type: string
  title: string
  description: string
  category: FindingCategory
  severity: Severity
  codeSnippet: string
  suggestedFix?: string
  aiExplanation?: string
  status: FindingStatus
  createdAt: string
}

export interface CategoryScore {
  name: string
  category: FindingCategory
  score: number // 0-100
  issuesCount: number
}

export interface SecurityAuditReport {
  healthScore: number // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  scannedAt: string
  totalFiles: number
  totalFindings: number
  counts: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  categoryScores: CategoryScore[]
  findings: SecurityFinding[]
}

interface FileToScan {
  fileName: string
  sourceCode: string
}

interface PatternRule {
  id: string
  title: string
  type: string
  category: FindingCategory
  severity: Severity
  regex: RegExp
  description: string
  defaultFix?: string
}

const SECURITY_PATTERNS: PatternRule[] = [
  // 1. Secrets & Credentials Leaks
  {
    id: 'openai-api-key',
    title: 'Hardcoded OpenAI API Key',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'critical',
    regex: /(?:sk-[a-zA-Z0-9_-]{20,48}|sk-proj-[a-zA-Z0-9_-]{40,120})/g,
    description: 'Found an unencrypted OpenAI API key hardcoded in source code.',
    defaultFix: 'Move API key to an environment variable: process.env.OPENAI_API_KEY',
  },
  {
    id: 'gemini-google-api-key',
    title: 'Hardcoded Google / Gemini API Key',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'critical',
    regex: /AIza[0-9A-Za-z-_]{35}/g,
    description: 'Detected a hardcoded Google AI / Gemini API key.',
    defaultFix: 'Store API key in .env file and access via process.env.GEMINI_API_KEY',
  },
  {
    id: 'aws-access-key',
    title: 'AWS Access Key ID Leaked',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'critical',
    regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    description: 'Detected hardcoded AWS Access Key ID.',
    defaultFix: 'Load AWS credentials from environment variables or AWS IAM roles.',
  },
  {
    id: 'github-pat',
    title: 'GitHub Personal Access Token',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'critical',
    regex: /(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{60,})/g,
    description: 'Detected an exposed GitHub Personal Access Token in repository source.',
    defaultFix: 'Revoke token immediately and use process.env.GITHUB_TOKEN.',
  },
  {
    id: 'stripe-secret-key',
    title: 'Stripe Secret Key Leaked',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'critical',
    regex: /(?:sk_live_[0-9a-zA-Z]{24,34}|rk_live_[0-9a-zA-Z]{24,34})/g,
    description: 'Found a production Stripe Secret API Key in plain text.',
    defaultFix: 'Use process.env.STRIPE_SECRET_KEY in server-side configuration only.',
  },
  {
    id: 'private-key-leak',
    title: 'Private Cryptographic Key',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'critical',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    description: 'Private SSH / RSA key block committed to repository.',
    defaultFix: 'Do not commit private keys. Store in secure secret management or env.',
  },
  {
    id: 'db-connection-string',
    title: 'Hardcoded Database URI with Credentials',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'critical',
    regex: /(?:postgres|postgresql|mysql|mongodb|redis):\/\/[a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_\-\.@#$%^&*!]+@[a-zA-Z0-9_\-\.]+/g,
    description: 'Database connection URI containing hardcoded username and password.',
    defaultFix: 'Store the connection string in process.env.DATABASE_URL.',
  },
  {
    id: 'hardcoded-password-assignment',
    title: 'Hardcoded Password Assignment',
    type: 'Secret Leak',
    category: 'secrets',
    severity: 'high',
    regex: /(?:password|passwd|pwd|secret_key)\s*[:=]\s*["'][a-zA-Z0-9@#$%^&*!_\-]{6,}["']/gi,
    description: 'Hardcoded password string found assigned in code.',
    defaultFix: 'Remove hardcoded credentials and inject via runtime environment variables.',
  },

  // 2. SQL & Data Injection
  {
    id: 'sql-raw-query-concat',
    title: 'SQL Injection via Raw Query Interpolation',
    type: 'SQL Injection',
    category: 'injection',
    severity: 'critical',
    regex: /(?:\$queryRawUnsafe|\.query|\.execute)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/g,
    description: 'Dynamic SQL query built using raw template string interpolation without parameterized binding.',
    defaultFix: 'Use parameterized queries, Prisma $queryRaw with tagged templates, or prepared statements.',
  },
  {
    id: 'sql-string-concat',
    title: 'SQL Injection via String Concatenation',
    type: 'SQL Injection',
    category: 'injection',
    severity: 'high',
    regex: /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+.*["']\s*\+\s*[a-zA-Z0-9_]+/gi,
    description: 'Detected SQL command constructed by direct string concatenation.',
    defaultFix: 'Always use parameterized SQL queries or ORM query builders.',
  },

  // 3. Web & Application Security
  {
    id: 'xss-dangerously-set-inner-html',
    title: 'Potential XSS via dangerouslySetInnerHTML',
    type: 'Cross-Site Scripting (XSS)',
    category: 'web_security',
    severity: 'high',
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*(?!['"`]<)[a-zA-Z0-9_.]+/g,
    description: 'dangerouslySetInnerHTML used with non-static content without DOMPurify sanitization.',
    defaultFix: 'Sanitize untrusted HTML with DOMPurify.sanitize() before rendering, or use standard React JSX elements.',
  },
  {
    id: 'dangerous-eval-execution',
    title: 'Dangerous Dynamic Code Execution (eval/Function)',
    type: 'Remote Code Execution',
    category: 'web_security',
    severity: 'critical',
    regex: /(?:eval\s*\(|new\s+Function\s*\()/g,
    description: 'Usage of eval() or new Function() allows arbitrary code execution if user inputs reach it.',
    defaultFix: 'Refactor code to avoid dynamic code evaluation. Use structured data parsers like JSON.parse.',
  },
  {
    id: 'path-traversal-vulnerability',
    title: 'Potential Path Traversal in File Operations',
    type: 'Path Traversal',
    category: 'web_security',
    severity: 'high',
    regex: /(?:readFile|writeFile|readFileSync|writeFileSync|unlink)\s*\(\s*(?:path\.join|path\.resolve)\([^)]*(?:req\.|params\.|query\.|input\.)/g,
    description: 'File system access using unsanitized request input paths can allow directory traversal.',
    defaultFix: 'Validate and sanitize file paths using path.normalize and ensure it resides within a strict safe base directory.',
  },
  {
    id: 'cors-wildcard-with-credentials',
    title: 'Overly Permissive CORS Policy',
    type: 'Security Misconfiguration',
    category: 'web_security',
    severity: 'medium',
    regex: /(?:origin:\s*["']\*["'].*credentials:\s*true|Access-Control-Allow-Origin:\s*\*)/gi,
    description: 'Wildcard CORS origin (*) used or combined with credentials.',
    defaultFix: 'Explicitly whitelist trusted origins instead of using wildcard *.',
  },
  {
    id: 'insecure-crypto-cipher',
    title: 'Deprecated / Weak Cryptographic Algorithm',
    type: 'Weak Cryptography',
    category: 'web_security',
    severity: 'medium',
    regex: /createCipher(?:iv)?\s*\(\s*["'](?:des|rc4|md5|sha1)["']/gi,
    description: 'Detected weak or deprecated encryption/hashing algorithm.',
    defaultFix: 'Upgrade to modern secure cryptographic standards such as AES-256-GCM or SHA-256 / SHA-512.',
  },

  // 4. Anti-Patterns & Code Quality
  {
    id: 'unhandled-raw-any-cast',
    title: 'Unsafe "any as unknown as any" Type Escaping',
    type: 'Anti-Pattern',
    category: 'anti_patterns',
    severity: 'low',
    regex: /as\s+unknown\s+as\s+any|as\s+any\s+as\s+any/g,
    description: 'Double any assertion bypasses TypeScript compile-time safety and hides potential runtime crashes.',
    defaultFix: 'Define a proper interface or use unknown with Zod schema parsing.',
  },
  {
    id: 'hardcoded-localhost-endpoint',
    title: 'Hardcoded Localhost URL in Source',
    type: 'Configuration Anti-Pattern',
    category: 'anti_patterns',
    severity: 'low',
    regex: /["']http:\/\/localhost:\d{3,5}["']/g,
    description: 'Hardcoded http://localhost endpoint will fail when deployed to production.',
    defaultFix: 'Replace with process.env.NEXT_PUBLIC_API_URL or dynamic relative routing.',
  },
  {
    id: 'missing-try-catch-db',
    title: 'Async Database Call without Error Handling',
    type: 'Reliability Issue',
    category: 'anti_patterns',
    severity: 'low',
    regex: /await\s+ctx\.db\.[a-zA-Z]+\.(?:create|update|delete|deleteMany)\((?:(?!catch|try)[\s\S]){1,80}\);/g,
    description: 'Database mutation executed without local error catching or boundary handling.',
    defaultFix: 'Wrap critical database operations in try/catch blocks or return structured error states.',
  },
  {
    id: 'sensitive-console-logging',
    title: 'Sensitive Credential / Password Logging',
    type: 'Information Disclosure',
    category: 'best_practices',
    severity: 'medium',
    regex: /console\.log\([^)]*(?:password|token|secret|apiKey|authorization)[^)]*\)/gi,
    description: 'Logging potentially sensitive authentication data to console or server logs.',
    defaultFix: 'Sanitize or redact sensitive keys before logging.',
  },
]

/**
 * Scan all project files against static security rules
 */
export function scanCodebase(files: FileToScan[]): SecurityAuditReport {
  const findings: SecurityFinding[] = []
  let findingCounter = 1

  for (const file of files) {
    if (!file.sourceCode || file.sourceCode.trim().length === 0) continue

    const lines = file.sourceCode.split('\n')

    // Test each security pattern
    for (const rule of SECURITY_PATTERNS) {
      // Create new regex instance to reset lastIndex
      const regex = new RegExp(rule.regex.source, rule.regex.flags)
      let match: RegExpExecArray | null

      while ((match = regex.exec(file.sourceCode)) !== null) {
        // Calculate line number
        const matchIndex = match.index
        const prefix = file.sourceCode.slice(0, matchIndex)
        const lineNum = prefix.split('\n').length
        
        // Extract 3-5 line code snippet surrounding the match
        const startLineIdx = Math.max(0, lineNum - 2)
        const endLineIdx = Math.min(lines.length - 1, lineNum + 2)
        const snippetLines = lines.slice(startLineIdx, endLineIdx + 1)
        const snippet = snippetLines.join('\n')

        const findingId = `finding-${findingCounter++}`

        // Avoid duplicate findings on the same line & rule
        const alreadyExists = findings.some(
          f => f.file === file.fileName && f.line === lineNum && f.type === rule.type
        )

        if (!alreadyExists) {
          findings.push({
            id: findingId,
            file: file.fileName,
            line: lineNum,
            endLine: Math.min(lines.length, lineNum + 1),
            type: rule.type,
            title: rule.title,
            description: rule.description,
            category: rule.category,
            severity: rule.severity,
            codeSnippet: snippet,
            suggestedFix: rule.defaultFix,
            status: 'open',
            createdAt: new Date().toISOString(),
          })
        }

        // Avoid infinite loop on zero-length matches
        if (regex.lastIndex === matchIndex) {
          regex.lastIndex++
        }
      }
    }
  }

  // Calculate severity counts
  const counts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
  }

  // Calculate overall Health Score (0-100)
  // Deductions: critical = -25, high = -15, medium = -8, low = -3, info = -1
  let healthScore = 100 - (
    counts.critical * 25 +
    counts.high * 15 +
    counts.medium * 8 +
    counts.low * 3 +
    counts.info * 1
  )
  healthScore = Math.max(0, Math.min(100, healthScore))

  // Determine Letter Grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+'
  if (healthScore >= 95) grade = 'A+'
  else if (healthScore >= 85) grade = 'A'
  else if (healthScore >= 70) grade = 'B'
  else if (healthScore >= 50) grade = 'C'
  else if (healthScore >= 35) grade = 'D'
  else grade = 'F'

  // Calculate Category Scores
  const categories: { name: string; category: FindingCategory }[] = [
    { name: 'Secrets & Auth', category: 'secrets' },
    { name: 'SQL & Data Injection', category: 'injection' },
    { name: 'App Security & XSS', category: 'web_security' },
    { name: 'Code Quality & Anti-Patterns', category: 'anti_patterns' },
  ]

  const categoryScores: CategoryScore[] = categories.map(cat => {
    const catFindings = findings.filter(f => f.category === cat.category)
    let catScore = 100 - (
      catFindings.filter(f => f.severity === 'critical').length * 30 +
      catFindings.filter(f => f.severity === 'high').length * 20 +
      catFindings.filter(f => f.severity === 'medium').length * 10 +
      catFindings.filter(f => f.severity === 'low').length * 5
    )
    catScore = Math.max(0, Math.min(100, catScore))

    return {
      name: cat.name,
      category: cat.category,
      score: catScore,
      issuesCount: catFindings.length,
    }
  })

  return {
    healthScore,
    grade,
    scannedAt: new Date().toISOString(),
    totalFiles: files.length,
    totalFindings: findings.length,
    counts,
    categoryScores,
    findings,
  }
}

/**
 * Generate Gemini AI Deep-Dive Explanation and Clean Patch for a finding
 */
export async function generateAIFix(finding: SecurityFinding, fullSourceCode?: string): Promise<{
  explanation: string
  suggestedFix: string
  remediationSnippet: string
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })
    const prompt = `
You are a Principal Application Security Engineer.
Analyze the following security vulnerability/anti-pattern detected in the codebase:

FILE: ${finding.file} (Line ${finding.line})
VULNERABILITY TYPE: ${finding.type} (${finding.severity.toUpperCase()} severity)
TITLE: ${finding.title}
DESCRIPTION: ${finding.description}

CODE SNIPPET:
\`\`\`
${finding.codeSnippet}
\`\`\`

${fullSourceCode ? `SURROUNDING FILE CONTEXT:\n\`\`\`\n${fullSourceCode.slice(0, 3000)}\n\`\`\`` : ''}

Please provide a structured response in the following JSON format:
{
  "explanation": "A clear, concise 2-3 sentence explanation of why this code is vulnerable, what the threat model/attack vector is, and the real-world impact.",
  "suggestedFix": "A 1-2 sentence recommendation on how to architecturally fix this issue.",
  "remediationSnippet": "The exact secure, clean replacement code block that solves the issue."
}
Only return valid JSON with no markdown backticks surrounding it.
`

    const response = await model.generateContent(prompt)
    const text = response.response.text().trim()
    const cleanJson = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleanJson)

    return {
      explanation: parsed.explanation || 'Vulnerability detected in source code.',
      suggestedFix: parsed.suggestedFix || 'Refactor to follow secure coding standards.',
      remediationSnippet: parsed.remediationSnippet || finding.codeSnippet,
    }
  } catch (error) {
    console.error('Error generating AI fix:', error)
    return {
      explanation: `${finding.description}. An attacker could exploit this vulnerability to compromise system integrity or confidentiality.`,
      suggestedFix: finding.suggestedFix || 'Refactor code to sanitize inputs or use environment variables.',
      remediationSnippet: `// Recommended Fix for ${finding.type}:\n// 1. Move secrets to environment variables\n// 2. Use parameterized queries\n// 3. Sanitize inputs`,
    }
  }
}
