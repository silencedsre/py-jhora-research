'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useState, useEffect } from 'react';

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

    return (
        <>
            <nav className="navbar">
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
