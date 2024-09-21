import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Provider } from "@/components/Provider";
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/Theme";
import { SessionProvider } from "@/components/SessionContext";
import { validateRequest } from "@/lib/auth";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: "polytoria.trade",
  description: "we trade",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await validateRequest();
  
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Provider>
          <ThemeProvider defaultTheme="dark" storageKey="theme">
            <SessionProvider value={session}>
                <Navbar session={session} />
                <main className="w-full max-w-screen-lg mx-auto py-3 px-6">
                  {children}
                </main>
              <Toaster richColors />
            </SessionProvider>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
