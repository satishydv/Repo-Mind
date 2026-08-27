import { SidebarProvider } from '@/components/ui/sidebar'
import { UserButton } from '@clerk/nextjs'
import React from 'react'
import { AppSidebar } from './app-sidebar'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

type Props = {
    children: React.ReactNode
}

const SidebarLayout = ({ children }: Props) => {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background text-foreground transition-colors">
                <AppSidebar />
                <main className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar with Search & Theme Toggle */}
                    <header className="h-16 px-6 border-b border-border bg-card flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
                        <div className="relative flex-1 max-w-2xl">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search for projects, files, commits..."
                                className="pl-10 h-10 w-full rounded-lg border-border bg-muted/40 focus:bg-card text-sm transition-colors placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "size-9 border border-gray-200 dark:border-gray-700 shadow-2xs"
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
