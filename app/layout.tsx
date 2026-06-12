import type {Metadata} from 'next';
import { Kantumruy_Pro } from 'next/font/google';
import './globals.css'; // Global styles

const kantumruyPro = Kantumruy_Pro({
  subsets: ['khmer', 'latin'],
  variable: '--font-kantumruy-pro',
});

export const metadata: Metadata = {
  title: 'SecureAttend - Attendance System',
  description: 'Multi-tenant employee attendance and HR/payroll system.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="km">
      <body className={`${kantumruyPro.variable} font-sans antialiased text-slate-900`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
