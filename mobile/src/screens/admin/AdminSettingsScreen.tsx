import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminSettings'> };

export function AdminSettingsScreen({ navigation, route }: Props) {
  const { tenantId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getTenant(tenantId);
      setName(data.name ?? '');
      setCity(data.city ?? '');
      setPhone(data.phone ?? '');
      setAddress(data.address ?? '');
      setInstagram(data.instagram ?? '');
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Datos incompletos', 'El nombre del negocio es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateTenant(tenantId, {
        name: name.trim(),
        city: city.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        instagram: instagram.trim() || undefined,
      });
      Alert.alert('Guardado', 'Configuración actualizada');
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
          <Text style={styles.title}>Configuración</Text>
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
        <Text style={styles.title}>Configuración del negocio</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>DATOS DEL NEGOCIO</Text>
        <View style={styles.card}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Nombre del negocio *</Text>
            <TextInput
              style={styles.input} value={name} onChangeText={setName}
              placeholder="Studio Lumière" placeholderTextColor="#d1d5db"
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Ciudad</Text>
            <TextInput
              style={styles.input} value={city} onChangeText={setCity}
              placeholder="Buenos Aires" placeholderTextColor="#d1d5db"
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={styles.input} value={address} onChangeText={setAddress}
              placeholder="Av. Corrientes 1234" placeholderTextColor="#d1d5db"
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Teléfono de contacto</Text>
            <TextInput
              style={styles.input} value={phone} onChangeText={setPhone}
              placeholder="+54 11 1234-5678" placeholderTextColor="#d1d5db"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Instagram (sin @)</Text>
            <TextInput
              style={styles.input} value={instagram} onChangeText={setInstagram}
              placeholder="studiolumiere.ok" placeholderTextColor="#d1d5db"
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar configuración</Text>
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
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
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
