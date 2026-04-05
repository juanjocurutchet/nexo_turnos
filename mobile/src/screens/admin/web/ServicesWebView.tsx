import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { adminApi } from '../../../services/api';

const EMOJIS = ['💅', '✨', '🧖', '💆', '💁', '🧴', '💇', '🪮', '💋', '🎨'];

export function ServicesWebView({ tenantId }: { tenantId: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMin, setDurationMin] = useState('60');
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setServices(await adminApi.getServices(tenantId)); }
    catch { setServices([]); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setSelected(null);
    setIsNew(true);
    setName(''); setDescription(''); setDurationMin('60'); setPrice(''); setEmoji('✨');
  };

  const openEdit = (svc: any) => {
    setSelected(svc);
    setIsNew(false);
    setName(svc.name);
    setDescription(svc.description ?? '');
    setDurationMin(String(svc.durationMin));
    setPrice(String(Number(svc.price)));
    setEmoji(svc.emoji ?? '✨');
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !durationMin.trim()) {
      Alert.alert('Datos incompletos', 'Nombre, precio y duración son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined, durationMin: Number(durationMin), price: Number(price), emoji };
      if (isNew) {
        await adminApi.createService({ tenantId, ...payload });
      } else {
        await adminApi.updateService(selected.id, tenantId, payload);
      }
      await load();
      setIsNew(false); setSelected(null);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (svc: any) => {
    Alert.alert('Desactivar servicio', `¿Desactivar "${svc.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: async () => { await adminApi.deactivateService(svc.id, tenantId); load(); setSelected(null); } },
    ]);
  };

  return (
    <View style={s.root}>
      {/* Lista */}
      <View style={s.listPanel}>
        <TouchableOpacity style={s.newBtn} onPress={openNew}>
          <Text style={s.newBtnText}>+ Nuevo servicio</Text>
        </TouchableOpacity>
        {loading
          ? <ActivityIndicator color="#7c3aed" style={{ margin: 20 }} />
          : services.map(svc => (
            <TouchableOpacity
              key={svc.id}
              style={[s.listItem, selected?.id === svc.id && s.listItemActive]}
              onPress={() => openEdit(svc)}
            >
              <Text style={s.listEmoji}>{svc.emoji ?? '✨'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.listName}>{svc.name}</Text>
                <Text style={s.listMeta}>{svc.durationMin} min · ${Number(svc.price).toLocaleString('es-AR')}</Text>
              </View>
            </TouchableOpacity>
          ))
        }
      </View>

      {/* Detalle / form */}
      {(isNew || selected) ? (
        <ScrollView style={s.detailPanel} contentContainerStyle={{ padding: 24 }}>
          <Text style={s.detailTitle}>{isNew ? 'Nuevo servicio' : 'Editar servicio'}</Text>

          <Text style={s.sectionLabel}>ÍCONO</Text>
          <View style={s.card}>
            <View style={s.emojiRow}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiBtn, emoji === e && s.emojiBtnSel]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={[s.sectionLabel, { marginTop: 20 }]}>DATOS</Text>
          <View style={s.card}>
            <Field label="Nombre del servicio *" value={name} onChange={setName} placeholder="Manicura básica" />
            <Field label="Descripción (opcional)" value={description} onChange={setDescription} placeholder="Incluye limado, cutícula y esmaltado" multiline />
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Field label="Duración (min) *" value={durationMin} onChange={setDurationMin} placeholder="60" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Precio (ARS) *" value={price} onChange={setPrice} placeholder="5000" keyboardType="number-pad" />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Guardar servicio</Text>}
            </TouchableOpacity>
            {!isNew && (
              <TouchableOpacity style={s.deactivateBtn} onPress={() => handleDeactivate(selected)}>
                <Text style={s.deactivateBtnText}>Desactivar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setSelected(null); setIsNew(false); }}>
              <Text style={s.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={s.emptyDetail}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>✨</Text>
          <Text style={s.emptyText}>Seleccioná un servicio para editar{'\n'}o creá uno nuevo</Text>
        </View>
      )}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline, keyboardType }: any) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.fieldInput, multiline && { height: 64, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#4b5563" multiline={multiline} keyboardType={keyboardType}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  listPanel: { width: 260, backgroundColor: '#18181f', borderRightWidth: 1, borderRightColor: '#2a2a35' },
  newBtn: {
    margin: 12, padding: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#7c3aed', borderStyle: 'dashed', alignItems: 'center',
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
  listItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a35',
  },
  listItemActive: { backgroundColor: 'rgba(124,58,237,0.15)' },
  listEmoji: { fontSize: 22, marginRight: 12 },
  listName: { fontSize: 13, fontWeight: '600', color: '#e5e7eb', marginBottom: 2 },
  listMeta: { fontSize: 11, color: '#6b7280' },

  detailPanel: { flex: 1, backgroundColor: '#0f0f13' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb', marginBottom: 20 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 8 },
  card: {
    backgroundColor: '#18181f', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#2a2a35',
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap' },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 8, backgroundColor: '#2a2a35',
  },
  emojiBtnSel: { backgroundColor: 'rgba(124,58,237,0.3)', borderWidth: 2, borderColor: '#7c3aed' },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#0f0f13', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#f9fafb', borderWidth: 1, borderColor: '#2a2a35',
    outlineStyle: 'none',
  } as any,

  saveBtn: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deactivateBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', marginRight: 8 },
  deactivateBtnText: { fontSize: 13, fontWeight: '600', color: '#f87171' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#2a2a35', borderRadius: 10 },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },

  emptyDetail: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#4b5563', textAlign: 'center', lineHeight: 22 },
});
