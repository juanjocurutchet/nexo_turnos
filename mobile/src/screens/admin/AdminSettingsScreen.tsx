import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const [facebook, setFacebook] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getTenant(tenantId);
      setName(data.name ?? '');
      setCity(data.city ?? '');
      setPhone(data.phone ?? '');
      setAddress(data.address ?? '');
      setInstagram(data.instagram ?? '');
      setFacebook(data.facebook ?? '');
      setWhatsappNumber(data.whatsappNumber ?? '');
      setLogoUri(data.logoUrl ?? null);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar el logo');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      setLogoUri(dataUri);
    }
  };

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
        facebook: facebook.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        logoUrl: logoUri ?? undefined,
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

        {/* Logo */}
        <Text style={styles.sectionLabel}>LOGO DEL NEGOCIO</Text>
        <View style={styles.card}>
          <View style={styles.logoSection}>
            <TouchableOpacity onPress={pickLogo} style={styles.logoContainer} activeOpacity={0.8}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderIcon}>🏪</Text>
                </View>
              )}
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>✎</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.logoTextWrap}>
              <Text style={styles.logoHint}>Tocá para cambiar el logo</Text>
              <Text style={styles.logoHintSub}>Se muestra en la página de tu negocio. Usá una imagen cuadrada.</Text>
            </View>
          </View>
        </View>

        {/* Datos del negocio */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>DATOS DEL NEGOCIO</Text>
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
              placeholder="mgestetica.nails" placeholderTextColor="#d1d5db"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Facebook (nombre de página)</Text>
            <TextInput
              style={styles.input} value={facebook} onChangeText={setFacebook}
              placeholder="MG Estética Integral" placeholderTextColor="#d1d5db"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* WhatsApp */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>MENSAJES AUTOMÁTICOS</Text>
        <View style={styles.card}>
          <View style={styles.whatsappInfo}>
            <Text style={styles.whatsappInfoIcon}>💬</Text>
            <Text style={styles.whatsappInfoText}>
              Nexo Turnos enviará mensajes automáticos por WhatsApp a tus clientes: confirmación al reservar, recordatorio 48 hs antes, recordatorio 2 hs antes y notificación si se cancela el turno.
            </Text>
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Número de WhatsApp del negocio</Text>
            <TextInput
              style={styles.input} value={whatsappNumber} onChangeText={setWhatsappNumber}
              placeholder="+5492215001234" placeholderTextColor="#d1d5db"
              keyboardType="phone-pad"
            />
            <Text style={styles.inputHint}>Con código de país y área, sin espacios ni guiones. Ej: +5492215001234</Text>
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

  // Logo
  logoSection: { flexDirection: 'row', alignItems: 'center' },
  logoContainer: { position: 'relative', marginRight: spacing.lg },
  logoImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#f0eeff' },
  logoPlaceholder: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: '#f0eeff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#e0ddff', borderStyle: 'dashed',
  },
  logoPlaceholderIcon: { fontSize: 32 },
  logoBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  logoBadgeText: { fontSize: 12, color: '#fff' },
  logoTextWrap: { flex: 1 },
  logoHint: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  logoHintSub: { fontSize: 12, color: '#9ca3af', lineHeight: 16 },

  inputWrap: { marginBottom: spacing.md },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 14, color: '#1a1a2e', borderWidth: 1, borderColor: '#e5e7eb',
  },
  inputHint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  // WhatsApp info box
  whatsappInfo: {
    flexDirection: 'row', backgroundColor: '#f0fdf4', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start',
  },
  whatsappInfoIcon: { fontSize: 20, marginRight: spacing.sm },
  whatsappInfoText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
