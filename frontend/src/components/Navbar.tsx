'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">ज्योतिष PyJHora</Link>
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
    );
}
