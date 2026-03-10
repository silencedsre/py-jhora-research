'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUsage } from '@/lib/api';

const links = [
    { href: '/', label: 'Panchāṅga' },
    { href: '/horoscope', label: 'Horoscope' },
    { href: '/dhasa', label: 'Dhasa' },
    { href: '/match', label: 'Match' },
    { href: '/charts', label: 'Charts' },
    { href: '/tajik', label: 'Varshaphala' },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [usage, setUsage] = useState<{ requests_today: number; daily_limit: number } | null>(null);

    // Close menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    // Fetch usage counter, refresh every 30s
    useEffect(() => {
        getUsage().then(setUsage).catch(() => { });
        const interval = setInterval(() => {
            getUsage().then(setUsage).catch(() => { });
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    const usagePct = usage ? usage.requests_today / usage.daily_limit : 0;
    const usageColor = usagePct >= 0.9
        ? 'var(--accent-red, #e05c5c)'
        : usagePct >= 0.7
            ? '#d4a017'
            : 'var(--text-muted)';

    return (
        <>
            <nav className="navbar" style={{ position: 'relative' }}>
                <div className="navbar-inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            ☰
                        </button>
                        <Link href="/" className="navbar-brand">ज्योतिष PyJHora-Research</Link>
                    </div>
                    <ul className="navbar-links">
                        {links.map(l => (
                            <li key={l.href}>
                                <Link href={l.href} className={pathname === l.href ? 'active' : ''}>
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* API usage badge — absolutely positioned, doesn't affect nav links */}
                {usage && (
                    <div
                        title={`${usage.requests_today} of ${usage.daily_limit} API requests used today (resets midnight UTC)`}
                        style={{
                            position: 'absolute', right: '1.5rem', top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontSize: '0.68rem', color: usageColor, opacity: 0.7,
                            whiteSpace: 'nowrap', cursor: 'default',
                        }}
                    >
                        <span style={{
                            width: '5px', height: '5px', borderRadius: '50%',
                            background: usageColor, display: 'inline-block', flexShrink: 0,
                        }} />
                        {usage.requests_today}/{usage.daily_limit}
                    </div>
                )}
            </nav>

            {/* Mobile Sidebar Overlay */}
            <div
                className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-sidebar-header">
                    <span className="navbar-brand" style={{ fontSize: '1.2rem' }}>Menu</span>
                    <button
                        className="mobile-menu-btn"
                        style={{ display: 'block' }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>
                <ul className="mobile-nav-links">
                    {links.map(l => (
                        <li key={l.href}>
                            <Link href={l.href} className={pathname === l.href ? 'active' : ''}>
                                {l.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
