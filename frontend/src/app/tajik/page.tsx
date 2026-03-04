'use client';
import { TajikView } from '@/components/TajikView';
import { useBirthData } from '@/lib/BirthDataContext';

export default function TajikPage() {
    const { birthData, isSet } = useBirthData();

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">वर्षफल Varshaphala</h1>
                <p className="page-subtitle">Tajik Solar Return Analysis — Annual Charts & Sahams</p>
            </div>

            <TajikView birthData={birthData!} isSet={isSet} />
        </>
    );
}
