import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Provider } from "@/components/Provider";
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";
import Navbar from "@/components/Navbar";
import { SessionProvider } from "@/components/SessionContext";
import { validateRequest } from "@/lib/auth";
import Footer from "@/components/Footer";
import { execSync } from 'child_process';
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { getAnnouncementSettings } from "@/lib/announcement";
import { InfoIcon, MessageCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-utils";
// import Attention from "@/components/Attention";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: "LOVE",
  description: "Welcome to List Of Values: Everlast, your #1 reliable source for Trading & Economy information on Polytoria",
  openGraph: {
    images: [
      {
        url: "/favicon-96x96.png"
      }
    ]
  }
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }
  ],
};

async function getFooterInfo() {
  let sha = '';
  let lastUpdate = '';
  
  try {
    sha = execSync('git rev-parse HEAD').toString().trim();
    const gitDate = execSync('git log -1 --format=%cd').toString().trim();
    const date = new Date(gitDate);
    lastUpdate = formatRelativeTime(date);
  } catch (error) {
    console.error('Error fetching commit info:', error);
  }

  return { sha, lastUpdate };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await validateRequest();
  const { sha, lastUpdate } = await getFooterInfo();
  const announcement = await getAnnouncementSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <Provider>
            <SessionProvider value={session}>
                <SidebarProvider>
                  <Navbar session={session} />
                  <SidebarInset>
                    <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                      <SidebarTrigger aria-label="Open sidebar" />
                      <div className="ml-auto md:hidden">
                        <ThemeToggle />
                      </div>
                    </header>
                    {announcement.enabled && announcement.message.length > 0 && (
                      <div className="sticky top-14 md:top-0 z-30 w-full border-b bg-[#fdecec] dark:bg-[#211010]  text-primary">
                        <div className="mx-auto w-full max-w-screen-lg px-6 py-2 text-sm">
                          <InfoIcon className="inline mr-2" size={16} />
                          {announcement.message}
                        </div>
                      </div>
                    )}
                    <main className="w-full max-w-screen-lg mx-auto py-4 px-6">
                      {children}
                    </main>
                    <Footer sha={sha} lastUpdate={lastUpdate} />
                  </SidebarInset>
                </SidebarProvider>
              <Toaster richColors />
            </SessionProvider>
        </Provider>
      </body>
    </html>
  );
}
