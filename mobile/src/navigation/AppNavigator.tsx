import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { RootStackParamList, Tenant, Service, Professional, Booking } from '../types';
import { TenantProfileScreen } from '../screens/booking/TenantProfileScreen';
import { SelectProfessionalScreen } from '../screens/booking/SelectProfessionalScreen';
import { SelectDateTimeScreen } from '../screens/booking/SelectDateTimeScreen';
import { ClientInfoScreen } from '../screens/booking/ClientInfoScreen';
import { BookingConfirmedScreen } from '../screens/booking/BookingConfirmedScreen';

// ── Tipos de navegación simplificados ────────────────────────────────────────

type ScreenEntry = {
  [K in keyof RootStackParamList]: { name: K; params: RootStackParamList[K] }
}[keyof RootStackParamList];

export type AppNavigation = {
  navigate: <K extends keyof RootStackParamList>(name: K, params: RootStackParamList[K]) => void;
  goBack: () => void;
  replace: <K extends keyof RootStackParamList>(name: K, params: RootStackParamList[K]) => void;
  popToTop: () => void;
};

export type AppRoute<K extends keyof RootStackParamList> = {
  params: RootStackParamList[K];
};

// ── Navegador ─────────────────────────────────────────────────────────────────

export function AppNavigator() {
  const [stack, setStack] = useState<ScreenEntry[]>([
    { name: 'TenantProfile', params: { slug: 'studio-lumiere' } },
  ]);

  const navigation: AppNavigation = {
    navigate: useCallback((name, params) => {
      setStack(s => [...s, { name, params } as ScreenEntry]);
    }, []),
    goBack: useCallback(() => {
      setStack(s => (s.length > 1 ? s.slice(0, -1) : s));
    }, []),
    replace: useCallback((name, params) => {
      setStack(s => [...s.slice(0, -1), { name, params } as ScreenEntry]);
    }, []),
    popToTop: useCallback(() => {
      setStack(s => [s[0]]);
    }, []),
  };

  const current = stack[stack.length - 1];

  const renderScreen = () => {
    switch (current.name) {
      case 'TenantProfile':
        return (
          <TenantProfileScreen
            navigation={navigation}
            route={{ params: current.params as RootStackParamList['TenantProfile'] }}
          />
        );
      case 'SelectProfessional':
        return (
          <SelectProfessionalScreen
            navigation={navigation}
            route={{ params: current.params as RootStackParamList['SelectProfessional'] }}
          />
        );
      case 'SelectDateTime':
        return (
          <SelectDateTimeScreen
            navigation={navigation}
            route={{ params: current.params as RootStackParamList['SelectDateTime'] }}
          />
        );
      case 'ClientInfo':
        return (
          <ClientInfoScreen
            navigation={navigation}
            route={{ params: current.params as RootStackParamList['ClientInfo'] }}
          />
        );
      case 'BookingConfirmed':
        return (
          <BookingConfirmedScreen
            navigation={navigation}
            route={{ params: current.params as RootStackParamList['BookingConfirmed'] }}
          />
        );
      default:
        return null;
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}
