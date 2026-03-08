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
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BirthDataProvider>
          <Navbar />
          <div className="page" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ flex: 1 }}>
              <BirthDataForm />
              {children}
            </div>
            <footer style={{
              marginTop: '4rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}>
              <span>
                Powered by <a href="https://github.com/naturalstupid/PyJHora" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>PyJHora</a> <span style={{ opacity: 0.7 }}>(AGPL)</span>
              </span>
              <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
              <span>
                Provided for Research by <a href="https://rtayoga.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>www.rtayoga.com</a>
              </span>
            </footer>
          </div>
        </BirthDataProvider>
      </body>
    </html>
  );
}
