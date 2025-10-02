import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow - Cross-Team Task Management",
  description: "Simple, intuitive task management tool for seamless cross-team collaboration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
      return (
        <ClerkProvider>
          <html lang="en">
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
              {children}
              <Toaster 
                position="bottom-left" 
                toastOptions={{
                  style: {
                    background: 'white',
                    color: 'black',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  },
                  className: 'toast-white',
                }}
              />
            </body>
          </html>
        </ClerkProvider>
      );
}
