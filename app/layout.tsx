import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/lib/ChatContext";
import ChatSidebar from "@/components/ChatSidebar";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MATLAB-GOD",
  description: "ECH 3854 Engineering Computations Trainer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mono.variable} antialiased`}>
        <ChatProvider>
          {children}
          <ChatSidebar />
        </ChatProvider>
      </body>
    </html>
  );
}
