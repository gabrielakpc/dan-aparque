import type { Metadata } from "next";
import "./globals.css";

/**
 * As fontes são carregadas por <link>, não por next/font/google.
 * next/font baixa os arquivos de fonte durante o BUILD — se o servidor que
 * fizer o build não tiver saída livre para fonts.googleapis.com (proxies
 * corporativos, alguns ambientes de CI), o build inteiro falha. Um <link>
 * comum carrega no navegador de quem visita o site, não durante o build,
 * então funciona em qualquer lugar.
 */
export const metadata: Metadata = {
  title: "Dança Parque — Gestão de alunos e mensalidades",
  description: "Alunos, mensalidades, cobranças e WhatsApp em um lugar só.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,500;0,600;1,500;1,600&family=Montserrat:wght@500;600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">{children}</body>
    </html>
  );
}
