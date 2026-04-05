import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Switch, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminProfessionalDetail'> };

const DAYS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type DayAvail = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startTime2: string | null;
  endTime2: string | null;
  isAvailable: boolean;
};

const DEFAULT_AVAILABILITY: DayAvail[] = DAYS_LABELS.map((_, i) => ({
  dayOfWeek: i,
  startTime: '09:00',
  endTime: '12:00',
  startTime2: null,
  endTime2: null,
  isAvailable: i !== 0,
}));

export function AdminProfessionalDetailScreen({ navigation, route }: Props) {
  const { tenantId, professionalId } = route.params;
  const isNew = !professionalId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState<DayAvail[]>(DEFAULT_AVAILABILITY);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const services = await adminApi.getServices(tenantId);
      setAllServices(services);

      if (!isNew) {
        const data = await adminApi.getProfessional(professionalId!, tenantId);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setBio(data.bio ?? '');
        setSelectedServiceIds(data.services?.map((ps: any) => ps.serviceId) ?? []);
        if (data.availability?.length) {
          setAvailability(
            DAYS_LABELS.map((_, i) => {
              const found = data.availability.find((a: any) => a.dayOfWeek === i);
              if (found) {
                return {
                  dayOfWeek: i,
                  startTime: found.startTime,
                  endTime: found.endTime,
                  startTime2: found.startTime2 ?? null,
                  endTime2: found.endTime2 ?? null,
                  isAvailable: found.isAvailable,
                };
              }
              return DEFAULT_AVAILABILITY[i];
            }),
          );
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el profesional');
    } finally {
      setLoading(false);
    }
  }, [isNew, professionalId, tenantId]);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  useEffect(() => { load(); }, [load]);

  const setAvailDay = (idx: number, field: keyof DayAvail, value: any) => {
    setAvailability((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
    );
  };

  const applyToAll = (idx: number) => {
    const src = availability[idx];
    Alert.alert(
      'Aplicar horarios',
      `¿Aplicar los horarios de ${DAYS_LABELS[src.dayOfWeek]} a todos los días disponibles?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => setAvailability((prev) =>
            prev.map((d) => d.isAvailable && d.dayOfWeek !== src.dayOfWeek
              ? { ...d, startTime: src.startTime, endTime: src.endTime, startTime2: src.startTime2, endTime2: src.endTime2 }
              : d
            )
          ),
        },
      ]
    );
  };

  const toggleShift2 = (idx: number) => {
    const day = availability[idx];
    if (day.startTime2 !== null) {
      setAvailability((prev) =>
        prev.map((d, i) => i === idx ? { ...d, endTime: '20:30', startTime2: null, endTime2: null } : d)
      );
    } else {
      setAvailability((prev) =>
        prev.map((d, i) => i === idx ? { ...d, endTime: '12:00', startTime2: '12:30', endTime2: '20:30' } : d)
      );
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Datos incompletos', 'Nombre y apellido son obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const prof = await adminApi.createProfessional({
          tenantId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
          serviceIds: selectedServiceIds,
        });
        await adminApi.updateProfessionalAvailability(prof.id, tenantId, availability);
      } else {
        await adminApi.updateProfessional(professionalId!, tenantId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
          serviceIds: selectedServiceIds,
        });
        await adminApi.updateProfessionalAvailability(professionalId!, tenantId, availability);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profesional</Text>
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
        <Text style={styles.title}>{isNew ? 'Nuevo profesional' : 'Editar profesional'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>DATOS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input} value={firstName} onChangeText={setFirstName}
                placeholder="Valeria" placeholderTextColor="#d1d5db"
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Apellido *</Text>
              <TextInput
                style={styles.input} value={lastName} onChangeText={setLastName}
                placeholder="García" placeholderTextColor="#d1d5db"
              />
            </View>
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Bio (opcional)</Text>
            <TextInput
              style={[styles.input, { height: 64, textAlignVertical: 'top' }]}
              value={bio} onChangeText={setBio}
              placeholder="Especialista en manicura y kapping"
              placeholderTextColor="#d1d5db" multiline
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>SERVICIOS QUE REALIZA</Text>
        <View style={styles.card}>
          {allServices.length === 0 ? (
            <Text style={styles.emptyServices}>No hay servicios cargados aún</Text>
          ) : (
            allServices.map((svc, idx) => {
              const selected = selectedServiceIds.includes(svc.id);
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceRow, idx < allServices.length - 1 && styles.serviceRowBorder]}
                  onPress={() => toggleService(svc.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceEmoji}>{svc.emoji ?? '✨'}</Text>
                    <View>
                      <Text style={styles.serviceName}>{svc.name}</Text>
                      <Text style={styles.serviceMeta}>{svc.durationMin} min · ${Number(svc.price).toLocaleString('es-AR')}</Text>
                    </View>
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>DISPONIBILIDAD SEMANAL</Text>
        <View style={styles.card}>
          {availability.map((day, idx) => (
            <View key={day.dayOfWeek} style={[styles.dayBlock, idx < 6 && styles.dayBlockBorder]}>
              {/* Fila principal: toggle + nombre + turno 1 */}
              <View style={styles.dayRow}>
                <View style={styles.dayLeft}>
                  <Switch
                    value={day.isAvailable}
                    onValueChange={(v) => setAvailDay(idx, 'isAvailable', v)}
                    trackColor={{ false: '#e5e7eb', true: colors.primaryLight }}
                    thumbColor={day.isAvailable ? colors.primary : '#9ca3af'}
                  />
                  <Text style={[styles.dayName, !day.isAvailable && styles.dayNameOff]}>
                    {DAYS_LABELS[day.dayOfWeek]}
                  </Text>
                </View>

                {day.isAvailable ? (
                  <View style={styles.shiftRow}>
                    <TextInput
                      style={styles.timeInput}
                      value={day.startTime}
                      onChangeText={(v) => setAvailDay(idx, 'startTime', v)}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                    <Text style={styles.timeSep}>–</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={day.endTime}
                      onChangeText={(v) => setAvailDay(idx, 'endTime', v)}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </View>
                ) : (
                  <Text style={styles.closedText}>Libre</Text>
                )}
              </View>

              {/* Segundo turno */}
              {day.isAvailable && (
                <>
                  {day.startTime2 !== null ? (
                    <View style={styles.shift2Row}>
                      <View style={styles.shift2Spacer}>
                        <TouchableOpacity onPress={() => toggleShift2(idx)} style={styles.removeShift2}>
                          <Text style={styles.removeShift2Text}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.shift2Label}>Tarde</Text>
                      </View>
                      <View style={styles.shiftRow}>
                        <TextInput
                          style={styles.timeInput}
                          value={day.startTime2 ?? ''}
                          onChangeText={(v) => setAvailDay(idx, 'startTime2', v)}
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                        />
                        <Text style={styles.timeSep}>–</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={day.endTime2 ?? ''}
                          onChangeText={(v) => setAvailDay(idx, 'endTime2', v)}
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                        />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => toggleShift2(idx)} style={styles.addShift2Btn}>
                      <Text style={styles.addShift2Text}>+ turno tarde</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => applyToAll(idx)} style={styles.applyAllBtn}>
                    <Text style={styles.applyAllText}>Aplicar a todos los días</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar cambios</Text>
          }
        </TouchableOpacity>
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
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: 'row' },
  inputWrap: { marginBottom: spacing.md },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e5e7eb',
  },

  dayBlock: { paddingVertical: 10 },
  dayBlockBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f5' },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLeft: { flexDirection: 'row', alignItems: 'center', width: 90 },
  dayName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginLeft: spacing.sm },
  dayNameOff: { color: '#9ca3af' },

  shiftRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: {
    backgroundColor: '#f4f3ff', borderRadius: radius.sm,
    paddingHorizontal: 6, paddingVertical: 6,
    fontSize: 14, fontWeight: '600', color: colors.primary,
    textAlign: 'center', width: 62,
    borderWidth: 1, borderColor: '#e0ddff',
  },
  timeSep: { fontSize: 14, color: '#9ca3af', marginHorizontal: 6 },
  closedText: { fontSize: 13, color: '#9ca3af' },

  shift2Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  shift2Spacer: { width: 90, flexDirection: 'row', alignItems: 'center' },
  shift2Label: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginLeft: 4 },
  removeShift2: { padding: 4 },
  removeShift2Text: { fontSize: 13, color: '#dc2626', fontWeight: '700' },

  addShift2Btn: { paddingLeft: 90, paddingTop: 6, paddingBottom: 2 },
  addShift2Text: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  applyAllBtn: { paddingLeft: 90, paddingTop: 4, paddingBottom: 2 },
  applyAllText: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'underline' },

  serviceRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 12,
  },
  serviceRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f5' },
  serviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  serviceEmoji: { fontSize: 20, marginRight: spacing.md },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  serviceMeta: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyServices: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: spacing.md },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
