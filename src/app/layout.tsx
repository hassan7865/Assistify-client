import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { fontVariables } from "@/lib/font";
import { AuthProvider } from "@/contexts/auth-context";
import { GlobalChatProvider } from "@/contexts/global-chat-context";
import GlobalChatComponents from "@/components/global-chat-components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hailouchat",
  description: "Hailouchat Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "bg-background font-sans antialiased",
          fontVariables
        )}
      >
        <AuthProvider>
          <GlobalChatProvider>
            {children}
            <GlobalChatComponents />
          </GlobalChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
