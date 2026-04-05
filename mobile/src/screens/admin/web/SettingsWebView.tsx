import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { adminApi } from '../../../services/api';

const W = StyleSheet.create;

export function SettingsWebView({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getTenant(tenantId);
      setName(data.name ?? '');
      setCity(data.city ?? '');
      setAddress(data.address ?? '');
      setPhone(data.phone ?? '');
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
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
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
      setLogoUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
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

  if (loading) return <ActivityIndicator color="#7c3aed" style={{ margin: 40 }} />;

  return (
    <View style={s.root}>
      <View style={s.twoCol}>
        {/* Logo + datos del negocio */}
        <View style={s.col}>
          <Text style={s.sectionLabel}>LOGO DEL NEGOCIO</Text>
          <View style={s.card}>
            <View style={s.logoRow}>
              <TouchableOpacity onPress={pickLogo} style={s.logoBtn} activeOpacity={0.8}>
                {logoUri
                  ? <Image source={{ uri: logoUri }} style={s.logoImg} />
                  : <View style={s.logoPlaceholder}><Text style={{ fontSize: 32 }}>🏪</Text></View>
                }
                <View style={s.logoBadge}><Text style={{ color: '#fff', fontSize: 11 }}>✎</Text></View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={s.logoHint}>Tocá para cambiar el logo</Text>
                <Text style={s.logoHintSub}>Imagen cuadrada, se muestra en la página del negocio</Text>
              </View>
            </View>
          </View>

          <Text style={[s.sectionLabel, { marginTop: 20 }]}>DATOS DEL NEGOCIO</Text>
          <View style={s.card}>
            <Field label="Nombre del negocio *" value={name} onChange={setName} placeholder="MG Estética Integral" />
            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Field label="Ciudad" value={city} onChange={setCity} placeholder="Las Flores" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Teléfono de contacto" value={phone} onChange={setPhone} placeholder="+54 11 1234-5678" />
              </View>
            </View>
            <Field label="Dirección" value={address} onChange={setAddress} placeholder="Av. Corrientes 1234" />
          </View>
        </View>

        {/* Redes + WhatsApp */}
        <View style={s.col}>
          <Text style={s.sectionLabel}>REDES SOCIALES</Text>
          <View style={s.card}>
            <Field label="Instagram (sin @)" value={instagram} onChange={setInstagram} placeholder="mgestetica.nails" autoCapitalize="none" />
            <Field label="Facebook (nombre de página)" value={facebook} onChange={setFacebook} placeholder="MG Estética Integral" autoCapitalize="none" />
          </View>

          <Text style={[s.sectionLabel, { marginTop: 20 }]}>MENSAJES AUTOMÁTICOS</Text>
          <View style={s.card}>
            <View style={s.whatsappInfo}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>💬</Text>
              <Text style={s.whatsappInfoText}>
                Nexo Turnos enviará mensajes automáticos por WhatsApp: confirmación al reservar, recordatorio 48 hs antes, recordatorio 2 hs antes, y cancelaciones.
              </Text>
            </View>
            <Field
              label="Número de WhatsApp del negocio"
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              placeholder="+5492215001234"
              hint="Con código de país y área, sin espacios. Ej: +5492215001234"
            />
          </View>

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>Guardar configuración</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, hint, autoCapitalize }: any) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#4b5563"
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
      {hint && <Text style={s.fieldHint}>{hint}</Text>}
    </View>
  );
}

const s = W({
  root: { flex: 1 },
  twoCol: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex: 1, marginRight: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 8 },
  card: {
    backgroundColor: '#18181f', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#2a2a35', marginBottom: 4,
  },
  row: { flexDirection: 'row' },

  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBtn: { position: 'relative', marginRight: 16 },
  logoImg: { width: 72, height: 72, borderRadius: 14 },
  logoPlaceholder: {
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: '#2a2a35', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#3a3a45',
  },
  logoBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#18181f',
  },
  logoHint: { fontSize: 13, fontWeight: '600', color: '#e5e7eb', marginBottom: 4 },
  logoHintSub: { fontSize: 11, color: '#6b7280', lineHeight: 16 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#0f0f13', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#f9fafb',
    borderWidth: 1, borderColor: '#2a2a35',
    outlineStyle: 'none',
  } as any,
  fieldHint: { fontSize: 11, color: '#4b5563', marginTop: 4 },

  whatsappInfo: {
    flexDirection: 'row', backgroundColor: 'rgba(5,150,105,0.08)',
    borderRadius: 10, padding: 12, marginBottom: 14, alignItems: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(5,150,105,0.15)',
  },
  whatsappInfoText: { flex: 1, fontSize: 12, color: '#9ca3af', lineHeight: 18 },

  saveBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
