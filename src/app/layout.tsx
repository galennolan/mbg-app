import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { SplashScreen } from '@/components/ui';
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import PwaRegistrar from '@/components/PwaRegistrar';

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
      <body className="min-h-screen flex flex-col bg-surface-canvas antialiased selection:bg-brand-blue selection:text-white transition-colors duration-200">
        <AuthProvider>
          <NotificationProvider>
            <SplashScreen />
            <PwaRegistrar />
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
              {children}
            </main>
            <BottomNavigation />
            <footer className="no-print bg-surface-card border-t border-surface-border py-4 text-center text-xs text-text-secondary transition-colors duration-200">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>© 2026 Nutri Kampus Hub (MBG Tracker) • Universitas Bina Sarana Informatika.</p>
                <p className="text-text-secondary/60 font-mono">Waktu Acuan: Asia/Jakarta (WIB)</p>
              </div>
            </footer>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
