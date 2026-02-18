import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'MusicSheet',
  description: 'Sheet music library',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
