import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { spacing, radius, BOTTOM_INSET, colors } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminHome'> };

const SECTIONS = [
  {
    icon: '📅',
    label: 'Agenda',
    desc: 'Ver y gestionar turnos del día',
    bg: '#ede9fe',
    iconBg: '#7c3aed',
    screen: 'AdminDashboard' as const,
  },
  {
    icon: '👩‍💼',
    label: 'Profesionales',
    desc: 'Equipo, horarios y disponibilidad',
    bg: '#fce7f3',
    iconBg: '#db2777',
    screen: 'AdminProfessionals' as const,
  },
  {
    icon: '✨',
    label: 'Servicios',
    desc: 'Precios, duración y descripción',
    bg: '#d1fae5',
    iconBg: '#059669',
    screen: 'AdminServices' as const,
  },
  {
    icon: '🕐',
    label: 'Horarios del local',
    desc: 'Días de apertura y feriados',
    bg: '#dbeafe',
    iconBg: '#2563eb',
    screen: 'AdminSchedule' as const,
  },
  {
    icon: '⚙️',
    label: 'Configuración',
    desc: 'Nombre del negocio y datos generales',
    bg: '#fef3c7',
    iconBg: '#d97706',
    screen: 'AdminSettings' as const,
  },
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
        <Text style={styles.headerLabel}>PANEL ADMINISTRADOR</Text>
        <Text style={styles.headerTitle}>{tenantName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.screen}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(s.screen, { tenantId } as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
              <Text style={styles.icon}>{s.icon}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{s.label}</Text>
              <Text style={styles.cardDesc}>{s.desc}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
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
    fontSize: 10, color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2, marginBottom: 6, fontWeight: '700',
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },

  body: { padding: spacing.xl, paddingBottom: spacing.xl + BOTTOM_INSET },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.lg,
  },
  icon: { fontSize: 26 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#9ca3af' },
  arrow: { fontSize: 22, color: '#c4b5fd', fontWeight: '300' },
});
