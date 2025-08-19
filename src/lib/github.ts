import { auth } from '@clerk/nextjs/server';
import { Octokit } from '@octokit/rest';
import { db } from '../server/db';
import { aiSummariseCommit } from './gemini';
import axios from 'axios';

// Initialize Octokit client for GitHub API interactions
export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const githubUrl = 'https://github.com/kendrekaran/kendrekaran';

// Type definition for commit data structure
type Response = {
    commitHash: string;
    commitMessage: string;
    commitDate: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
}

/**
 * Fetches commit data from GitHub API for a given repository
 * @param githubUrl - The GitHub repository URL
 * @returns Promise<Response[]> - Array of formatted commit data
 * 
 * Logic:
 * 1. Extracts owner and repo from GitHub URL using split method
 * 2. Makes API call to GitHub to get all commits using octokit.request
 * 3. Sorts commits by date (newest first)
 * 4. Takes first 15 commits and formats them to our Response type
 * 5. Returns commit hash, message, author name, author avatar, and commit date
 */
export const getCommitHashes = async (
  githubUrl: string,
): Promise<Response[]> => {
  // https://github.com/docker/genai-stack
  // Remove .git suffix if present and extract owner/repo
  const cleanUrl = githubUrl.replace(/\.git$/, '');
  const [owner, repo] = cleanUrl.split('/').slice(-2);
  if (!owner || !repo) {
    throw new Error("Invalid github url");
  }
  const { data } = await octokit.rest.repos.listCommits({ owner, repo });
  const sortedCommits = data.sort((a: any, b: any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime());

  return sortedCommits.slice(0, 15).map((commit: any) => ({
    commitHash: commit.sha as string,
    commitMessage: commit.commit.message ?? "",
    commitAuthorName: commit.commit?.author?.name ?? "",
    commitAuthorAvatar: commit.author?.avatar_url ?? "",
    commitDate: commit.commit?.author?.date ?? "",
  }));
};

/**
 * Main function to poll and process commits for a project
 * @param projectId - The ID of the project to poll commits for
 * 
 * Logic:
 * 1. Fetches project's GitHub URL from database
 * 2. Gets commit data from GitHub API
 * 3. Filters out already processed commits
 * 4. Generates AI summaries for unprocessed commits using Promise.allSettled
 * 5. Stores commit data and summaries in database
 * 6. Returns the database operation result
 */
export const pollCommits = async (projectId: string) => {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl);
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);
    
    const summaryResponses = await Promise.allSettled(unprocessedCommits.map(commit => {
        return summariseCommit(githubUrl, commit.commitHash);
    }));
    
    const summaries = summaryResponses.map((response) => {
        if (response.status === 'fulfilled') {
            return response.value as string;
        }
        return "";
    });
    
    const commits = await db.commit.createMany({
        data: summaries.map((summary, index) => {
            console.log(`processing commit ${index}`);
            return {
                projectId: projectId,
                commitHash: unprocessedCommits[index]?.commitHash || "",
                commitMessage: unprocessedCommits[index]?.commitMessage || "",
                commitAuthorName: unprocessedCommits[index]?.commitAuthorName || "",
                commitAuthorAvatar: unprocessedCommits[index]?.commitAuthorAvatar || "",
                commitDate: unprocessedCommits[index]?.commitDate || "",
                summary
            };
        })
    });
    
    return commits;
}

async function summariseCommit(githubUrl: string, commitHash: string) {
    // get the diff, then pass the diff into ai
    const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
        headers: {
            Accept: 'application/vnd.github.v3.diff'
        }
    });
    
    return await aiSummariseCommit(data) || "";

}

/**
 * Fetches project's GitHub URL from database
 * @param projectId - The ID of the project
 * @returns Object containing project data and GitHub URL
 * 
 * Logic:
 * 1. Queries database for project by ID
 * 2. Validates that project has a GitHub URL
 * 3. Returns project data and GitHub URL
 */
async function fetchProjectGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: { id: projectId },
        select: { githubUrl: true }
    });

    if (!project?.githubUrl) {
        throw new Error("Project has no github url");
    }

    return { project, githubUrl: project.githubUrl };
}

/**
 * Filters out commits that have already been processed and stored in database
 * @param projectId - The ID of the project
 * @param commitHashes - Array of commits from GitHub API
 * @returns Array of unprocessed commits only
 * 
 * Logic:
 * 1. Fetches all commits already stored in database for this project
 * 2. Compares GitHub commits with database commits using commitHash
 * 3. Returns only commits that don't exist in database (new commits)
 */
async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
    const processedCommits = await db.commit.findMany({ 
        where: { projectId } 
    });
    
    const unprocessedCommits = commitHashes.filter((commit) => 
        !processedCommits.some((processedCommit) => 
            processedCommit.commitHash === commit.commitHash
        )
    );
    
    return unprocessedCommits;
}

// Test with error handling to see what's happening
// console.log('Testing pollCommits...');
// pollCommits('cmehcpth00000g548ih336uze')
//   .then(result => {
//     console.log('✅ Success! Created', result.count, 'commits in database');
//     console.log('Database result:', result);
//   })
//   .catch(error => {
//     console.error('❌ Error:', error.message);
//     console.error('Full error:', error);
//   });