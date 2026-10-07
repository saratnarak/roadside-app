import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Rider Profile</Text>
      </View>

      {isSignedIn && user ? (
        <>
          {/* User Card */}
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              {user.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.fullName || user.primaryEmailAddress?.emailAddress || 'MotoRescue Rider'}
                </Text>
                <Text style={styles.userEmail}>
                  {user.primaryEmailAddress?.emailAddress}
                </Text>
                <View style={styles.badge}>
                  <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  <Text style={styles.badgeText}>Verified Rider</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Clerk ID</Text>
              <Text style={styles.metaValue} numberOfLines={1} ellipsizeMode="middle">
                {user.id}
              </Text>
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Rider Tools</Text>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/add-place')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.actionText}>Add Verified Repair Spot</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="bookmark-outline" size={20} color="#38BDF8" />
              </View>
              <Text style={styles.actionText}>Saved Spots (Coming soon)</Text>
            </View>

            <View style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Rescue History (Coming soon)</Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              await signOut();
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        /* Unauthenticated View */
        <View style={styles.guestCard}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-circle-outline" size={64} color="#3B82F6" />
          </View>
          <Text style={styles.guestTitle}>Sign in to MotoRescue</Text>
          <Text style={styles.guestSubtitle}>
            Browse maps and discover nearby mechanics freely. Sign in to contribute new repair spots, report hazards, and save roadside favorites.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-in' as any)}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/sign-up' as any)}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B18',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050B18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  card: {
    backgroundColor: 'rgba(17, 26, 43, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    color: '#94A3B8',
    fontSize: 12,
    maxWidth: '70%',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionHeader: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  guestCard: {
    backgroundColor: 'rgba(17, 26, 43, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  guestIconCircle: {
    marginBottom: 16,
  },
  guestTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
});
