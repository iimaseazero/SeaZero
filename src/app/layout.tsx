import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import LayoutShell from "@/components/layout/LayoutShell";
import ThemeProvider from "@/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "Sea Zero — Coastal Route Electrification Simulator",
  description: "Digital twin of coastal ferry routes. Simulate an all-electric battery vessel and explore feasibility, economics, and emissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Pass admin email so the client AuthProvider can determine admin status
  const adminEmail = process.env.ADMIN_EMAIL ?? '';

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <ThemeProvider>
          <AuthProvider adminEmail={adminEmail}>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

