import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { SplashScreen } from '@/components/ui';
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import PwaRegistrar from '@/components/PwaRegistrar';

import Sidebar from '@/components/navigation/Sidebar';

export const metadata: Metadata = {
  title: 'MBG Tracker - Sistem Monitoring Makan Bergizi Gratis',
  description:
    'Aplikasi pencatatan dan monitoring kedatangan serta penerimaan Makan Bergizi Gratis (MBG)',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface-canvas antialiased selection:bg-brand-blue selection:text-white transition-colors duration-200">
        <AuthProvider>
          <NotificationProvider>
            <SplashScreen />
            <PwaRegistrar />
            
            <div className="flex min-h-screen">
              {/* Sidebar: Laptop & Desktop only */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-4 pb-28 sm:px-6 lg:px-8 lg:py-6">
                  {children}
                </main>
                <footer className="no-print bg-surface-card border-t border-surface-border py-4 text-center text-xs text-text-secondary transition-colors duration-200 mt-auto">
                  <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2026 Nutri Kampus Hub (MBG Tracker) • Universitas Bina Sarana Informatika.</p>
                    <p className="text-text-secondary/60 font-mono">Waktu Acuan: Asia/Jakarta (WIB)</p>
                  </div>
                </footer>
              </div>
            </div>

            <BottomNavigation />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
