'use client'
import { useUser } from '@clerk/nextjs'
import React from 'react'
import useProject from '@/hooks/use-project'
import { ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'
import Commit from './commit'
import AskQuestionCard from '@/app/(protected)/dashboard/ask-question-card'


const DashboardPage = () => {
  const { project } = useProject()
  
  // Don't render if project is not available
  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No project selected</p>
      </div>
    )
  }
  
  return (
    <div>
      {project?.id}
      <div className='flex items-center justify-between flex-wrap gap-y-4'>
        {/* github link */}
        <div className='w-fit rounded-md bg-primary px-4 py-3'>
          <div className="flex items-center">
            <Github className='size-5 text-white' />
            <div className="ml-2">
              <p className='text-sm font-medium text-white'>This project is linked to {''}
                <Link href={project?.githubUrl ?? ""} className='inline-flex items-center text-white/80 hover:underline'>{project?.githubUrl}
                  <ExternalLink className='ml-1 size-4' />
                </Link>
              </p>
            </div>
          </div>
        </div>

        
      </div>

      <div className='mt-4'>
        <div className='w-full'>
         <AskQuestionCard />
        </div>
      </div>

      <div className='mt-8'></div>
      <Commit/>
    </div>
  )
}

export default DashboardPage
