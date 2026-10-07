import React from 'react';
import { SafeAreaView, StyleSheet, ViewProps } from 'react-native';

export function Screen({ children, style, ...props }: ViewProps) {
  return (
    <SafeAreaView style={[styles.screen, style]} {...props}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  }
});
