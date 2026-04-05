import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { Holiday } from '../../types';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';
import { DAYS_SHORT, MONTHS_LONG } from '../../utils/dates';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminSchedule'> };

const DEFAULT_AVAIL = DAYS_SHORT.map((_, i) => ({
  dayOfWeek: i,
  openTime: '09:00',
  closeTime: '21:00',
  isOpen: i !== 0,
}));

export function AdminScheduleScreen({ navigation, route }: Props) {
  const { tenantId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState(DEFAULT_AVAIL);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, hols] = await Promise.all([
        adminApi.getAvailability(tenantId),
        adminApi.getHolidays(tenantId),
      ]);
      if (avail?.length) {
        setAvailability(
          DAYS_SHORT.map((_, i) => {
            const found = avail.find((a: any) => a.dayOfWeek === i);
            return found ?? DEFAULT_AVAIL[i];
          }),
        );
      }
      setHolidays(hols ?? []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const setDay = (idx: number, field: string, value: any) => {
    setAvailability((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      await adminApi.updateAvailability(tenantId, availability);
      Alert.alert('Guardado', 'Horarios actualizados');
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHolidayDate.trim() || !newHolidayName.trim()) {
      Alert.alert('Datos incompletos', 'Ingresá fecha y nombre del feriado');
      return;
    }
    try {
      await adminApi.addHoliday(tenantId, newHolidayDate.trim(), newHolidayName.trim());
      setNewHolidayDate('');
      setNewHolidayName('');
      load();
    } catch {
      Alert.alert('Error', 'No se pudo agregar el feriado');
    }
  };

  const handleRemoveHoliday = (holiday: Holiday) => {
    Alert.alert('Eliminar feriado', `¿Eliminar "${holiday.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => { await adminApi.removeHoliday(tenantId, holiday.id); load(); },
      },
    ]);
  };

  const formatHolidayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Horarios</Text>
        </View>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Horarios del local</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>HORARIO SEMANAL</Text>
        <View style={styles.card}>
          {availability.map((day, idx) => (
            <View key={day.dayOfWeek} style={[styles.dayRow, idx < 6 && styles.dayRowBorder]}>
              <View style={styles.dayToggle}>
                <Switch
                  value={day.isOpen}
                  onValueChange={(v) => setDay(idx, 'isOpen', v)}
                  trackColor={{ false: '#e5e7eb', true: colors.primaryLight }}
                  thumbColor={day.isOpen ? colors.primary : '#9ca3af'}
                />
                <Text style={[styles.dayName, !day.isOpen && styles.dayNameOff]}>
                  {DAYS_SHORT[day.dayOfWeek]}
                </Text>
              </View>
              {day.isOpen ? (
                <View style={styles.timeRange}>
                  <TextInput
                    style={styles.timeInput}
                    value={day.openTime}
                    onChangeText={(v) => setDay(idx, 'openTime', v)}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                  <Text style={styles.timeSep}>–</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={day.closeTime}
                    onChangeText={(v) => setDay(idx, 'closeTime', v)}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              ) : (
                <Text style={styles.closedText}>Cerrado</Text>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSaveSchedule}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar horarios</Text>
          }
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>DÍAS NO LABORABLES</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.inputWrap, { width: 110, marginRight: spacing.sm }]}>
              <Text style={styles.inputLabel}>Fecha (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input} value={newHolidayDate}
                onChangeText={setNewHolidayDate} placeholder="2026-05-25"
                placeholderTextColor="#d1d5db" keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input} value={newHolidayName}
                onChangeText={setNewHolidayName} placeholder="Día de la Patria"
                placeholderTextColor="#d1d5db"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.addHolidayBtn} onPress={handleAddHoliday}>
            <Text style={styles.addHolidayBtnText}>+ Agregar día</Text>
          </TouchableOpacity>
        </View>

        {holidays.length > 0 && (
          <View style={[styles.card, { marginTop: spacing.md }]}>
            {holidays.map((h, idx) => (
              <View key={h.id} style={[styles.holidayRow, idx < holidays.length - 1 && styles.holidayRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.holidayName}>{h.name}</Text>
                  <Text style={styles.holidayDate}>{formatHolidayDate(h.date)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveHoliday(h)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: spacing.xl, backgroundColor: '#4a0e8f' },
  back: { marginBottom: spacing.md },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 28 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },

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

  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  dayRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f5' },
  dayToggle: { flexDirection: 'row', alignItems: 'center', width: 80 },
  dayName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginLeft: spacing.sm },
  dayNameOff: { color: '#9ca3af' },
  timeRange: { flexDirection: 'row', alignItems: 'center' },
  timeInput: {
    backgroundColor: '#f4f3ff', borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    fontSize: 14, fontWeight: '600', color: colors.primary,
    textAlign: 'center', width: 56,
    borderWidth: 1, borderColor: '#e0ddff',
  },
  timeSep: { fontSize: 14, color: '#9ca3af', marginHorizontal: spacing.sm },
  closedText: { fontSize: 13, color: '#9ca3af' },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.lg,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  row: { flexDirection: 'row' },
  inputWrap: { marginBottom: spacing.md },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e5e7eb',
  },
  addHolidayBtn: {
    backgroundColor: '#ede9fe', borderRadius: radius.md,
    paddingVertical: 10, alignItems: 'center',
  },
  addHolidayBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  holidayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  holidayRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f5' },
  holidayName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  holidayDate: { fontSize: 12, color: '#9ca3af' },
  removeBtn: { padding: 8 },
  removeBtnText: { fontSize: 14, color: '#dc2626', fontWeight: '700' },
});
