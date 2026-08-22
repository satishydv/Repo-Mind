'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import useRefetch from '@/hooks/use-refetch'
import { FileText, Key, Info, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type FormInput = {
    repoUrl: string
    projectName: string
    githubToken?: string
}

const CreatePage = () => {
    const { register, handleSubmit, reset } = useForm<FormInput>()
    const createProject = api.project.createProject.useMutation()
    const refetch = useRefetch()
    const router = useRouter()

    function onSubmit(data: FormInput) {
        createProject.mutate({
            name: data.projectName,
            githubUrl: data.repoUrl,
            githubToken: data.githubToken
        },
            {
                onSuccess: (project) => {
                    toast.success('Project created and indexed successfully!')
                    refetch()
                    reset()
                    router.push('/dashboard')
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to create project')
                }
            }
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 shadow-2xs min-h-[calc(100vh-120px)] flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl w-full">
                
                {/* Left Side: END TO END + Illustration matching Image 2 */}
                <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                    <h1 className="text-4xl sm:text-5xl font-black text-blue-500 tracking-wider uppercase">
                        END TO END
                    </h1>

                    {/* Developer Coding Vector Graphic */}
                    <div className="relative size-64 sm:size-72 flex items-center justify-center">
                        <div className="absolute inset-0 bg-blue-50 rounded-full blur-2xl opacity-60" />
                        <svg className="size-full relative z-10" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Background circle */}
                            <circle cx="160" cy="160" r="110" fill="#F1F5F9" />
                            {/* Developer character */}
                            <circle cx="160" cy="120" r="30" fill="#FDBA74" />
                            {/* Headphones */}
                            <path d="M130 120 C130 90 190 90 190 120" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" fill="none" />
                            <rect x="126" y="112" width="10" height="18" rx="4" fill="#1D4ED8" />
                            <rect x="184" y="112" width="10" height="18" rx="4" fill="#1D4ED8" />
                            {/* Hair */}
                            <path d="M136 112 C136 96 184 96 184 112 Z" fill="#1E293B" />
                            {/* Body / Shirt */}
                            <path d="M110 200 C110 160 210 160 210 200 Z" fill="#94A3B8" />
                            {/* Laptop Desk */}
                            <rect x="90" y="200" width="140" height="60" rx="6" fill="#0F172A" />
                            <circle cx="160" cy="226" r="6" fill="#3B82F6" />
                            <rect x="70" y="258" width="180" height="10" rx="3" fill="#334155" />
                            <rect x="150" y="268" width="20" height="30" fill="#1E293B" />
                            {/* Floating code / binary blocks on right */}
                            <g fill="#3B82F6" opacity="0.8">
                                <rect x="220" y="100" width="10" height="10" rx="2" />
                                <rect x="235" y="100" width="10" height="10" rx="2" fill="#60A5FA" />
                                <rect x="250" y="100" width="10" height="10" rx="2" />
                                <rect x="265" y="100" width="10" height="10" rx="2" fill="#93C5FD" />
                                <rect x="280" y="100" width="10" height="10" rx="2" />
                                <rect x="220" y="115" width="10" height="10" rx="2" fill="#93C5FD" />
                                <rect x="250" y="115" width="10" height="10" rx="2" fill="#60A5FA" />
                                <rect x="280" y="115" width="10" height="10" rx="2" />
                                <rect x="235" y="130" width="10" height="10" rx="2" />
                                <rect x="265" y="130" width="10" height="10" rx="2" fill="#3B82F6" />
                                <rect x="220" y="145" width="10" height="10" rx="2" fill="#60A5FA" />
                                <rect x="250" y="145" width="10" height="10" rx="2" />
                                <rect x="280" y="145" width="10" height="10" rx="2" fill="#93C5FD" />
                            </g>
                        </svg>
                    </div>
                </div>

                {/* Right Side: Link GitHub Form matching Image 2 */}
                <div className="lg:col-span-7 max-w-lg w-full mx-auto lg:mx-0 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Link your GitHub Repository
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Enter the URL of your GitHub repository to link it to RepoMind.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Project Name Input */}
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-gray-400" />
                            <Input
                                {...register('projectName', { required: true })}
                                placeholder="ChatPDF"
                                className="pl-10.5 h-11 rounded-lg border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400"
                                required
                            />
                        </div>

                        {/* GitHub Repository URL Input */}
                        <div className="relative">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 fill-gray-400" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <Input
                                {...register('repoUrl', { required: true })}
                                placeholder="https://github.com/elliott-chong/chatpdf-yt"
                                type="url"
                                className="pl-10.5 h-11 rounded-lg border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400"
                                required
                            />
                        </div>

                        {/* GitHub Token (Optional) Input */}
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-gray-400" />
                            <Input
                                {...register('githubToken')}
                                placeholder="GitHub Token (optional, for private repositories)"
                                type="password"
                                className="pl-10.5 h-11 rounded-lg border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Credit Charge Notice Box matching Image 2 */}
                        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                            <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="font-medium text-amber-900">
                                    You will be charged <span className="font-bold text-amber-950">46 credits</span> for this repository.
                                </p>
                                <p className="text-amber-700/90 font-normal">
                                    You have <span className="font-semibold text-blue-700">150 credits</span> remaining.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button matching Image 2 */}
                        <Button
                            type="submit"
                            disabled={createProject.isPending}
                            className="w-auto h-10 px-6 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                        >
                            {createProject.isPending ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating Project...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Project</span>
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreatePage