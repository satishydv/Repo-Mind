'use client'

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
} from '@/components/ui/sidebar'
import { LayoutDashboard, MessageSquareCode, Presentation, CreditCard, Plus, Trash2, GitBranch } from "lucide-react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
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

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white">
      <SidebarHeader className="p-4 border-b border-gray-100 flex flex-row items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <GitBranch className="size-5" />
          </div>
          {open && (
            <span className="text-xl font-bold tracking-tight text-gray-900">
              RepoMind
            </span>
          )}
        </Link>
        {open && <SidebarTrigger className="text-gray-400 hover:text-gray-600 size-8" />}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-6">
        {/* Application Navigation */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <item.icon className={cn("size-4.5 shrink-0", isActive ? "text-white" : "text-gray-500")} />
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
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                            ? "bg-blue-50 text-blue-900 font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <div
                          className={cn(
                            "size-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "border border-blue-500 text-blue-600 bg-white"
                          )}
                        >
                          {firstChar}
                        </div>
                        {open && (
                          <span className="text-sm truncate flex-1">{project.name}</span>
                        )}
                        {open && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                            <Trash2
                              className="size-3.5 text-gray-400 hover:text-red-500 transition-colors"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (window.confirm(`Delete project "${project.name}"?`)) {
                                  archiveProject.mutate(
                                    { projectId: project.id },
                                    {
                                      onSuccess: () => {
                                        toast.success("Project deleted")
                                        ctx.project.getProjects.invalidate()
                                      },
                                    }
                                  )
                                }
                              }}
                            />
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
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium shadow-2xs"
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
  )
}


