// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'; // Import Navbar
import Footer from '@/components/Footer'; // Import Footer

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ScamShield AI',
  description: 'Proactive SMS, URL, and Phone Scam Defense for India',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950`}> {/* Moved bg color here */}
        {/* Use Flexbox to structure the page */}
        <div className="flex flex-col min-h-screen">
          <Navbar /> {/* Add the Navbar */}
          {/* Main content area takes remaining space */}
          <main className="flex-grow">
            {children} {/* Your page content goes here */}
          </main>
          <Footer /> {/* Add the Footer */}
        </div>
      </body>
    </html>
  );
}