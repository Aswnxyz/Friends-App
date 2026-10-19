import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Friends App — Audio/Video Connect, Celebrity Calls & Nearby Events',
  description:
    'Connect with random friends via live Audio & Video calls, call verified Celebrities (Premium), discover location-based Events, and access 24/7 Customer Care Support.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ml">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
