import type { Metadata } from "next";
import "./globals.css";
import "../styles/living-glass.css";

export const metadata: Metadata = {
  title: "BountySwarm",
  description: "AI-powered bug bounty hunting swarm with transparent prize distribution",
};

import { OrganizerProvider } from "@/context/OrganizerContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <OrganizerProvider>{children}</OrganizerProvider>
      </body>
    </html>
  );
}
