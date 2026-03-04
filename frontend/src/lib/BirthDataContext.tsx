'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { BirthData } from '@/lib/api';

interface BirthDataContextType {
    birthData: BirthData | null;
    setBirthData: (data: BirthData) => void;
    isSet: boolean;
}

const BirthDataContext = createContext<BirthDataContextType>({
    birthData: null,
    setBirthData: () => { },
    isSet: false,
});

export function BirthDataProvider({ children }: { children: ReactNode }) {
    const [birthData, _setBirthData] = useState<BirthData | null>(null);
    const setBirthData = useCallback((data: BirthData) => _setBirthData(data), []);
    return (
        <BirthDataContext.Provider value={{ birthData, setBirthData, isSet: !!birthData }}>
            {children}
        </BirthDataContext.Provider>
    );
}

export function useBirthData() {
    return useContext(BirthDataContext);
}
