import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from './src/screens/LoginScreen';
import OrdersCalendarScreen from './src/screens/OrdersCalendarScreen';
import auth from './src/services/auth';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    return (
      <Tab.Navigator>
        <Tab.Screen name="Orders" component={OrdersCalendarScreen} />
        <Tab.Screen name="Settings">
          {() => <SettingsScreen onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => auth.isSignedIn());

  useEffect(() => {
    // in case storage was set outside, keep state in sync when app mounts
    setIsLoggedIn(auth.isSignedIn());
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <NavigationContainer>
      <AdminDashboard onLogout={() => setIsLoggedIn(false)} />
    </NavigationContainer>
  );
}
