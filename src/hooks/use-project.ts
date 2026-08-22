import React, { useEffect } from 'react'
import { api } from '@/trpc/react'
import { useLocalStorage } from 'usehooks-ts'

const useProject = () => {
    const { data: projects, isLoading } = api.project.getProjects.useQuery()
    const [projectId, setProjectId] = useLocalStorage('projectId', '')

    useEffect(() => {
        if (projects && projects.length > 0) {
            const exists = projects.some(p => p.id === projectId)
            if (!projectId || !exists) {
                setProjectId(projects[0]!.id)
            }
        }
    }, [projects, projectId, setProjectId])

    const project = projects?.find(p => p.id === projectId) || (projects && projects.length > 0 ? projects[0] : undefined)

    return {
        projects,
        project,
        projectId: project?.id || projectId,
        setProjectId,
        isLoading
    }
}

export default useProject