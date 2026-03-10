'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { searchCities, type BirthData } from '@/lib/api';

interface City {
    name: string;
    country_code: string;
    latitude: number;
    longitude: number;
    timezone: string;
    timezone_offset: number;
}

interface MiniFormProps {
    label: string;
    onSubmit: (data: BirthData) => void;
    loading?: boolean;
    buttonLabel?: string;
}

export function MiniForm({ label, onSubmit, loading, buttonLabel = 'Submit' }: MiniFormProps) {
    const [place, setPlace] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [cities, setCities] = useState<City[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isCustomLoc, setIsCustomLoc] = useState(false);
    const [customLat, setCustomLat] = useState<string>('');
    const [customLon, setCustomLon] = useState<string>('');
    const [customTz, setCustomTz] = useState<string>('');
    const dropRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const handlePlaceChange = useCallback((val: string) => {
        setPlace(val);
        setSelectedCity(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.length >= 2) {
            debounceRef.current = setTimeout(async () => {
                try {
                    const res = await searchCities(val);
                    setCities(res.cities);
                    setShowDropdown(true);
                } catch (_e) { setCities([]); }
            }, 300);
        } else {
            setCities([]);
            setShowDropdown(false);
        }
    }, []);

    const handleCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const offset = -new Date().getTimezoneOffset() / 60;
                const locCity: City = {
                    name: "Current Location",
                    country_code: "Local",
                    latitude,
                    longitude,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    timezone_offset: offset
                };
                selectCity(locCity);
                setIsLocating(false);
            },
            (err) => {
                console.error("Geolocation Error:", err);
                let errorMessage = "Could not get current location.";
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable. This may happen on local networks without HTTPS or GPS access.";
                        break;
                    case err.TIMEOUT:
                        errorMessage = "The location request timed out. Please try again or enter custom coordinates.";
                        break;
                }
                alert(errorMessage);
                setIsLocating(false);
            },
            { timeout: 10000 }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectCity = (city: City) => {
        setPlace(`${city.name}, ${city.country_code}`);
        setSelectedCity(city);
        setShowDropdown(false);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: BirthData = { date, time };

        if (isCustomLoc) {
            data.place = place || 'Custom Location';
            data.latitude = parseFloat(customLat);
            data.longitude = parseFloat(customLon);
            data.timezone_offset = parseFloat(customTz);
            if (isNaN(data.latitude) || isNaN(data.longitude) || isNaN(data.timezone_offset)) {
                alert("Please enter valid numbers for Latitude, Longitude, and Timezone.");
                return;
            }
        } else if (selectedCity) {
            data.place = `${selectedCity.name},${selectedCity.country_code}`;
            data.latitude = selectedCity.latitude;
            data.longitude = selectedCity.longitude;
            data.timezone_offset = selectedCity.timezone_offset;
        } else {
            data.place = place;
        }
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-title">{label}</div>
            <div className="form-row">
                <div className="form-group" ref={dropRef}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>Place</span>
                        <span
                            style={{ cursor: 'pointer', color: 'var(--accent-violet)', fontSize: '0.85rem', textTransform: 'none', whiteSpace: 'nowrap', padding: '0.5rem', margin: '-0.5rem' }}
                            onClick={() => setIsCustomLoc(!isCustomLoc)}
                        >
                            {isCustomLoc ? 'Use Search' : 'Enter Custom'}
                        </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="form-input"
                            style={!isCustomLoc ? { paddingRight: '2.5rem' } : undefined}
                            placeholder={isCustomLoc ? "City Name (Optional)" : "Search city..."}
                            value={place}
                            onChange={e => handlePlaceChange(e.target.value)}
                            required={!isCustomLoc}
                        />
                        {!isCustomLoc && (
                            <>
                                <button
                                    type="button"
                                    className="location-btn"
                                    onClick={handleCurrentLocation}
                                    disabled={isLocating}
                                    title="Use Current Location"
                                >
                                    {isLocating ? '⏳' : '📍'}
                                </button>
                                {showDropdown && cities.length > 0 && (
                                    <div className="city-dropdown">
                                        {cities.map((c, i) => (
                                            <div key={i} className="city-option" onClick={() => selectCity(c)}>
                                                <span>{c.name}</span>
                                                <span className="cc">{c.country_code} • {c.timezone_offset >= 0 ? '+' : ''}{c.timezone_offset}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {selectedCity && !isCustomLoc && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', marginLeft: '0.2rem' }}>
                            {selectedCity.latitude.toFixed(4)}°, {selectedCity.longitude.toFixed(4)}° • TZ: {selectedCity.timezone_offset >= 0 ? '+' : ''}{selectedCity.timezone_offset}h
                        </div>
                    )}
                </div>
                {isCustomLoc && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Latitude</label>
                            <input className="form-input" type="number" step="any" placeholder="e.g. 27.7172" value={customLat} onChange={e => setCustomLat(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Longitude</label>
                            <input className="form-input" type="number" step="any" placeholder="e.g. 85.3240" value={customLon} onChange={e => setCustomLon(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timezone (hrs)</label>
                            <input className="form-input" type="number" step="any" placeholder="e.g. 5.75" value={customTz} onChange={e => setCustomTz(e.target.value)} required />
                        </div>
                    </>
                )}
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Time</label>
                    <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || !date}>{loading ? 'Computing...' : buttonLabel}</button>
        </form>
    );
}
