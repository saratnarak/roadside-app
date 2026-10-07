import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication</Text>
      <Text style={styles.subtitle}>This feature is planned for a future sign-in flow.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9BA7BB',
    fontSize: 14,
    textAlign: 'center',
  },
});
