import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import MenuManagementScreen from './src/screens/MenuManagementScreen';
import OrdersCalendarScreen from './src/screens/OrdersCalendarScreen';
import auth from './src/services/auth';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Orders:   { active: 'calendar',         inactive: 'calendar-outline' },
  Menu:     { active: 'restaurant',       inactive: 'restaurant-outline' },
  Settings: { active: 'settings',         inactive: 'settings-outline' },
};

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#c0392b',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Orders" component={OrdersCalendarScreen} />
      <Tab.Screen name="Menu" component={MenuManagementScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => auth.isSignedIn());

  useEffect(() => {
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
