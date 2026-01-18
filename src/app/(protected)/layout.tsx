import { SidebarProvider } from '@/components/ui/sidebar'
import { UserButton } from '@clerk/nextjs'
import React from 'react'
import { AppSidebar } from './app-sidebar'

type Props = {
    children: React.ReactNode
}

const SidebarLayout = ({ children }: Props) => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full flex-1 flex flex-col min-h-screen bg-gradient p-2 md:p-4 transition-all duration-300">
                <div className='flex items-center glass rounded-xl px-6 py-3 mb-4 shadow-sm border-white/10'>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project Dashboard</span>
                    </div>
                    <div className='ml-auto flex items-center gap-4'>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "size-9 border-2 border-primary/20 hover:border-primary/50 transition-all shadow-sm"
                                }
                            }}
                        />
                    </div>
                </div>

                {/* main content */}
                <div className='flex-1 glass border-white/10 shadow-xl rounded-2xl overflow-hidden flex flex-col'>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                        {children}
                    </div>
                </div>
            </main>
        </SidebarProvider>
    )
}

export default SidebarLayout