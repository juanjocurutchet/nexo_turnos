import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, StatusBar, Image,
} from 'react-native';
import { RootStackParamList, Tenant, Service } from '../../types';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { tenantApi } from '../../services/api';
import { useBookingStore } from '../../store/bookingStore';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'TenantProfile'> };

const SERVICE_ICONS: Record<string, { bg: string }> = {
  '💅': { bg: '#fce7f3' },
  '✨': { bg: '#ede9fe' },
  '🧖': { bg: '#dbeafe' },
  '💆': { bg: '#d1fae5' },
  '💁': { bg: '#fef3c7' },
  '🧴': { bg: '#d1fae5' },
};

export function TenantProfileScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const { setTenant: storeTenant, setService } = useBookingStore();

  useEffect(() => {
    tenantApi.getPublicProfile(slug)
      .then((data) => { setTenant(data); storeTenant(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleContinue = () => {
    if (!tenant || !selected) return;
    const service = tenant.services.find((s) => s.id === selected)!;
    setService(service);
    navigation.navigate('SelectProfessional', { tenant, service });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tenant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.textSecondary }}>Local no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + BOTTOM_INSET }}>

        <View style={styles.header}>
          {tenant.logoUrl
            ? <Image source={{ uri: tenant.logoUrl }} style={styles.logoImage} resizeMode="contain" />
            : (
              <View style={styles.avatar}>
                <Text style={{ fontSize: 36 }}>💅</Text>
              </View>
            )
          }
          <Text style={styles.tenantName}>{tenant.name}</Text>
          <Text style={styles.tenantCity}>{tenant.city}</Text>

          <View style={styles.rating}>
            <Text style={styles.ratingStars}>★ 4.9</Text>
            <Text style={styles.ratingCount}> (284 reseñas)</Text>
          </View>

          <View style={styles.chips}>
            {['Uñas', 'Depilación', 'Faciales', 'Maquillaje'].map((tag) => (
              <View key={tag} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>¿Qué servicio necesitás?</Text>

          <TouchableOpacity
            style={styles.adminLink}
            onPress={() => navigation.navigate('AdminHome', { tenantId: tenant.id, tenantName: tenant.name })}
          >
            <Text style={styles.adminLinkText}>Acceso administrador</Text>
          </TouchableOpacity>

          {tenant.services.map((service) => {
            const isSelected = selected === service.id;
            const iconStyle = SERVICE_ICONS[service.emoji ?? '💅'] ?? { bg: '#f3f4f6' };

            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => setSelected(service.id)}
                style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                activeOpacity={0.85}
              >
                <View style={[styles.serviceIcon, { backgroundColor: iconStyle.bg }]}>
                  <Text style={{ fontSize: 22 }}>{service.emoji ?? '✨'}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDesc}>{service.description}</Text>
                  )}
                </View>
                <View style={styles.serviceRight}>
                  <Text style={styles.servicePrice}>
                    ${Number(service.price).toLocaleString('es-AR')}
                  </Text>
                  <Text style={styles.serviceTime}>⏱ {service.durationMin} min</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer sticky */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <View style={[styles.footerBtn, !selected && styles.footerBtnDisabled]}>
            <Text style={styles.footerBtnText}>Elegir fecha y horario →</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingTop: 60, paddingBottom: 28, paddingHorizontal: spacing.xl,
    backgroundColor: '#4a0e8f',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 22 },
  logoImage: { width: 110, height: 110, marginBottom: spacing.lg },
  tenantName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  tenantCity: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: spacing.sm },
  rating: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  ratingStars: { fontSize: 13, color: '#fbbf24', fontWeight: '700' },
  ratingCount: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    marginRight: spacing.sm, marginBottom: spacing.xs,
  },
  chipText: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },

  body: { padding: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  serviceIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  serviceDesc: { fontSize: 12, color: '#9ca3af' },
  serviceRight: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  serviceTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + BOTTOM_INSET,
    backgroundColor: 'rgba(15,15,19,0.95)',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center',
    backgroundColor: colors.primary,
  },
  footerBtnDisabled: { backgroundColor: '#4b5563' },
  footerBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },

  adminLink: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  adminLinkText: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'underline' },
});
