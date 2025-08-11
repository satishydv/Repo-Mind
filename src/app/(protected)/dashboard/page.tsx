'use client'
import { useUser } from '@clerk/nextjs'
import React from 'react'
import useProject from '@/hooks/use-project'

const Dashboard = () => {
  const {project} = useProject()
    const {user} = useUser()
  return (
    <div>
     <h1>{project?.name}</h1>
    </div>
    
  )
}

export default Dashboard
