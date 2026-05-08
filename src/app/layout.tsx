import type { Metadata } from 'next';
import { Lilita_One } from 'next/font/google';
import './globals.css';

const lilitaOne = Lilita_One({
  weight: '400',
  variable: '--font-lilita',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Beat the Boss 3D',
  description: 'Stress relief 3D game - throw objects at the boss!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={lilitaOne.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          App Router supports stylesheet <link> tags directly in <head>. The
          @next/next/no-page-custom-font rule is a Pages Router lint that
          predates this. We need this <link> here because next/font cannot
          provide Korean glyphs for `Jua` / `Black Han Sans` (no `korean`
          subset), and these fonts are used app-wide via --font-display.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Jua&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
