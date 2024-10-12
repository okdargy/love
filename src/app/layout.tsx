import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Provider } from "@/components/Provider";
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/Theme";
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

export async function getSha() {
  let sha = '';
  try {
    sha = execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    console.error('Error fetching commit SHA:', error);
  }

  return sha
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await validateRequest();
  const sha = await getSha();

  return (
    <html lang="en">
      <body className={poppins.className}>
        <Provider>
          <ThemeProvider defaultTheme="dark" storageKey="theme">
            <SessionProvider value={session}>
                <div id="container">
                  <Navbar session={session} />
                  <main className="w-full max-w-screen-lg mx-auto py-3 px-6">
                    {children}
                  </main>
                  <Footer sha={sha} />
                </div>
              <Toaster richColors />
            </SessionProvider>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
