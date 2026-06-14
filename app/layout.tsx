import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SEVAK — Transparent Governance Platform',
  description:
    'Report civic issues, track them in real time, and see exactly what your Nagar Sevak is doing about it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} pb-16 font-sans antialiased sm:pb-0`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
