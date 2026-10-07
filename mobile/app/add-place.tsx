import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { router } from 'expo-router';

export default function AddPlaceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Place</Text>
      <Text style={styles.info}>Form to add a missing repair shop or gas station.</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Cancel" onPress={() => router.back()} color="red" />
        <Button title="Submit" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    marginBottom: 24,
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
    marginBottom: 32,
  }
});
