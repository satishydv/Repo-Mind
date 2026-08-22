import { SidebarProvider } from '@/components/ui/sidebar'
import { UserButton } from '@clerk/nextjs'
import React from 'react'
import { AppSidebar } from './app-sidebar'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

type Props = {
    children: React.ReactNode
}

const SidebarLayout = ({ children }: Props) => {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-slate-50 text-gray-900">
                <AppSidebar />
                <main className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar matching Image 1 */}
                    <header className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between gap-4 sticky top-0 z-30">
                        <div className="relative flex-1 max-w-2xl">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                placeholder="Search for projects, files, commits..."
                                className="pl-10 h-10 w-full rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white text-sm transition-colors placeholder:text-gray-400"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "size-9 border border-gray-200 shadow-2xs"
                                    }
                                }}
                            />
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}

export default SidebarLayout