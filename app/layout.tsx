import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prozeduraler Dungeon Generator',
  description: 'Educational dungeon crawler with quiz-based combat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
