import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Group CMS - Multi-Company Website Manager',
  description: 'Drag-and-drop CMS for managing group company websites',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
