import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Maxxi Internet — Gestão de Frota",
  description:
    "Sistema de gestão de frota e combustíveis da Maxxi Internet. Controle veículos, abastecimentos, manutenções e equipe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text-primary">
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
