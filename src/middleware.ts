import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes if not defined private by default
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Protect all routes except public routes check
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}