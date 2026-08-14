import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";



export const metadata: Metadata = {
  title: "BALAJO",
  description: "Balajo helps your savings group manage contributions, payouts, and records digitally and transparently",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/" >
      <html lang="en">
        <body
          >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
