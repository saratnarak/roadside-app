import * as Location from 'expo-location';

export type PermissionState = 'unknown' | 'requesting' | 'granted' | 'denied';

export async function requestForegroundLocationPermission(): Promise<Location.PermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

export async function getCurrentUserLocation(): Promise<Location.LocationObject> {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
}

export async function watchUserLocation(
  onUpdate: (location: Location.LocationObject) => void,
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 2000,
      distanceInterval: 5,
    },
    onUpdate,
  );
}

export function formatAccuracyLabel(accuracy?: number): string {
  if (typeof accuracy !== 'number' || Number.isNaN(accuracy)) {
    return 'GPS unavailable';
  }

  const rounded = Math.max(1, Math.round(accuracy));
  return `±${rounded}m`;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
