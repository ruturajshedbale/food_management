import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Smart Food Rescue & Redistribution Intelligence System',
  description: 'Production-grade DBMS and AI intelligence platform connecting surplus food donors, recipients, and volunteer rescue networks with ACID transactions and operational event streams.',
  openGraph: {
    title: 'Smart Food Rescue & Redistribution Intelligence System',
    description: 'Production-grade DBMS and AI intelligence platform connecting surplus food donors, recipients, and volunteer rescue networks with ACID transactions and operational event streams.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Food Rescue & Redistribution Intelligence System',
    description: 'Production-grade DBMS and AI intelligence platform connecting surplus food donors, recipients, and volunteer rescue networks with ACID transactions and operational event streams.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
