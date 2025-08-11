'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
type FormInput = {
    repoUrl: string
    projectName: string
    githubToken?: string
}

const CreatePage = () => {
    const {register, handleSubmit, reset} = useForm<FormInput>()
    const createProject = api.project.createProject.useMutation()


    function onSubmit(data: FormInput) {
        window.alert(JSON.stringify(data, null, 2))
        createProject.mutate({
            name: data.projectName,
            githubUrl: data.repoUrl,
            githubToken: data.githubToken
        },
        {
            onSuccess: () => {
                toast.success('Project created successfully')
                reset()
            },
            onError: (error) => {
                toast.error(error.message)
            }
        }
    )}

  return (
    <div className='flex items-center gap-12 h-full justify-center'>
        <img src="/github.svg" alt="github-logo" className='h-80 w-auto' />
        <div>
            <div>
            <h1 className='font-semibold text-2xl'>Link your GitHub repository </h1>
            <p className='text-sm text-muted-foreground'>
                Enter the URL of your GitHub repository to get started
            </p>
            </div>
            <div className='h-4'></div>
            <div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input {...register('projectName', {required: true})}
                    placeholder='ProjectName' 
                    required
                    />

                    <div className='h-2'></div>
                    <Input {...register('repoUrl', {required: true})}
                    placeholder='GitHub Repository URL' 
                    type='url'
                    required
                    />
                    <div className='h-2'></div>
                    <Input {...register('githubToken')}
                    placeholder='GitHub Token (Optional)' 
                    />
                    <div className='h-2'></div>
                    <Button type='submit'>Create Project</Button>
                </form>  
            </div>
        </div>
    </div>
    
  )
}

export default CreatePage