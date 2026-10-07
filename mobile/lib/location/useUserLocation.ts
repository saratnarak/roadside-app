import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import {
  getCurrentUserLocation,
  type PermissionState,
  requestForegroundLocationPermission,
  watchUserLocation,
} from './locationService';

export function useUserLocation() {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stopWatching = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  };

  const startWatching = async () => {
    stopWatching();
    try {
      const subscription = await watchUserLocation((nextLocation) => {
        setLocation(nextLocation);
        setError(null);
      });
      subscriptionRef.current = subscription;
    } catch (watchErr) {
      console.warn('Watch location error:', watchErr);
    }
  };

  const refreshLocation = async (): Promise<Location.LocationObject | null> => {
    setIsLoading(true);
    try {
      const current = await getCurrentUserLocation();
      setLocation(current);
      setError(null);
      return current;
    } catch (fetchError) {
      console.warn('Failed to refresh location:', fetchError);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationAccess = async (): Promise<Location.PermissionStatus> => {
    setError(null);
    setPermissionState('requesting');
    setIsLoading(true);

    try {
      const result = await requestForegroundLocationPermission();

      if (result === 'granted') {
        setPermissionState('granted');
        const current = await getCurrentUserLocation();
        setLocation(current);
        await startWatching();
      } else {
        setPermissionState('denied');
      }
      return result;
    } catch (requestError) {
      setPermissionState('denied');
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to determine your location.',
      );
      return Location.PermissionStatus.DENIED;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let currentPermission = await Location.getForegroundPermissionsAsync();

        if (currentPermission.status === 'undetermined') {
          setPermissionState('requesting');
          currentPermission = await Location.requestForegroundPermissionsAsync();
        }

        if (currentPermission.status === 'granted') {
          setPermissionState('granted');
          const current = await getCurrentUserLocation();
          if (!isCancelled) {
            setLocation(current);
          }
          const subscription = await watchUserLocation((nextLocation) => {
            if (!isCancelled) {
              setLocation(nextLocation);
              setError(null);
            }
          });
          if (!isCancelled) {
            subscriptionRef.current = subscription;
          } else {
            subscription.remove();
          }
        } else if (currentPermission.status === 'denied') {
          setPermissionState('denied');
        } else {
          setPermissionState('unknown');
        }
      } catch (locationError) {
        if (!isCancelled) {
          setPermissionState('denied');
          setError(
            locationError instanceof Error
              ? locationError.message
              : 'Unable to determine your location.',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isCancelled = true;
      stopWatching();
    };
  }, []);

  return {
    permissionState,
    location,
    error,
    isLoading,
    refreshLocation,
    requestLocationAccess,
  };
}
