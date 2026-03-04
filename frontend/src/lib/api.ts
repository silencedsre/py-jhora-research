const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'API error');
    }
    return res.json();
}

export interface BirthData {
    name?: string;
    place?: string;
    latitude?: number;
    longitude?: number;
    timezone_offset?: number;
    date: string;
    time?: string;
    language?: string;
    ayanamsa?: string;
    true_nodes?: boolean;
    sunrise_disc_center?: boolean;
    sunrise_refraction?: boolean;
}

// Info
export const getAyanamsas = () => request<{ ayanamsas: string[] }>('/api/info/ayanamsas');
export const getNakshatras = () => request<{ nakshatras: { index: number; name: string }[] }>('/api/info/nakshatras');
export const getRaasis = () => request<{ raasis: { index: number; name: string }[] }>('/api/info/raasis');
export const searchCities = (q: string) =>
    request<{ count: number | string; cities: { name: string; country_code: string; latitude: number; longitude: number; timezone: string; timezone_offset: number }[] }>(
        `/api/info/cities?q=${encodeURIComponent(q)}`
    );
export const getDhasaSystems = () =>
    request<{ graha_dhasas: string[]; raasi_dhasas: string[]; annual_dhasas: string[] }>('/api/dhasa/systems');

// Panchanga
export const getPanchanga = (data: BirthData) =>
    request<Record<string, unknown>>('/api/panchanga', { method: 'POST', body: JSON.stringify(data) });

// Horoscope
export const getHoroscope = (data: BirthData) =>
    request<Record<string, unknown>>('/api/horoscope', { method: 'POST', body: JSON.stringify(data) });
export const getPlanets = (data: BirthData) =>
    request<Record<string, unknown>>('/api/horoscope/planets', { method: 'POST', body: JSON.stringify(data) });
export const getDivisionalChart = (data: { birth_data: BirthData; chart_type: number; chart_method?: number }) =>
    request<Record<string, unknown>>('/api/horoscope/chart', { method: 'POST', body: JSON.stringify(data) });

// Dhasa
export const getDhasa = (system: string, data: { birth_data: BirthData; system: string; divisional_chart_factor?: number; depth?: number }) =>
    request<Record<string, unknown>>(`/api/dhasa/${system}`, { method: 'POST', body: JSON.stringify(data) });

// Charts
export const getYogas = (data: BirthData) =>
    request<Record<string, unknown>>('/api/charts/yoga', { method: 'POST', body: JSON.stringify(data) });
export const getDoshas = (data: BirthData) =>
    request<Record<string, unknown>>('/api/charts/dosha', { method: 'POST', body: JSON.stringify(data) });
export const getStrength = (data: BirthData) =>
    request<Record<string, unknown>>('/api/charts/strength', { method: 'POST', body: JSON.stringify(data) });
export const getAshtakavarga = (data: BirthData) =>
    request<Record<string, unknown>>('/api/charts/ashtakavarga', { method: 'POST', body: JSON.stringify(data) });

// Match
export const getMatch = (data: { boy_nakshatra: number; boy_paadha: number; girl_nakshatra: number; girl_paadha: number; method?: string }) =>
    request<Record<string, unknown>>('/api/match', { method: 'POST', body: JSON.stringify(data) });
export const getMatchFromBirth = (data: { boy: BirthData; girl: BirthData; method?: string }) =>
    request<Record<string, unknown>>('/api/match/birth', { method: 'POST', body: JSON.stringify(data) });

// Eclipse
export const getEclipse = (data: BirthData) =>
    request<Record<string, unknown>>('/api/eclipse', { method: 'POST', body: JSON.stringify(data) });

// Transit / Tajaka
export const getTajaka = (data: { birth_data: BirthData; years: number }) =>
    request<Record<string, unknown>>('/api/transit/tajaka', { method: 'POST', body: JSON.stringify(data) });
export const getSahams = (data: BirthData) =>
    request<Record<string, unknown>>('/api/transit/saham', { method: 'POST', body: JSON.stringify(data) });
