import { postRouter } from "@/server/api/routers/post";
import { projectRouter } from "@/server/api/routers/project";
import { securityRouter } from "@/server/api/routers/security";
import { architectureRouter } from "@/server/api/routers/architecture";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  project: projectRouter,
  security: securityRouter,
  architecture: architectureRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
