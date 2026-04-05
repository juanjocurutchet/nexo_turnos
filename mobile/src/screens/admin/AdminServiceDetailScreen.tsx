import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminServiceDetail'> };

const EMOJIS = ['💅', '✨', '🧖', '💆', '💁', '🧴', '💇', '🪮', '💋', '🎨'];

export function AdminServiceDetailScreen({ navigation, route }: Props) {
  const { tenantId, serviceId } = route.params;
  const isNew = !serviceId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMin, setDurationMin] = useState('60');
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('✨');

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const data = await adminApi.getServices(tenantId);
      const svc = data.find((s: any) => s.id === serviceId);
      if (svc) {
        setName(svc.name);
        setDescription(svc.description ?? '');
        setDurationMin(String(svc.durationMin));
        setPrice(String(svc.price));
        setEmoji(svc.emoji ?? '✨');
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el servicio');
    } finally {
      setLoading(false);
    }
  }, [isNew, serviceId, tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !durationMin.trim()) {
      Alert.alert('Datos incompletos', 'Nombre, precio y duración son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        durationMin: Number(durationMin),
        price: Number(price),
        emoji,
      };
      if (isNew) {
        await adminApi.createService({ tenantId, ...payload });
      } else {
        await adminApi.updateService(serviceId!, tenantId, payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el servicio');
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
          <Text style={styles.title}>Servicio</Text>
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
        <Text style={styles.title}>{isNew ? 'Nuevo servicio' : 'Editar servicio'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>ÍCONO</Text>
        <View style={styles.card}>
          <View style={styles.emojiRow}>
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, emoji === e && styles.emojiBtnSelected]}
                onPress={() => setEmoji(e)}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>DATOS</Text>
        <View style={styles.card}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Nombre del servicio *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Manicura básica" placeholderTextColor="#d1d5db" />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, { height: 64, textAlignVertical: 'top' }]}
              value={description} onChangeText={setDescription}
              placeholder="Incluye limado, cutícula y esmaltado"
              placeholderTextColor="#d1d5db" multiline
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.inputLabel}>Duración (min) *</Text>
              <TextInput
                style={styles.input} value={durationMin} onChangeText={setDurationMin}
                keyboardType="number-pad" placeholder="60" placeholderTextColor="#d1d5db"
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Precio (ARS) *</Text>
              <TextInput
                style={styles.input} value={price} onChangeText={setPrice}
                keyboardType="number-pad" placeholder="5000" placeholderTextColor="#d1d5db"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar servicio</Text>
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

  emojiRow: { flexDirection: 'row', flexWrap: 'wrap' },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm, marginBottom: spacing.sm, backgroundColor: '#f4f3ff',
  },
  emojiBtnSelected: { backgroundColor: '#ede9fe', borderWidth: 2, borderColor: colors.primary },

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
