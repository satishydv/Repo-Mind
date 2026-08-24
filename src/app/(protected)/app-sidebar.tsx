'use client'

import React, { useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  LayoutDashboard,
  MessageSquareCode,
  Presentation,
  CreditCard,
  Plus,
  Trash2,
  GitBranch,
  ShieldAlert,
  Network
} from "lucide-react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import { toast } from 'sonner'

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Security Auditor",
    url: "/security",
    icon: ShieldAlert,
  },
  {
    title: "Architecture Graph",
    url: "/architecture",
    icon: Network,
  },
  {
    title: "Q&A",
    url: "/qa",
    icon: MessageSquareCode,
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: Presentation,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const { projects, projectId, setProjectId } = useProject()
  const ctx = api.useUtils()
  const archiveProject = api.project.archiveProject.useMutation()
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)

  const handleDelete = () => {
    if (!projectToDelete) return
    archiveProject.mutate(
      { projectId: projectToDelete.id },
      {
        onSuccess: () => {
          toast.success("Project deleted successfully")
          ctx.project.getProjects.invalidate()
          setProjectToDelete(null)
        },
        onError: () => {
          toast.error("Failed to delete project")
        },
      }
    )
  }

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-colors">
        <SidebarHeader className="p-4 border-b border-sidebar-border flex flex-row items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg premium-gradient-glow flex items-center justify-center text-white shrink-0">
              <GitBranch className="size-5" />
            </div>
            {open && (
              <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
                RepoMind
              </span>
            )}
          </Link>
          {open && <SidebarTrigger className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 size-8" />}
        </SidebarHeader>

        <SidebarContent className="px-3 py-4 space-y-6">
          {/* Application Navigation */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Application
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navItems.map(item => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                            isActive
                              ? 'premium-gradient-glow text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          )}
                        >
                          <item.icon className={cn("size-4.5 shrink-0", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                          {open && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Projects Section */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Your Projects
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {projects?.map(project => {
                  const isSelected = project.id === projectId
                  const firstChar = project.name?.[0]?.toUpperCase() || 'P'
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton asChild>
                        <Link
                          href="/dashboard"
                          onClick={() => setProjectId(project.id)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group",
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 font-semibold"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <div
                            className={cn(
                              "size-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                              isSelected
                                ? "premium-gradient-glow text-white"
                                : "border border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800"
                            )}
                          >
                            {firstChar}
                          </div>
                          {open && (
                            <span className="text-sm truncate flex-1">{project.name}</span>
                          )}
                          {open && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                              <span
                                role="button"
                                aria-label={`Delete project ${project.name}`}
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors inline-flex items-center justify-center cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setProjectToDelete({ id: project.id, name: project.name })
                                }}
                              >
                                <Trash2 className="size-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                              </span>
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}

                <div className="pt-2">
                  <Link href="/create">
                    <Button
                      variant="amber-light"
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Plus className="size-3.5" />
                      {open && <span>Create Project</span>}
                    </Button>
                  </Link>
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Delete Confirmation Popup Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen && !archiveProject.isPending) {
            setProjectToDelete(null)
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
          <AlertDialogHeader className="text-left space-y-3">
            <div className="size-11 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/50">
              <Trash2 className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Project
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{projectToDelete?.name}&rdquo;</span>? This will remove the project from your workspace.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex flex-row items-center justify-end gap-2.5 sm:space-x-0">
            <AlertDialogCancel
              disabled={archiveProject.isPending}
              className="rounded-lg h-9 px-4 text-xs font-medium border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={archiveProject.isPending}
              className="rounded-lg h-9 px-4 text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-xs focus-visible:ring-red-500 transition-colors cursor-pointer"
            >
              {archiveProject.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


