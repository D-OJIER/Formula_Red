import { useState, useEffect } from 'react';
import type { PlayerProfile } from '../../shared/types';
import type { GetPlayerProfileResponse } from '../../shared/api';

export const usePlayerProfile = (userId?: string) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/profile?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch player profile');
        }
        const data: GetPlayerProfileResponse = await response.json();
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};
