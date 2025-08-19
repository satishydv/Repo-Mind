'use client'
import { useUser } from '@clerk/nextjs'
import React from 'react'
import useProject from '@/hooks/use-project'
import { ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'
import Commit from './commit'


const DashboardPage = () => {
  const { project } = useProject()
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

        <div className='h-4'></div>
        <div className='flex items-center gap-4'>
          TeamMember  
          InviteButton 
          ArchiveButton
        </div>
      </div>

      <div className='mt-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-5'>
             AskQuestion
          MettingCard
        </div>
      </div>

      <div className='mt-8'></div>
      <Commit/>
    </div>
  )
}

export default DashboardPage
