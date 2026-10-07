import { useEffect, useRef, useState } from 'react';
import type { LocationObject } from 'expo-location';

import { calculateDistanceKm } from '@/lib/location/locationService';
import { placesApi, type NearbyPlace } from '@/services/api/places';

const SEARCH_RADIUS_METERS = 3000;
const REFRESH_DISTANCE_METERS = 100;
const MAX_REFRESH_INTERVAL_MS = 30_000;
const DEBOUNCE_MS = 600;

type RequestedCenter = {
  latitude: number;
  longitude: number;
  requestedAt: number;
};

export function useNearbyPlaces(location: LocationObject | null) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestedCenter = useRef<RequestedCenter | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!location) {
      return;
    }

    const { latitude, longitude } = location.coords;
    const previous = lastRequestedCenter.current;
    const now = Date.now();
    const movedMeters = previous
      ? calculateDistanceKm(previous.latitude, previous.longitude, latitude, longitude) * 1000
      : Number.POSITIVE_INFINITY;

    if (
      previous &&
      movedMeters < REFRESH_DISTANCE_METERS &&
      now - previous.requestedAt < MAX_REFRESH_INTERVAL_MS
    ) {
      return;
    }

    const sequence = ++requestSequence.current;
    const timeout = setTimeout(() => {
      lastRequestedCenter.current = { latitude, longitude, requestedAt: Date.now() };
      setIsLoading(true);
      setError(null);

      placesApi
        .getNearbyPlaces(latitude, longitude, SEARCH_RADIUS_METERS)
        .then((response) => {
          if (sequence === requestSequence.current) {
            setPlaces(response.items);
          }
        })
        .catch((requestError: unknown) => {
          if (sequence === requestSequence.current) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : 'Unable to load nearby places.',
            );
          }
        })
        .finally(() => {
          if (sequence === requestSequence.current) {
            setIsLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [location]);

  return { places, isLoading, error };
}
