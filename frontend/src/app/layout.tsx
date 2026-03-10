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
              marginTop: '2rem',
              padding: '1.2rem 1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              <div>
                Powered by <a href="https://github.com/naturalstupid/PyJHora" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>PyJHora</a> <span style={{ opacity: 0.7 }}>(AGPL)</span>
              </div>
              <div style={{ lineHeight: 1.4 }}>
                Maintained by <a href="https://github.com/silencedsre/py-jhora-research" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>py-jhora-research</a> & <a href="https://rtayoga.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>www.rtayoga.com</a>
              </div>
            </footer>
          </div>
        </BirthDataProvider>
      </body>
    </html>
  );
}
