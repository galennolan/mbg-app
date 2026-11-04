import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'MBG Tracker - Sistem Monitoring Makan Bergizi Gratis',
  description: 'Aplikasi pencatatan dan monitoring kedatangan serta penerimaan Makan Bergizi Gratis (MBG)',
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
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
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

