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
  themeColor: "#ff5951",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
}

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

  return (
    <html lang="en">
      <body className={poppins.className}>
        <Provider>
            <SessionProvider value={session}>
                <div id="container">
                  <Navbar session={session} />
                  <main className="w-full max-w-screen-lg mx-auto py-3 px-6">
                    {children}
                  </main>
                  <Footer sha={sha} lastUpdate={lastUpdate} />
                </div>
              <Toaster richColors />
            </SessionProvider>
        </Provider>
      </body>
    </html>
  );
}
