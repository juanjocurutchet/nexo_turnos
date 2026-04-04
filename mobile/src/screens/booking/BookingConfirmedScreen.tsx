import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useBookingStore } from '../../store/bookingStore';
import { colors, spacing, radius } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmed'>;

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function BookingConfirmedScreen({ navigation, route }: Props) {
  const { booking } = route.params;
  const { reset } = useBookingStore();

  const start = new Date(booking.startTime);
  const dateLabel = `${DAYS_SHORT[start.getUTCDay()]} ${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]}`;
  const timeLabel = `${String(start.getUTCHours()).padStart(2,'0')}:${String(start.getUTCMinutes()).padStart(2,'0')} hs`;

  const handleWhatsApp = () => {
    const msg = `Hola! Acabo de reservar un turno en ${booking.tenant.name}.\n\n` +
      `📅 *${dateLabel}* a las *${timeLabel}*\n` +
      `💅 *${booking.service.name}*\n` +
      `👩 Con ${booking.professional.firstName}\n\n` +
      `ID de turno: ${booking.id}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
  };

  const handleNewBooking = () => {
    reset();
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1e0533', '#4a0e8f']}
        style={styles.hero}
      >
        <View style={styles.checkCircle}>
          <Text style={{ fontSize: 40 }}>✓</Text>
        </View>
        <Text style={styles.heroTitle}>¡Turno reservado!</Text>
        <Text style={styles.heroSub}>Te esperamos en {booking.tenant.name}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Detalle */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>DETALLE DE TU TURNO</Text>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#f4f3ff' }]}>
              <Text>💅</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Servicio</Text>
              <Text style={styles.detailValue}>{booking.service.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#fce7f3' }]}>
              <Text>👩</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Profesional</Text>
              <Text style={styles.detailValue}>
                {booking.professional.firstName} {booking.professional.lastName}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#f4f3ff' }]}>
              <Text>📅</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Fecha y hora</Text>
              <Text style={styles.detailValue}>{dateLabel} · {timeLabel}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#d1fae5' }]}>
              <Text>⏱</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Duración</Text>
              <Text style={styles.detailValue}>{booking.service.durationMin} minutos</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.detailIcon, { backgroundColor: '#fce7f3' }]}>
              <Text>💰</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                ${Number(booking.totalPrice).toLocaleString('es-AR')}
              </Text>
            </View>
          </View>
        </View>

        {/* WhatsApp notice */}
        <View style={styles.waBanner}>
          <Text style={styles.waBannerText}>
            📩 Te enviaremos un recordatorio por WhatsApp 24 hs antes
          </Text>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleNewBooking}>
            <Text style={styles.btnSecondaryText}>Reservar otro turno</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleWhatsApp} activeOpacity={0.85}>
            <LinearGradient
              colors={['#25d366', '#128c7e']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnWa}
            >
              <Text style={styles.btnWaText}>📲 Compartir por WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  hero: { paddingTop: 70, paddingBottom: 40, alignItems: 'center', paddingHorizontal: spacing.xl },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(74,222,128,0.25)',
    borderWidth: 2, borderColor: '#4ade80',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)' },

  body: { padding: spacing.xl },

  detailCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  detailTitle: {
    fontSize: 10, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1, marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f5',
  },
  detailIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },

  waBanner: {
    padding: spacing.md,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
    marginBottom: spacing.lg,
  },
  waBannerText: { fontSize: 12, color: colors.primary, fontWeight: '500', textAlign: 'center' },

  actions: { gap: spacing.sm },
  btnSecondary: {
    borderRadius: radius.lg, paddingVertical: spacing.lg,
    alignItems: 'center', borderWidth: 2, borderColor: '#e8e6f0',
    backgroundColor: colors.white,
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  btnWa: { borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  btnWaText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
