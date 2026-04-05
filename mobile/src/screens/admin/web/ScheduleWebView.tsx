import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch, ScrollView } from 'react-native';
import { adminApi } from '../../../services/api';
import { Holiday } from '../../../types';
import { MONTHS_LONG } from '../../../utils/dates';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type DayAvail = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  openTime2: string | null;
  closeTime2: string | null;
  isOpen: boolean;
};

const DEFAULT: DayAvail[] = DAYS.map((_, i) => ({
  dayOfWeek: i, openTime: '09:00', closeTime: '12:00',
  openTime2: null, closeTime2: null, isOpen: i !== 0,
}));

function formatHolidayDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCDate()} de ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function ScheduleWebView({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<DayAvail[]>(DEFAULT);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, hols] = await Promise.all([adminApi.getAvailability(tenantId), adminApi.getHolidays(tenantId)]);
      if (avail?.length) {
        setAvailability(DAYS.map((_, i) => {
          const found = avail.find((a: any) => a.dayOfWeek === i);
          return found ? { dayOfWeek: i, openTime: found.openTime, closeTime: found.closeTime, openTime2: found.openTime2 ?? null, closeTime2: found.closeTime2 ?? null, isOpen: found.isOpen } : DEFAULT[i];
        }));
      }
      setHolidays(hols ?? []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const setDay = (idx: number, field: keyof DayAvail, value: any) =>
    setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));

  const toggleShift2 = (idx: number) => {
    const day = availability[idx];
    if (day.openTime2 !== null) {
      setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, closeTime: '20:30', openTime2: null, closeTime2: null } : d));
    } else {
      setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, closeTime: '12:00', openTime2: '12:30', closeTime2: '20:30' } : d));
    }
  };

  const applyToAll = (idx: number) => {
    const src = availability[idx];
    Alert.alert('Aplicar horarios', `¿Aplicar horarios de ${DAYS[src.dayOfWeek]} a todos los días abiertos?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aplicar', onPress: () => setAvailability(prev => prev.map(d => d.isOpen && d.dayOfWeek !== src.dayOfWeek ? { ...d, openTime: src.openTime, closeTime: src.closeTime, openTime2: src.openTime2, closeTime2: src.closeTime2 } : d)) },
    ]);
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
      const parts = newHolidayDate.trim().split('/');
      const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : newHolidayDate.trim();
      await adminApi.addHoliday(tenantId, isoDate, newHolidayName.trim());
      setNewHolidayDate(''); setNewHolidayName('');
      load();
    } catch {
      Alert.alert('Error', 'No se pudo agregar el feriado');
    }
  };

  const handleRemoveHoliday = (h: Holiday) => {
    Alert.alert('Eliminar feriado', `¿Eliminar "${h.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await adminApi.removeHoliday(tenantId, h.id); load(); } },
    ]);
  };

  if (loading) return <ActivityIndicator color="#7c3aed" style={{ margin: 40 }} />;

  return (
    <View style={s.root}>
      {/* Horarios */}
      <View style={s.leftCol}>
        <Text style={s.sectionLabel}>HORARIO SEMANAL</Text>
        <View style={s.card}>
          {availability.map((day, idx) => (
            <View key={day.dayOfWeek} style={[s.dayBlock, idx < 6 && s.dayBorder]}>
              <View style={s.dayRow}>
                <Switch
                  value={day.isOpen}
                  onValueChange={v => setDay(idx, 'isOpen', v)}
                  trackColor={{ false: '#2a2a35', true: 'rgba(124,58,237,0.4)' }}
                  thumbColor={day.isOpen ? '#7c3aed' : '#4b5563'}
                />
                <Text style={[s.dayName, !day.isOpen && s.dayNameOff]}>{DAYS[day.dayOfWeek]}</Text>
                {day.isOpen ? (
                  <View style={s.shiftRow}>
                    <TimeInput value={day.openTime} onChange={v => setDay(idx, 'openTime', v)} />
                    <Text style={s.sep}>–</Text>
                    <TimeInput value={day.closeTime} onChange={v => setDay(idx, 'closeTime', v)} />
                  </View>
                ) : (
                  <Text style={s.closedLabel}>Cerrado</Text>
                )}
              </View>

              {day.isOpen && (
                <>
                  {day.openTime2 !== null ? (
                    <View style={s.shift2Row}>
                      <View style={s.shift2Left}>
                        <TouchableOpacity onPress={() => toggleShift2(idx)} style={s.removeBtn}>
                          <Text style={s.removeBtnText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={s.shift2Label}>Tarde</Text>
                      </View>
                      <View style={s.shiftRow}>
                        <TimeInput value={day.openTime2 ?? ''} onChange={v => setDay(idx, 'openTime2', v)} />
                        <Text style={s.sep}>–</Text>
                        <TimeInput value={day.closeTime2 ?? ''} onChange={v => setDay(idx, 'closeTime2', v)} />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => toggleShift2(idx)} style={s.addShift2}>
                      <Text style={s.addShift2Text}>+ turno tarde</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => applyToAll(idx)} style={s.applyAll}>
                    <Text style={s.applyAllText}>Aplicar a todos los días</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveSchedule} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Guardar horarios</Text>}
        </TouchableOpacity>
      </View>

      {/* Feriados */}
      <View style={s.rightCol}>
        <Text style={s.sectionLabel}>DÍAS NO LABORABLES</Text>
        <View style={s.card}>
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Fecha (DD/MM/AAAA)</Text>
            <TextInput style={s.fieldInput} value={newHolidayDate} onChangeText={setNewHolidayDate} placeholder="25/05/2026" placeholderTextColor="#4b5563" />
          </View>
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Nombre del feriado</Text>
            <TextInput style={s.fieldInput} value={newHolidayName} onChangeText={setNewHolidayName} placeholder="Día de la Patria" placeholderTextColor="#4b5563" />
          </View>
          <TouchableOpacity style={s.addHolidayBtn} onPress={handleAddHoliday}>
            <Text style={s.addHolidayText}>+ Agregar feriado</Text>
          </TouchableOpacity>
        </View>

        {holidays.length > 0 && (
          <View style={[s.card, { marginTop: 16 }]}>
            {holidays.map((h, idx) => (
              <View key={h.id} style={[s.holidayRow, idx < holidays.length - 1 && s.holidayBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.holidayName}>{h.name}</Text>
                  <Text style={s.holidayDate}>{formatHolidayDate(h.date)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveHoliday(h)} style={s.removeHolidayBtn}>
                  <Text style={s.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      style={s.timeInput}
      value={value}
      onChangeText={onChange}
      keyboardType="numbers-and-punctuation"
      maxLength={5}
    />
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  leftCol: { flex: 1, marginRight: 20 },
  rightCol: { width: 320 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: '#18181f', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2a2a35' },

  dayBlock: { paddingVertical: 10 },
  dayBorder: { borderBottomWidth: 1, borderBottomColor: '#2a2a35' },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayName: { fontSize: 14, fontWeight: '600', color: '#e5e7eb', marginLeft: 10, width: 36 },
  dayNameOff: { color: '#4b5563' },
  closedLabel: { fontSize: 13, color: '#4b5563', marginLeft: 'auto' as any },

  shiftRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' as any },
  timeInput: {
    backgroundColor: '#2a2a35', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    fontSize: 13, fontWeight: '600', color: '#c084fc', textAlign: 'center', width: 58,
    borderWidth: 1, borderColor: '#3a3a45',
  },
  sep: { fontSize: 13, color: '#4b5563', marginHorizontal: 6 },

  shift2Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  shift2Left: { flexDirection: 'row', alignItems: 'center', width: 100 },
  shift2Label: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginLeft: 6 },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 12, color: '#f87171', fontWeight: '700' },

  addShift2: { paddingTop: 6, paddingBottom: 2, paddingLeft: 56 },
  addShift2Text: { fontSize: 11, color: '#7c3aed', fontWeight: '600' },
  applyAll: { paddingTop: 4, paddingBottom: 2, paddingLeft: 56 },
  applyAllText: { fontSize: 11, color: '#6b7280', textDecorationLine: 'underline' },

  saveBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#0f0f13', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#f9fafb', borderWidth: 1, borderColor: '#2a2a35',
    outlineStyle: 'none',
  } as any,
  addHolidayBtn: { backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 10, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  addHolidayText: { fontSize: 13, fontWeight: '700', color: '#c084fc' },

  holidayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  holidayBorder: { borderBottomWidth: 1, borderBottomColor: '#2a2a35' },
  holidayName: { fontSize: 13, fontWeight: '600', color: '#e5e7eb', marginBottom: 2 },
  holidayDate: { fontSize: 11, color: '#6b7280' },
  removeHolidayBtn: { padding: 8 },
});
