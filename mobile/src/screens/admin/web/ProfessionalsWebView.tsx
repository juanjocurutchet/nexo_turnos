import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch, ScrollView } from 'react-native';
import { adminApi } from '../../../services/api';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type DayAvail = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startTime2: string | null;
  endTime2: string | null;
  isAvailable: boolean;
};

const DEFAULT_AVAIL: DayAvail[] = DAYS.map((_, i) => ({
  dayOfWeek: i, startTime: '09:00', endTime: '12:00',
  startTime2: null, endTime2: null, isAvailable: i !== 0,
}));

export function ProfessionalsWebView({ tenantId }: { tenantId: string }) {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState<DayAvail[]>(DEFAULT_AVAIL);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const [profs, svcs] = await Promise.all([adminApi.getProfessionals(tenantId), adminApi.getServices(tenantId)]);
      setProfessionals(profs);
      setAllServices(svcs);
    } catch { setProfessionals([]); }
    finally { setLoadingList(false); }
  }, [tenantId]);

  useEffect(() => { loadList(); }, [loadList]);

  const openNew = () => {
    setSelectedId(null); setIsNew(true);
    setFirstName(''); setLastName(''); setBio('');
    setAvailability(DEFAULT_AVAIL); setSelectedServiceIds([]);
  };

  const openEdit = async (prof: any) => {
    setSelectedId(prof.id); setIsNew(false);
    setLoadingDetail(true);
    try {
      const data = await adminApi.getProfessional(prof.id, tenantId);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setBio(data.bio ?? '');
      setSelectedServiceIds(data.services?.map((ps: any) => ps.serviceId) ?? []);
      if (data.availability?.length) {
        setAvailability(DAYS.map((_, i) => {
          const found = data.availability.find((a: any) => a.dayOfWeek === i);
          return found ? { dayOfWeek: i, startTime: found.startTime, endTime: found.endTime, startTime2: found.startTime2 ?? null, endTime2: found.endTime2 ?? null, isAvailable: found.isAvailable } : DEFAULT_AVAIL[i];
        }));
      } else {
        setAvailability(DEFAULT_AVAIL);
      }
    } catch { Alert.alert('Error', 'No se pudo cargar el profesional'); }
    finally { setLoadingDetail(false); }
  };

  const setAvailDay = (idx: number, field: keyof DayAvail, value: any) =>
    setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));

  const toggleShift2 = (idx: number) => {
    const day = availability[idx];
    if (day.startTime2 !== null) {
      setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, endTime: '20:30', startTime2: null, endTime2: null } : d));
    } else {
      setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, endTime: '12:00', startTime2: '12:30', endTime2: '20:30' } : d));
    }
  };

  const applyToAll = (idx: number) => {
    const src = availability[idx];
    Alert.alert('Aplicar horarios', `¿Aplicar horarios de ${DAYS[src.dayOfWeek]} a todos los días disponibles?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aplicar', onPress: () => setAvailability(prev => prev.map(d => d.isAvailable && d.dayOfWeek !== src.dayOfWeek ? { ...d, startTime: src.startTime, endTime: src.endTime, startTime2: src.startTime2, endTime2: src.endTime2 } : d)) },
    ]);
  };

  const toggleService = (id: string) =>
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Datos incompletos', 'Nombre y apellido son obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const prof = await adminApi.createProfessional({ tenantId, firstName: firstName.trim(), lastName: lastName.trim(), bio: bio.trim(), serviceIds: selectedServiceIds });
        await adminApi.updateProfessionalAvailability(prof.id, tenantId, availability);
      } else {
        await adminApi.updateProfessional(selectedId!, tenantId, { firstName: firstName.trim(), lastName: lastName.trim(), bio: bio.trim(), serviceIds: selectedServiceIds });
        await adminApi.updateProfessionalAvailability(selectedId!, tenantId, availability);
      }
      await loadList();
      setIsNew(false); setSelectedId(null);
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    } finally { setSaving(false); }
  };

  const handleDeactivate = (prof: any) => {
    Alert.alert('Desactivar profesional', `¿Desactivar a ${prof.firstName} ${prof.lastName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: async () => { await adminApi.deactivateProfessional(prof.id, tenantId); loadList(); setSelectedId(null); } },
    ]);
  };

  const showPanel = isNew || selectedId !== null;

  return (
    <View style={s.root}>
      {/* Lista */}
      <View style={s.listPanel}>
        <TouchableOpacity style={s.newBtn} onPress={openNew}>
          <Text style={s.newBtnText}>+ Nuevo profesional</Text>
        </TouchableOpacity>
        {loadingList
          ? <ActivityIndicator color="#7c3aed" style={{ margin: 20 }} />
          : professionals.map(prof => (
            <TouchableOpacity
              key={prof.id}
              style={[s.listItem, selectedId === prof.id && s.listItemActive]}
              onPress={() => openEdit(prof)}
            >
              <View style={[s.listAvatar, { backgroundColor: (prof.color ?? '#7c3aed') + '30' }]}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.listName}>{prof.firstName} {prof.lastName}</Text>
                <Text style={s.listMeta} numberOfLines={1}>
                  {prof.services?.map((ps: any) => ps.service?.name).filter(Boolean).join(', ') || 'Sin servicios asignados'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        }
      </View>

      {/* Detalle */}
      {showPanel ? (
        loadingDetail ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : (
          <ScrollView style={s.detailPanel} contentContainerStyle={{ padding: 24 }}>
            <Text style={s.detailTitle}>{isNew ? 'Nuevo profesional' : `${firstName} ${lastName}`}</Text>

            {/* Datos */}
            <Text style={s.sectionLabel}>DATOS</Text>
            <View style={s.card}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Field label="Nombre *" value={firstName} onChange={setFirstName} placeholder="Valeria" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Apellido *" value={lastName} onChange={setLastName} placeholder="García" />
                </View>
              </View>
              <Field label="Bio (opcional)" value={bio} onChange={setBio} placeholder="Especialista en manicura y kapping" multiline />
            </View>

            {/* Servicios */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>SERVICIOS QUE REALIZA</Text>
            <View style={s.card}>
              {allServices.length === 0
                ? <Text style={s.emptyText}>No hay servicios cargados aún</Text>
                : allServices.map((svc, idx) => {
                  const sel = selectedServiceIds.includes(svc.id);
                  return (
                    <TouchableOpacity
                      key={svc.id}
                      style={[s.svcRow, idx < allServices.length - 1 && s.svcRowBorder]}
                      onPress={() => toggleService(svc.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.svcEmoji}>{svc.emoji ?? '✨'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.svcName}>{svc.name}</Text>
                        <Text style={s.svcMeta}>{svc.durationMin} min · ${Number(svc.price).toLocaleString('es-AR')}</Text>
                      </View>
                      <View style={[s.checkbox, sel && s.checkboxSel]}>
                        {sel && <Text style={s.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })
              }
            </View>

            {/* Disponibilidad */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>DISPONIBILIDAD SEMANAL</Text>
            <View style={s.card}>
              {availability.map((day, idx) => (
                <View key={day.dayOfWeek} style={[s.dayBlock, idx < 6 && s.dayBorder]}>
                  <View style={s.dayRow}>
                    <Switch
                      value={day.isAvailable}
                      onValueChange={v => setAvailDay(idx, 'isAvailable', v)}
                      trackColor={{ false: '#2a2a35', true: 'rgba(124,58,237,0.4)' }}
                      thumbColor={day.isAvailable ? '#7c3aed' : '#4b5563'}
                    />
                    <Text style={[s.dayName, !day.isAvailable && s.dayNameOff]}>{DAYS[day.dayOfWeek]}</Text>
                    {day.isAvailable ? (
                      <View style={s.shiftRow}>
                        <TimeInput value={day.startTime} onChange={v => setAvailDay(idx, 'startTime', v)} />
                        <Text style={s.sep}>–</Text>
                        <TimeInput value={day.endTime} onChange={v => setAvailDay(idx, 'endTime', v)} />
                      </View>
                    ) : (
                      <Text style={s.closedLabel}>Libre</Text>
                    )}
                  </View>

                  {day.isAvailable && (
                    <>
                      {day.startTime2 !== null ? (
                        <View style={s.shift2Row}>
                          <View style={s.shift2Left}>
                            <TouchableOpacity onPress={() => toggleShift2(idx)} style={s.removeBtn}>
                              <Text style={s.removeBtnText}>✕</Text>
                            </TouchableOpacity>
                            <Text style={s.shift2Label}>Tarde</Text>
                          </View>
                          <View style={s.shiftRow}>
                            <TimeInput value={day.startTime2 ?? ''} onChange={v => setAvailDay(idx, 'startTime2', v)} />
                            <Text style={s.sep}>–</Text>
                            <TimeInput value={day.endTime2 ?? ''} onChange={v => setAvailDay(idx, 'endTime2', v)} />
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

            {/* Actions */}
            <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 40 }}>
              <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Guardar cambios</Text>}
              </TouchableOpacity>
              {!isNew && (
                <TouchableOpacity style={s.deactivateBtn} onPress={() => handleDeactivate(professionals.find(p => p.id === selectedId))}>
                  <Text style={s.deactivateBtnText}>Desactivar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setSelectedId(null); setIsNew(false); }}>
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )
      ) : (
        <View style={s.emptyDetail}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
          <Text style={s.emptyDetailText}>Seleccioná un profesional para editar{'\n'}o agregá uno nuevo</Text>
        </View>
      )}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: any) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.fieldInput, multiline && { height: 64, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#4b5563" multiline={multiline}
      />
    </View>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      style={s.timeInput} value={value} onChangeText={onChange}
      keyboardType="numbers-and-punctuation" maxLength={5}
    />
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  listPanel: { width: 260, backgroundColor: '#18181f', borderRightWidth: 1, borderRightColor: '#2a2a35' },
  newBtn: { margin: 12, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#7c3aed', borderStyle: 'dashed', alignItems: 'center' },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a35' },
  listItemActive: { backgroundColor: 'rgba(124,58,237,0.15)' },
  listAvatar: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  listName: { fontSize: 13, fontWeight: '600', color: '#e5e7eb', marginBottom: 2 },
  listMeta: { fontSize: 11, color: '#6b7280' },

  detailPanel: { flex: 1, backgroundColor: '#0f0f13' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb', marginBottom: 20 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: '#18181f', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2a2a35' },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#0f0f13', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#f9fafb', borderWidth: 1, borderColor: '#2a2a35',
    outlineStyle: 'none',
  } as any,

  svcRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  svcRowBorder: { borderBottomWidth: 1, borderBottomColor: '#2a2a35' },
  svcEmoji: { fontSize: 20, marginRight: 12 },
  svcName: { fontSize: 13, fontWeight: '600', color: '#e5e7eb', marginBottom: 2 },
  svcMeta: { fontSize: 11, color: '#6b7280' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#3a3a45', alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 13, color: '#4b5563', textAlign: 'center', paddingVertical: 8 },

  dayBlock: { paddingVertical: 10 },
  dayBorder: { borderBottomWidth: 1, borderBottomColor: '#2a2a35' },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayName: { fontSize: 13, fontWeight: '600', color: '#e5e7eb', marginLeft: 10, width: 36 },
  dayNameOff: { color: '#4b5563' },
  closedLabel: { fontSize: 12, color: '#4b5563', marginLeft: 'auto' as any },

  shiftRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' as any },
  timeInput: {
    backgroundColor: '#2a2a35', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    fontSize: 13, fontWeight: '600', color: '#c084fc', textAlign: 'center', width: 54,
    borderWidth: 1, borderColor: '#3a3a45',
  },
  sep: { fontSize: 12, color: '#4b5563', marginHorizontal: 5 },

  shift2Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  shift2Left: { flexDirection: 'row', alignItems: 'center', width: 96 },
  shift2Label: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginLeft: 6 },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 11, color: '#f87171', fontWeight: '700' },

  addShift2: { paddingTop: 6, paddingBottom: 2, paddingLeft: 56 },
  addShift2Text: { fontSize: 11, color: '#7c3aed', fontWeight: '600' },
  applyAll: { paddingTop: 4, paddingBottom: 2, paddingLeft: 56 },
  applyAllText: { fontSize: 11, color: '#6b7280', textDecorationLine: 'underline' },

  saveBtn: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deactivateBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', marginRight: 8 },
  deactivateBtnText: { fontSize: 13, fontWeight: '600', color: '#f87171' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#2a2a35', borderRadius: 10 },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },

  emptyDetail: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyDetailText: { fontSize: 14, color: '#4b5563', textAlign: 'center', lineHeight: 22 },
});
