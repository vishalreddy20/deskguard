import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DeskGuardProvider } from '@/context/DeskGuardContext';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DeskGuard — Library Seat Booking & Anti-Hoarding System',
  description:
    'Find your seat. Keep it fair. DeskGuard helps students book library desks and prevents seat hoarding with real-time presence verification.',
  keywords: ['library', 'seat booking', 'desk', 'student', 'anti-hoarding'],
  openGraph: {
    title: 'DeskGuard',
    description: 'Find your seat. Keep it fair.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#f8fafc] text-slate-800 antialiased min-h-screen">
        <DeskGuardProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'var(--font-inter)',
              },
            }}
          />
        </DeskGuardProvider>
      </body>
    </html>
  );
}
