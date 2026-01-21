import type { Metadata } from "next";
import "./globals.css";
import DatabaseProvider from "@/components/providers/DatabaseProvider";

export const metadata: Metadata = {
  title: "KAMBA Many - O Amigo do Seu Negócio",
  description: "Sistema completo de Ponto de Venda, Gestão de Stock e Facturação Eletrónica em conformidade com a legislação angolana",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
        </DatabaseProvider>
      </body>
    </html>
  );
}
