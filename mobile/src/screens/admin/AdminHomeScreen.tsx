import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminHome'> };

const W = Dimensions.get('window').width;
const CARD_W = (W - spacing.xl * 2 - spacing.md) / 2;

const SECTIONS = [
  { icon: '📅', label: 'Agenda', color: '#ede9fe', screen: 'AdminDashboard' as const },
  { icon: '👩', label: 'Profesionales', color: '#fce7f3', screen: 'AdminProfessionals' as const },
  { icon: '✨', label: 'Servicios', color: '#d1fae5', screen: 'AdminServices' as const },
  { icon: '🕐', label: 'Horarios', color: '#dbeafe', screen: 'AdminSchedule' as const },
];

export function AdminHomeScreen({ navigation, route }: Props) {
  const { tenantId, tenantName } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerLabel}>PANEL ADMIN</Text>
        <Text style={styles.headerTitle}>{tenantName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.grid}>
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.screen}
              style={[styles.card, { backgroundColor: s.color }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(s.screen, { tenantId } as any)}
            >
              <Text style={styles.cardIcon}>{s.icon}</Text>
              <Text style={styles.cardLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  header: {
    paddingTop: 60, paddingBottom: 28, paddingHorizontal: spacing.xl,
    backgroundColor: '#4a0e8f',
  },
  back: { marginBottom: spacing.md },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 28 },
  headerLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5, marginBottom: 6,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },

  body: {
    padding: spacing.xl,
    paddingBottom: spacing.xl + BOTTOM_INSET,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    width: CARD_W,
    height: CARD_W * 0.9,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  cardIcon: { fontSize: 36, marginBottom: spacing.sm },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
});
