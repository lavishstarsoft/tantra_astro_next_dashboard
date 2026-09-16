import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Toaster } from 'react-hot-toast';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Thantra LMS — Admin',
  description: 'Course, video, and commerce management for the mobile learning app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans`}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
