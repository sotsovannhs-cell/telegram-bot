import type {Metadata} from 'next';
import { Kantumruy_Pro } from 'next/font/google';
import './globals.css'; // Global styles

const mainFont = Kantumruy_Pro({
  subsets: ['khmer', 'latin'],
  variable: '--font-main',
});

export const metadata: Metadata = {
  title: 'SecureAttend',
  description: 'Multi-tenant employee attendance and HR/payroll system.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="km">
      <body className={`${mainFont.variable} font-sans antialiased text-slate-900`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
