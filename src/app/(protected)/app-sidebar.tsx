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
} from '@/components/ui/sidebar'
import { Bot, LayoutDashboard, Presentation, CreditCard, Plus, Brain, FolderPlus, Trash2 } from "lucide-react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useSidebar } from '@/components/ui/sidebar'
import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import { toast } from 'sonner'


const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Q&A",
    url: "/qa",
    icon: Bot,
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
  {
    title: "Project",
    url: "/create",
    icon: FolderPlus,
  },
]

const projects = [
  {
    name: "Project 1",
  },
  {
    name: "Project 2",
  },
  {
    name: "Project 3",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const { projects, projectId, setProjectId } = useProject()
  const ctx = api.useUtils()
  const archiveProject = api.project.archiveProject.useMutation()

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-white/10">
      <SidebarHeader className="p-4">
        <div className='flex items-center gap-3'>
          <div className="p-2 bg-primary rounded-lg shrink-0 shadow-lg shadow-primary/20">
            <Brain className="size-6 text-white" />
          </div>
          {open && <span className='text-xl font-bold tracking-tight'>RepoMind</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {items.map(item => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                          pathname === item.url
                            ? '!bg-primary !text-white shadow-lg shadow-primary/10'
                            : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <item.icon className="size-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Your Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {projects?.map(project => {
                return (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton asChild>
                      <div
                        onClick={() => setProjectId(project.id)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all",
                          project.id === projectId
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "rounded-xl size-8 flex items-center justify-center text-xs font-black transition-all shadow-sm",
                          project.id === projectId
                            ? "bg-linear-to-br from-primary to-purple-500 text-white shadow-primary/20"
                            : "bg-linear-to-br from-pastel-blue to-pastel-purple text-primary/70 dark:text-white/70"
                        )}>
                          <span>{project.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-bold tracking-tight truncate">{project.name}</span>
                        <div className='ml-auto pl-2'>
                          <Trash2
                            className='size-4 text-rose-500/50 hover:text-rose-500 transition-colors shrink-0'
                            onClick={(e) => {
                              e.stopPropagation()
                              const confirmed = window.confirm("Are you sure you want to delete this project?")
                              if (confirmed) {
                                archiveProject.mutate({ projectId: project.id }, {
                                  onSuccess: () => {
                                    toast.success("Project deleted")
                                    ctx.project.getProjects.invalidate()
                                  },
                                  onError: () => {
                                    toast.error("Failed to delete project")
                                  }
                                })
                              }
                            }}
                          />
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              <div className="mt-4 px-2">
                <Link href="/create">
                  <Button variant="outline" className="w-full flex justify-start gap-2 border-dashed hover:border-primary hover:text-primary transition-all">
                    <Plus className="size-4" />
                    {open && <span>New Project</span>}
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


