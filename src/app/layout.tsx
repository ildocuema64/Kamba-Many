import type { Metadata, Viewport } from "next";
import "./globals.css";
import DatabaseProvider from "@/components/providers/DatabaseProvider";
import InstallPrompt from "@/components/pwa/InstallPrompt";

export const metadata: Metadata = {
  title: "KAMBA Many - O Amigo do Seu Negócio",
  description: "Sistema completo de Ponto de Venda, Gestão de Stock e Facturação Eletrónica em conformidade com a legislação angolana",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Optimizes for app-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO" suppressHydrationWarning>
      <body className="antialiased">
        <DatabaseProvider>
          {children}
          <InstallPrompt />
        </DatabaseProvider>
      </body>
    </html>
  );
}
