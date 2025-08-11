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
import { Bot, LayoutDashboard, Presentation, CreditCard, Plus } from "lucide-react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useSidebar } from '@/components/ui/sidebar'

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
  const {open} = useSidebar()

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <div className='flex items-center gap-2'>
          <Image src="/logo.png" alt="logo" width={43} height={43} />
          {open && <span className='text-2xl font-bold'>RepoMind</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Application
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={item.url}
                        className={cn({ '!bg-primary !text-white': pathname === item.url })}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            Your Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                {projects.map(project=>{
                    return (
                        <SidebarMenuItem key={project.name}>
                            <SidebarMenuButton asChild>
                                <div>
                                    <div className={cn(
                                        "rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary",
                                        {
                                            "bg-primary text-white": true,
                                        }
                                    )}>
                                        <span>{project.name[0]}</span>
                                    </div>
                                    <span>{project.name}</span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
                <div className='h-2'>

                </div>
                {open && (
                    <SidebarMenuButton asChild>
                        <Link href="/projects">
                            <Plus />
                            <span>Add Project</span>
                        </Link>
                    </SidebarMenuButton>
                )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}


