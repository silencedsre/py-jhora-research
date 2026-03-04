import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import BirthDataForm from '@/components/BirthDataForm';
import { BirthDataProvider } from '@/lib/BirthDataContext';

export const metadata: Metadata = {
  title: 'PyJHora — Vedic Astrology',
  description: 'Vedic Astrology computations — Panchanga, Horoscopes, Dhasas, Compatibility, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BirthDataProvider>
          <Navbar />
          <div className="page">
            <BirthDataForm />
            {children}
          </div>
        </BirthDataProvider>
      </body>
    </html>
  );
}
