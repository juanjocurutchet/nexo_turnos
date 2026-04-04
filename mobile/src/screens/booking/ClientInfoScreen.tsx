import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { bookingApi } from '../../services/api';
import { colors, spacing, radius } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientInfo'>;

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function ClientInfoScreen({ navigation, route }: Props) {
  const { tenant, service, professional, date, time } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dateObj = new Date(date + 'T12:00:00Z');
  const dateLabel = `${DAYS_SHORT[dateObj.getUTCDay()]} ${dateObj.getUTCDate()} de ${MONTHS[dateObj.getUTCMonth()]}`;

  const isValid = firstName.trim() && lastName.trim() && phone.trim().length >= 8;

  const handleConfirm = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const startTime = new Date(`${date}T${time}:00.000Z`).toISOString();
      const booking = await bookingApi.create({
        tenantId: tenant.id,
        serviceId: service.id,
        professionalId: professional.id,
        startTime,
        clientFirstName: firstName.trim(),
        clientLastName: lastName.trim(),
        clientPhone: phone.trim(),
        clientEmail: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      navigation.replace('BookingConfirmed', { booking });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <LinearGradient colors={['#1e0533', '#4a0e8f']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tus datos</Text>
          <Text style={styles.subtitle}>Último paso para confirmar</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.body}>
          {/* Resumen del turno */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>RESUMEN</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowIcon}>💅</Text>
              <View style={styles.summaryRowInfo}>
                <Text style={styles.summaryRowTitle}>{service.name}</Text>
                <Text style={styles.summaryRowSub}>{service.durationMin} min</Text>
              </View>
              <Text style={styles.summaryPrice}>
                ${Number(service.price).toLocaleString('es-AR')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowIcon}>👩</Text>
              <View style={styles.summaryRowInfo}>
                <Text style={styles.summaryRowTitle}>{professional.firstName} {professional.lastName}</Text>
                <Text style={styles.summaryRowSub}>Profesional</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowIcon}>📅</Text>
              <View style={styles.summaryRowInfo}>
                <Text style={styles.summaryRowTitle}>{dateLabel}</Text>
                <Text style={styles.summaryRowSub}>{time} hs</Text>
              </View>
            </View>
          </View>

          {/* Formulario */}
          <Text style={styles.formTitle}>Tus datos de contacto</Text>

          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Martina"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Apellido *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="López"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>WhatsApp / Teléfono *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="11 5678 1234"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Email (opcional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="martina@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Nota para el local (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej: prefiero gel de color nude"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!isValid || loading}
            activeOpacity={0.85}
            style={{ marginTop: spacing.xl }}
          >
            <LinearGradient
              colors={isValid && !loading ? ['#7c3aed', '#a855f7'] : ['#4b5563', '#4b5563']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmBtnText}>Confirmar turno ✓</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: spacing.xl },
  back: { marginBottom: spacing.md },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 28 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  body: { padding: spacing.xl, paddingBottom: 60 },

  summaryCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  summaryLabel: {
    fontSize: 10, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1, marginBottom: spacing.md,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  summaryRowIcon: { fontSize: 20, width: 32, textAlign: 'center' },
  summaryRowInfo: { flex: 1 },
  summaryRowTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  summaryRowSub: { fontSize: 12, color: '#9ca3af' },
  summaryPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  summaryDivider: { height: 1, backgroundColor: '#f0f0f5' },

  formTitle: {
    fontSize: 16, fontWeight: '700', color: '#1a1a2e',
    marginBottom: spacing.lg,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  inputWrap: { marginBottom: spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  input: {
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: 14, color: '#1a1a2e',
    borderWidth: 1.5, borderColor: '#e8e6f0',
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },

  errorText: { color: colors.error, fontSize: 13, marginTop: spacing.sm, textAlign: 'center' },

  confirmBtn: { borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  confirmBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
