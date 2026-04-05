import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { BookingAdmin } from '../../types';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';
import { DAYS_SHORT, MONTHS_LONG } from '../../utils/dates';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminDashboard'> };

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado', NO_SHOW: 'No se presentó',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#fbbf24', CONFIRMED: '#4ade80',
  COMPLETED: '#9ca3af', CANCELLED: '#f87171', NO_SHOW: '#f87171',
};
const STATUS_BG: Record<string, string> = {
  PENDING: '#fef3c7', CONFIRMED: '#d1fae5',
  COMPLETED: '#f3f4f6', CANCELLED: '#fee2e2', NO_SHOW: '#fee2e2',
};

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AdminDashboardScreen({ navigation, route }: Props) {
  const { tenantId } = route.params;
  const [date, setDate] = useState(toDateString(new Date()));
  const [bookings, setBookings] = useState<BookingAdmin[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const data = await adminApi.getDayBookings(tenantId, d);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(date); }, [date, load]);

  const changeDay = (delta: number) => {
    const d = new Date(date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta);
    setDate(toDateString(d));
  };

  const handleStatus = (booking: BookingAdmin, status: string) => {
    Alert.alert(
      'Cambiar estado',
      `¿Marcar turno de ${booking.client.firstName} como "${STATUS_LABEL[status]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await adminApi.updateBookingStatus(booking.id, tenantId, status);
            load(date);
          },
        },
      ],
    );
  };

  const d = new Date(date + 'T12:00:00Z');
  const dateLabel = `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS_LONG[d.getUTCMonth()]}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Agenda</Text>

        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => changeDay(-1)}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => changeDay(1)}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {bookings.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Sin turnos este día</Text>
            </View>
          ) : (
            bookings.map((b) => (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: STATUS_BG[b.status] }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLOR[b.status] }]}>
                      {STATUS_LABEL[b.status]}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>
                    {new Date(b.startTime).getUTCHours().toString().padStart(2, '0')}:
                    {new Date(b.startTime).getUTCMinutes().toString().padStart(2, '0')} hs
                  </Text>
                </View>

                <Text style={styles.clientName}>
                  {b.client.firstName} {b.client.lastName}
                </Text>
                <Text style={styles.clientPhone}>{b.client.phone}</Text>

                <View style={styles.serviceRow}>
                  <Text style={styles.serviceName}>{b.service.name}</Text>
                  <Text style={styles.serviceProf}>· {b.professional.firstName}</Text>
                </View>

                {b.status === 'PENDING' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]}
                      onPress={() => handleStatus(b, 'CONFIRMED')}
                    >
                      <Text style={[styles.actionText, { color: '#059669' }]}>Confirmar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                      onPress={() => handleStatus(b, 'CANCELLED')}
                    >
                      <Text style={[styles.actionText, { color: '#dc2626' }]}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {b.status === 'CONFIRMED' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#ede9fe' }]}
                      onPress={() => handleStatus(b, 'COMPLETED')}
                    >
                      <Text style={[styles.actionText, { color: '#7c3aed' }]}>Completar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                      onPress={() => handleStatus(b, 'NO_SHOW')}
                    >
                      <Text style={[styles.actionText, { color: '#dc2626' }]}>No vino</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: spacing.xl, backgroundColor: '#4a0e8f' },
  back: { marginBottom: spacing.sm },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 28 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: spacing.md },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 20, color: '#fff', lineHeight: 24 },
  dateLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },

  body: { padding: spacing.xl, paddingBottom: spacing.xl + BOTTOM_INSET },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: 15, color: '#9ca3af' },

  card: {
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },

  clientName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  clientPhone: { fontSize: 13, color: '#9ca3af', marginBottom: spacing.sm },

  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  serviceName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  serviceProf: { fontSize: 13, color: '#9ca3af', marginLeft: 4 },

  actions: { flexDirection: 'row' },
  actionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: radius.md,
    alignItems: 'center', marginRight: spacing.sm,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
});
