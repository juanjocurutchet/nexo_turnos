import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { Professional } from '../../types';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { useBookingStore } from '../../store/bookingStore';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'SelectProfessional'> };

export function SelectProfessionalScreen({ navigation, route }: Props) {
  const { tenant, service } = route.params;
  const { setProfessional } = useBookingStore();
  const [selected, setSelected] = useState<string | null>(null);

  // Filtrar solo profesionales que realizan este servicio
  const available = tenant.professionals.filter((p) =>
    p.services.some((ps) => ps.service.id === service.id),
  );

  const handleContinue = () => {
    const prof = selected
      ? available.find((p) => p.id === selected) ?? null
      : null;
    setProfessional(prof);
    navigation.navigate('SelectDateTime', {
      tenant,
      service,
      professional: prof ?? available[0],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Elegí tu profesional</Text>
        <Text style={styles.subtitle}>{service.name} · {service.durationMin} min</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.sectionLabel}>ESPECIALISTAS DISPONIBLES</Text>

        {/* Opción "Sin preferencia" */}
        <TouchableOpacity
          style={[styles.profCard, selected === 'any' && styles.profCardSelected]}
          onPress={() => setSelected('any')}
          activeOpacity={0.85}
        >
          <View style={[styles.profAvatar, { backgroundColor: colors.bgInput }]}>
            <Text style={{ fontSize: 22, color: colors.textMuted }}>?</Text>
          </View>
          <View style={styles.profInfo}>
            <Text style={styles.profName}>Sin preferencia</Text>
            <Text style={styles.profRole}>Asignar automáticamente</Text>
          </View>
          <View style={[styles.radio, selected === 'any' && styles.radioSelected]}>
            {selected === 'any' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {available.map((prof) => (
          <TouchableOpacity
            key={prof.id}
            style={[styles.profCard, selected === prof.id && styles.profCardSelected]}
            onPress={() => setSelected(prof.id)}
            activeOpacity={0.85}
          >
            <View style={[styles.profAvatar, { backgroundColor: prof.color + '30' }]}>
              <Text style={{ fontSize: 26 }}>👩</Text>
            </View>
            <View style={styles.profInfo}>
              <Text style={styles.profName}>{prof.firstName} {prof.lastName}</Text>
              {prof.bio && <Text style={styles.profRole}>{prof.bio}</Text>}
            </View>
            <View style={[styles.radio, selected === prof.id && styles.radioSelected]}>
              {selected === prof.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.85}>
          <View style={styles.footerBtn}>
            <Text style={styles.footerBtnText}>Elegir fecha y horario →</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7ff' },
  header: {
    paddingTop: 60, paddingBottom: 24, paddingHorizontal: spacing.xl,
    backgroundColor: '#4a0e8f',
  },
  back: { marginBottom: spacing.md },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 28 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  body: { flex: 1, padding: spacing.xl },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1, marginBottom: spacing.md, textTransform: 'uppercase',
  },

  profCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.lg, flexDirection: 'row',
    alignItems: 'center', marginBottom: spacing.sm, borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  profCardSelected: { borderColor: colors.primary },

  profAvatar: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  profInfo: { flex: 1 },
  profName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  profRole: { fontSize: 12, color: '#9ca3af' },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + BOTTOM_INSET,
    backgroundColor: 'rgba(248,247,255,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  footerBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center',
    backgroundColor: colors.primary,
  },
  footerBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
