import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import PwaRegistrar from '@/components/PwaRegistrar';

export const metadata: Metadata = {
  title: 'MBG Tracker - Sistem Monitoring Makan Bergizi Gratis',
  description: 'Aplikasi pencatatan dan monitoring kedatangan serta penerimaan Makan Bergizi Gratis (MBG)',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-slate-50 antialiased selection:bg-brand-blue selection:text-white">
        <AuthProvider>
          <PwaRegistrar />
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
            {children}
          </main>
          <BottomNavigation />
          <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 MBG Tracker. Sistem Monitoring Distribusi Makan Bergizi Gratis.</p>
              <p className="text-slate-400">Waktu Acuan: Asia/Jakarta (WIB)</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
