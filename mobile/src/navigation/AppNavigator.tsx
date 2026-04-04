import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { TenantProfileScreen } from '../screens/booking/TenantProfileScreen';
import { SelectProfessionalScreen } from '../screens/booking/SelectProfessionalScreen';
import { SelectDateTimeScreen } from '../screens/booking/SelectDateTimeScreen';
import { ClientInfoScreen } from '../screens/booking/ClientInfoScreen';
import { BookingConfirmedScreen } from '../screens/booking/BookingConfirmedScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="TenantProfile"
          component={TenantProfileScreen}
          initialParams={{ slug: 'studio-lumiere' }}
        />
        <Stack.Screen name="SelectProfessional" component={SelectProfessionalScreen} />
        <Stack.Screen name="SelectDateTime" component={SelectDateTimeScreen} />
        <Stack.Screen name="ClientInfo" component={ClientInfoScreen} />
        <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
