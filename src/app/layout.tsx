import "@/styles/globals.css";
import {ClerkProvider} from '@clerk/nextjs';
import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "RepoMind",
  description: "a brain for github branches",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable}`}>
        <body className="light">
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors/>
        </body>
      </html>
    </ClerkProvider>
  );
}
