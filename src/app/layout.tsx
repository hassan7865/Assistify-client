import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { fontVariables } from "@/lib/font";
import { AuthProvider } from "@/contexts/auth-context";

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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
