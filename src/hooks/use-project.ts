import React from 'react'
import { api } from '@/trpc/react'
import { useLocalStorage } from 'usehooks-ts'

const useProject = () => {
    const {data: projects, isLoading} = api.project.getProjects.useQuery()
    const [projectId, setProjectId] = useLocalStorage('projectId', '')
    const project = projects?.find(project => project.id === projectId)
    return {projects,
         project,
          projectId,
           setProjectId,
            isLoading
        }
}
// this hook is used to get the project details and the projects list from  the database
export default useProject