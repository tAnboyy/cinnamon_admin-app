import React from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import auth from '../services/auth';

const SettingsScreen = ({ onLogout }: { onLogout: () => void }) => {
  const handleLogout = async () => {
    // Use window.confirm on web, simple logout on native
    const shouldLogout = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to sign out?')
      : true;
    
    if (shouldLogout) {
      console.log('[SettingsScreen] Logging out...');
      await auth.signOut();
      console.log('[SettingsScreen] Calling onLogout callback');
      onLogout();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrap}>
        <Button title="Logout" color="#d32f2f" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  buttonWrap: { marginTop: 10, width: 160 },
});

export default SettingsScreen;
