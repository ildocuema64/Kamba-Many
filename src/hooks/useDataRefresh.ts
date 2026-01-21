import { useState, useEffect } from 'react';
import db from '@/lib/db/sqlite';

/**
 * Hook to subscribe to database changes.
 * Returns a refresh key that increments whenever the database changes.
 * Use this in the dependency array of useEffects that fetch data.
 */
export function useDataRefresh() {
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const unsubscribe = db.subscribe(() => {
            setRefreshKey(prev => prev + 1);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return refreshKey;
}
