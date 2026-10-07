import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { useNearbyPlaces } from '@/features/places/useNearbyPlaces';
import { formatAccuracyLabel } from '@/lib/location/locationService';
import { useUserLocation } from '@/lib/location/useUserLocation';
import type { NearbyPlace } from '@/services/api/places';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.80;

const filterOptions = [
  { key: 'all', label: 'All Nearby', icon: 'grid-outline' },
  { key: 'repair_shop', label: 'Mechanics', icon: 'construct-outline' },
  { key: 'gas_station', label: 'Fuel Stations', icon: 'business-outline' },
] as const;

const fallbackRegion: Region = {
  latitude: 11.5564,
  longitude: 104.9282,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function DiscoveryScreen() {
  const { permissionState, location, error, isLoading, refreshLocation, requestLocationAccess } = useUserLocation();
  const mapRef = useRef<MapView | null>(null);
  const carouselRef = useRef<ScrollView | null>(null);
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]['key']>('all');
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [region, setRegion] = useState<Region>(fallbackRegion);

  const {
    places,
    isLoading: placesLoading,
    error: placesError,
  } = useNearbyPlaces(location);

  const visibleMechanics = useMemo(() => {
    if (activeFilter === 'all') {
      return places;
    }
    return places.filter((place) => place.type === activeFilter);
  }, [activeFilter, places]);

  useEffect(() => {
    if (!location) {
      return;
    }

    const nextRegion: Region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };

    setRegion(nextRegion);

    if (isFollowing) {
      mapRef.current?.animateToRegion(nextRegion, 500);
    }
  }, [location, isFollowing]);

  const handleSelectPlace = (place: NearbyPlace, index?: number) => {
    setSelectedMechanicId(place.id);
    setIsFollowing(false);

    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude - 0.0025, // offset camera so bottom card doesn't obscure pin
        longitude: place.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      400
    );

    if (typeof index === 'number' && carouselRef.current) {
      carouselRef.current.scrollTo({
        x: index * (CARD_WIDTH + 14),
        animated: true,
      });
    }
  };

  const handleRecenter = async () => {
    setIsFollowing(true);
    setIsLocating(true);

    try {
      if (permissionState !== 'granted') {
        const status = await requestLocationAccess();
        if (status === 'denied') {
          Alert.alert(
            'Location Access Required',
            'MotoRescue needs location access to pinpoint your current location on the map.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      const freshLoc = await refreshLocation();
      const currentCoords = freshLoc?.coords || location?.coords;

      if (currentCoords) {
        const nextRegion: Region = {
          latitude: currentCoords.latitude,
          longitude: currentCoords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        };
        setRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 600);
      } else {
        Alert.alert(
          'Location Signal',
          'Waiting for GPS signal. On iOS Simulator, go to Features > Location to choose a location.'
        );
      }
    } catch (err) {
      console.warn('Recenter location error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleNavigate = (place: NearbyPlace) => {
    const lat = place.latitude;
    const lng = place.longitude;
    const label = encodeURIComponent(place.name);

    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    Linking.openURL(scheme).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const handleCall = (place: NearbyPlace) => {
    if (place.phone) {
      Linking.openURL(`tel:${place.phone}`).catch(() => {
        Alert.alert('Phone Call', `Unable to call: ${place.phone}`);
      });
      return;
    }

    Alert.alert(
      'No Phone Number',
      `No direct phone number is registered for ${place.name}.`
    );
  };

  const handleEmergencyPress = () => {
    Alert.alert(
      'Emergency Roadside Support',
      'Need urgent towing, medical, or police assistance in Phnom Penh?\n\nPolice: 117\nAmbulance: 119\nTraffic Police: 012 999 999',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 117 (Police)', onPress: () => Linking.openURL('tel:117') },
        { text: 'Call 119 (Medical)', onPress: () => Linking.openURL('tel:119') },
      ]
    );
  };

  const statusLabel =
    !location || isLoading
      ? 'Locating...'
      : typeof location.coords.accuracy === 'number' && location.coords.accuracy > 50
        ? 'GPS Weak'
        : 'GPS Live';

  const statusDetail =
    !location || isLoading
      ? 'Searching signal'
      : `${formatAccuracyLabel(location.coords.accuracy ?? undefined)} accurate`;

  return (
    <View style={styles.container}>
      {/* Light Mode Status Bar */}
      <StatusBar style="dark" />

      {/* FULL-SCREEN MAP IN LIGHT MODE */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFillObject}
        region={region}
        onRegionChangeComplete={(nextRegion) => setRegion(nextRegion)}
        onPanDrag={() => setIsFollowing(false)}
        showsCompass={false}
        showsScale={false}
        showsMyLocationButton={false}
        showsUserLocation={true}
      >
        {/* User Location Radar Marker */}
        {location ? (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            tracksViewChanges={false}
            title="My Current Location"
          >
            <View style={styles.userMarkerHalo}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        ) : null}

        {/* Nearby Places Markers (Light Mode Glass Pins) */}
        {visibleMechanics.map((place, idx) => {
          const selected = selectedMechanicId === place.id;
          const isGas = place.type === 'gas_station';
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={`${formatDistance(place.distance_meters)} away`}
              tracksViewChanges={false}
              onPress={() => handleSelectPlace(place, idx)}
            >
              <View
                style={[
                  styles.mapPinContainer,
                  selected && styles.mapPinContainerSelected,
                  isGas ? styles.gasPinBorder : styles.mechanicPinBorder,
                ]}
              >
                <Ionicons
                  name={isGas ? 'business' : 'construct'}
                  size={15}
                  color={isGas ? '#D97706' : '#2563EB'}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* FLOATING TOP OVERLAY: GLASSMORPHISM LIGHT HEADER & FILTERS */}
      <SafeAreaView style={styles.topSafeArea} pointerEvents="box-none">
        <View style={styles.headerRow}>
          {/* Menu Button */}
          <Pressable style={styles.glassButtonRound} accessibilityLabel="Open menu">
            <Ionicons name="menu-outline" size={22} color="#0F172A" />
          </Pressable>

          {/* Brand Pill with Icon */}
          <View style={styles.brandGlassPill}>
            <View style={styles.brandIconWrap}>
              <Ionicons name="shield-checkmark" size={16} color="#2563EB" />
            </View>
            <Text style={styles.brandTitle}>MotoRescue</Text>
          </View>

          {/* Settings Button */}
          <Pressable style={styles.glassButtonRound} accessibilityLabel="Open settings">
            <Ionicons name="settings-outline" size={20} color="#0F172A" />
          </Pressable>
        </View>

        {/* Glassmorphism Floating Search Bar */}
        <View style={styles.searchBarGlass}>
          <Ionicons name="search" size={18} color="#2563EB" />
          <Text style={styles.searchText} numberOfLines={1}>
            Search mechanic or sangkat in Phnom Penh
          </Text>
        </View>

        {/* Glassmorphism Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipRow}
        >
          {filterOptions.map((filterOption) => {
            const isActive = activeFilter === filterOption.key;
            return (
              <Pressable
                key={filterOption.key}
                onPress={() => setActiveFilter(filterOption.key)}
                style={[styles.glassChip, isActive && styles.glassChipActive]}
              >
                <Ionicons
                  name={filterOption.icon}
                  size={13}
                  color={isActive ? '#FFFFFF' : '#475569'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.glassChipText,
                    isActive ? styles.glassChipTextActive : styles.glassChipTextInactive,
                  ]}
                >
                  {filterOption.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* FLOATING ACTION BUTTONS DIRECTLY ON THE MAP */}
      <View style={styles.mapActionsOverlay} pointerEvents="box-none">
        {/* Left Side: Frosted GPS Live Badge */}
        <View style={styles.gpsGlassBadge}>
          <View style={[styles.statusDot, location && styles.statusDotActive]} />
          <View>
            <Text style={styles.gpsBadgeTitle}>{statusLabel}</Text>
            <Text style={styles.gpsBadgeDetail}>{statusDetail}</Text>
          </View>
        </View>

        {/* Right Side Stack: Recenter + SOS Buttons */}
        <View style={styles.rightActionStack}>
          {/* Recenter Location Button */}
          <Pressable
            style={[styles.glassFabButton, isFollowing && styles.glassFabActive]}
            onPress={handleRecenter}
            accessibilityLabel="Recenter location"
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Ionicons
                name={isFollowing ? 'locate' : 'locate-outline'}
                size={22}
                color={isFollowing ? '#10B981' : '#2563EB'}
              />
            )}
          </Pressable>

          {/* Emergency SOS Glass Button */}
          <Pressable
            style={styles.sosGlassButton}
            onPress={handleEmergencyPress}
            accessibilityLabel="Emergency SOS"
          >
            <Ionicons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </Pressable>
        </View>
      </View>

      {/* FLOATING BOTTOM OVERLAY: GLASS CAROUSEL */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        {/* Location Permission Warning Card */}
        {permissionState === 'denied' ? (
          <View style={styles.warningGlassCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="location-outline" size={20} color="#EF4444" />
              <Text style={styles.warningTitle}>Location Permission Required</Text>
            </View>
            <Text style={styles.warningBody}>
              Enable location access to discover motorcycle repair shops near you.
            </Text>
            <View style={styles.warningActions}>
              <Pressable style={styles.miniPrimaryBtn} onPress={() => requestLocationAccess()}>
                <Text style={styles.miniBtnText}>Try Again</Text>
              </Pressable>
              <Pressable style={styles.miniSecondaryBtn} onPress={() => Linking.openSettings()}>
                <Text style={styles.miniBtnTextSec}>Open Settings</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Services Section Header (Glass pill) */}
        <View style={styles.carouselHeaderRow}>
          <View style={styles.titleGlassPill}>
            <Text style={styles.carouselTitle}>Nearby Roadside Help</Text>
            <View style={styles.countBadgePill}>
              <Text style={styles.countBadgeText}>{visibleMechanics.length} found</Text>
            </View>
          </View>
        </View>

        {/* Glassmorphic Services Carousel */}
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 14}
          decelerationRate="fast"
          contentContainerStyle={styles.cardListContainer}
        >
          {visibleMechanics.map((place, idx) => {
            const selected = selectedMechanicId === place.id;
            const isGas = place.type === 'gas_station';
            return (
              <Pressable
                key={place.id}
                style={[styles.serviceGlassCard, selected && styles.serviceGlassCardSelected]}
                onPress={() => handleSelectPlace(place, idx)}
              >
                {/* Card Top: Icon, Title & Distance */}
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.cardIconBox,
                      isGas ? styles.gasIconBox : styles.mechanicIconBox,
                    ]}
                  >
                    <Ionicons
                      name={isGas ? 'business' : 'construct'}
                      size={18}
                      color={isGas ? '#D97706' : '#2563EB'}
                    />
                  </View>

                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={styles.cardTypeLabel}>
                      {isGas ? 'GAS STATION' : 'MOTORCYCLE REPAIR'}
                    </Text>
                  </View>

                  <View style={styles.distanceGlassBadge}>
                    <Text style={styles.distanceText}>
                      {formatDistance(place.distance_meters)}
                    </Text>
                  </View>
                </View>

                {/* Address */}
                {place.address ? (
                  <Text style={styles.addressLabel} numberOfLines={1}>
                    📍 {place.address}
                  </Text>
                ) : null}

                {/* Description */}
                <Text style={styles.descLabel} numberOfLines={2}>
                  {place.description || 'Verified local emergency roadside service.'}
                </Text>

                {/* Action Buttons: Call & Navigate */}
                <View style={styles.cardButtonRow}>
                  <Pressable
                    style={styles.callGlassButton}
                    onPress={() => handleCall(place)}
                    accessibilityLabel="Call shop"
                  >
                    <Ionicons name="call" size={16} color="#2563EB" />
                  </Pressable>

                  <Pressable
                    style={styles.navigatePrimaryButton}
                    onPress={() => handleNavigate(place)}
                    accessibilityLabel="Navigate with Maps"
                  >
                    <Ionicons name="navigate" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.navigateButtonText}>Navigate</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}

          {placesLoading && visibleMechanics.length === 0 ? (
            <View style={[styles.serviceGlassCard, styles.placeholderCard]}>
              <Text style={styles.placeholderText}>Searching nearby mechanics...</Text>
            </View>
          ) : null}

          {!placesLoading && visibleMechanics.length === 0 ? (
            <View style={[styles.serviceGlassCard, styles.placeholderCard]}>
              <Text style={styles.placeholderText}>No services found within 5 km.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  /* TOP SAFE AREA & FLOATING HEADER */
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  brandIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  glassButtonRound: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  /* FLOATING SEARCH BAR */
  searchBarGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  searchText: {
    marginLeft: 10,
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  /* FILTER CHIPS ROW */
  filterChipRow: {
    paddingBottom: 6,
    gap: 8,
    alignItems: 'center',
  },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  glassChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  glassChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  glassChipTextActive: {
    color: '#FFFFFF',
  },
  glassChipTextInactive: {
    color: '#334155',
  },

  /* MAP CONTROLS OVERLAY (BUTTONS ON MAP) */
  mapActionsOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 245 : 230,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  gpsGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  gpsBadgeTitle: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  gpsBadgeDetail: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  rightActionStack: {
    gap: 12,
    alignItems: 'flex-end',
  },
  glassFabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  glassFabActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(236, 253, 245, 0.92)',
  },
  sosGlassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#EF4444',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  /* USER LOCATION & MAP PIN BADGES */
  userMarkerHalo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  userMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  mapPinContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  mapPinContainerSelected: {
    transform: [{ scale: 1.22 }],
    backgroundColor: '#EFF6FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  mechanicPinBorder: {
    borderColor: '#2563EB',
  },
  gasPinBorder: {
    borderColor: '#D97706',
  },

  /* FLOATING BOTTOM OVERLAY & CAROUSEL */
  bottomOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  carouselHeaderRow: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  titleGlassPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  carouselTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
  },
  cardListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 14,
  },
  serviceGlassCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
  },
  serviceGlassCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(248, 250, 255, 0.96)',
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.18,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mechanicIconBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gasIconBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  cardTitleBox: {
    flex: 1,
  },
  cardName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardTypeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  distanceGlassBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  distanceText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  addressLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  descLabel: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  cardButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callGlassButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigatePrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  placeholderCard: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  /* WARNING GLASS CARD */
  warningGlassCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#0F172A',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  warningTitle: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  warningBody: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 10,
  },
  warningActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniPrimaryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  miniBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  miniSecondaryBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  miniBtnTextSec: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
});
