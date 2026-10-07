import { apiClient } from './client';

export type PlaceType = 'repair_shop' | 'gas_station';

export type NearbyPlace = {
  id: string;
  name: string;
  type: PlaceType;
  description: string | null;
  phone: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
  is_verified: boolean;
};

export type NearbyPlacesResponse = {
  items: NearbyPlace[];
  center: {
    latitude: number;
    longitude: number;
  };
  radius_meters: number;
};

export const placesApi = {
  getNearbyPlaces: async (
    latitude: number,
    longitude: number,
    radius = 3000,
    type?: PlaceType,
  ): Promise<NearbyPlacesResponse> => {
    const params = [
      `latitude=${encodeURIComponent(latitude)}`,
      `longitude=${encodeURIComponent(longitude)}`,
      `radius=${encodeURIComponent(radius)}`,
    ];
    if (type) {
      params.push(`type=${encodeURIComponent(type)}`);
    }

    return apiClient.get(`/places/nearby?${params.join('&')}`);
  },

  getPlaceDetails: async (id: string) => {
    return apiClient.get(`/places/${id}`);
  },
};
