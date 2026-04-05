import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi, bookingApi } from '../../services/api';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';
import { DAYS_SHORT, MONTHS_LONG } from '../../utils/dates';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminBookingCreate'> };

export function AdminBookingCreateScreen({ navigation, route }: Props) {
  const { tenantId, date } = route.params;

  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.getServices(tenantId),
      adminApi.getProfessionals(tenantId),
    ]).then(([svcs, profs]) => {
      setServices(svcs);
      setProfessionals(profs);
    }).catch(() => Alert.alert('Error', 'No se pudieron cargar los datos'));
  }, [tenantId]);

  // Cuando cambia servicio o profesional, cargar slots
  useEffect(() => {
    if (!selectedService || !selectedProfessional) { setSlots([]); return; }
    setLoadingSlots(true);
    setSelectedTime(null);
    bookingApi.getSlots({
      tenantId,
      serviceId: selectedService.id,
      professionalId: selectedProfessional.id,
      date,
    }).then((data) => setSlots(data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedService, selectedProfessional, date, tenantId]);

  // Filtra profesionales que realizan el servicio seleccionado
  const filteredProfessionals = selectedService
    ? professionals.filter((p) => p.services.some((ps: any) => ps.serviceId === selectedService.id))
    : professionals;

  const handleSave = async () => {
    if (!selectedService || !selectedProfessional || !selectedTime) {
      Alert.alert('Faltan datos', 'Elegí servicio, profesional y horario');
      return;
    }
    if (!clientFirstName.trim() || !clientPhone.trim()) {
      Alert.alert('Faltan datos', 'Nombre y teléfono del cliente son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const startTime = `${date}T${selectedTime}:00.000Z`;
      await bookingApi.create({
        tenantId,
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        startTime,
        clientFirstName: clientFirstName.trim(),
        clientLastName: clientLastName.trim(),
        clientPhone: clientPhone.trim(),
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo crear el turno');
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.title}>Nuevo turno</Text>
        <Text style={styles.subtitle}>{dateLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {/* Servicio */}
        <Text style={styles.sectionLabel}>SERVICIO</Text>
        <View style={styles.card}>
          {services.map((svc, idx) => (
            <TouchableOpacity
              key={svc.id}
              style={[styles.optionRow, idx < services.length - 1 && styles.optionBorder]}
              onPress={() => { setSelectedService(svc); setSelectedProfessional(null); }}
            >
              <Text style={styles.optionEmoji}>{svc.emoji ?? '✨'}</Text>
              <View style={styles.optionInfo}>
                <Text style={styles.optionName}>{svc.name}</Text>
                <Text style={styles.optionMeta}>{svc.durationMin} min · ${Number(svc.price).toLocaleString('es-AR')}</Text>
              </View>
              <View style={[styles.radio, selectedService?.id === svc.id && styles.radioSelected]}>
                {selectedService?.id === svc.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Profesional */}
        {selectedService && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>PROFESIONAL</Text>
            <View style={styles.card}>
              {filteredProfessionals.length === 0 ? (
                <Text style={styles.emptyText}>Ningún profesional realiza este servicio</Text>
              ) : filteredProfessionals.map((prof, idx) => (
                <TouchableOpacity
                  key={prof.id}
                  style={[styles.optionRow, idx < filteredProfessionals.length - 1 && styles.optionBorder]}
                  onPress={() => setSelectedProfessional(prof)}
                >
                  <View style={styles.profAvatar}>
                    <Text style={{ fontSize: 18 }}>👩</Text>
                  </View>
                  <Text style={[styles.optionName, { flex: 1 }]}>
                    {prof.firstName} {prof.lastName}
                  </Text>
                  <View style={[styles.radio, selectedProfessional?.id === prof.id && styles.radioSelected]}>
                    {selectedProfessional?.id === prof.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Horario */}
        {selectedProfessional && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>HORARIO</Text>
            {loadingSlots ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : (
              <View style={styles.slotsGrid}>
                {slots.filter(s => s.available).map((slot) => (
                  <TouchableOpacity
                    key={slot.time}
                    style={[styles.slotBtn, selectedTime === slot.time && styles.slotBtnSelected]}
                    onPress={() => setSelectedTime(slot.time)}
                  >
                    <Text style={[styles.slotText, selectedTime === slot.time && styles.slotTextSelected]}>
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
                {slots.filter(s => s.available).length === 0 && (
                  <Text style={styles.emptyText}>Sin disponibilidad este día</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Cliente */}
        {selectedTime && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>DATOS DEL CLIENTE</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.inputWrap, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.inputLabel}>Nombre *</Text>
                  <TextInput
                    style={styles.input} value={clientFirstName} onChangeText={setClientFirstName}
                    placeholder="María" placeholderTextColor="#d1d5db"
                  />
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Apellido</Text>
                  <TextInput
                    style={styles.input} value={clientLastName} onChangeText={setClientLastName}
                    placeholder="García" placeholderTextColor="#d1d5db"
                  />
                </View>
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <TextInput
                  style={styles.input} value={clientPhone} onChangeText={setClientPhone}
                  placeholder="2215001234" placeholderTextColor="#d1d5db"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Notas (opcional)</Text>
                <TextInput
                  style={[styles.input, { height: 56, textAlignVertical: 'top' }]}
                  value={notes} onChangeText={setNotes}
                  placeholder="Uñas rojas, gel..." placeholderTextColor="#d1d5db"
                  multiline
                />
              </View>
            </View>
          </>
        )}

        {selectedTime && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Confirmar turno · {selectedTime} hs</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl, backgroundColor: '#4a0e8f' },
  back: { marginBottom: spacing.sm },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 28 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  body: { padding: spacing.xl, paddingBottom: spacing.xl + BOTTOM_INSET },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1, marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f5' },
  optionEmoji: { fontSize: 22, marginRight: spacing.md },
  profAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionInfo: { flex: 1 },
  optionName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  optionMeta: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  slotsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  slotBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.md, margin: 4,
    backgroundColor: '#f4f3ff', borderWidth: 1, borderColor: '#e0ddff',
  },
  slotBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  slotTextSelected: { color: '#fff' },

  emptyText: { fontSize: 13, color: '#9ca3af', padding: spacing.sm },

  row: { flexDirection: 'row' },
  inputWrap: { marginBottom: spacing.md },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e5e7eb',
  },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
