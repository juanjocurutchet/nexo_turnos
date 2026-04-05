import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminServices'> };

export function AdminServicesScreen({ navigation, route }: Props) {
  const { tenantId } = route.params;
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setServices(await adminApi.getServices(tenantId)); }
    catch { setServices([]); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = (svc: any) => {
    Alert.alert(
      'Desactivar servicio',
      `¿Desactivar "${svc.name}"? No aparecerá en los turnos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar', style: 'destructive',
          onPress: async () => { await adminApi.deactivateService(svc.id, tenantId); load(); },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Servicios</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {services.map((svc) => (
            <View key={svc.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.iconBox}>
                  <Text style={{ fontSize: 22 }}>{svc.emoji ?? '✨'}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.svcName}>{svc.name}</Text>
                  <Text style={styles.svcMeta}>
                    {svc.durationMin} min · ${Number(svc.price).toLocaleString('es-AR')}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('AdminServiceDetail', { tenantId, serviceId: svc.id })}
                >
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deactivateBtn}
                  onPress={() => handleDeactivate(svc)}
                >
                  <Text style={styles.deactivateBtnText}>Desactivar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AdminServiceDetail', { tenantId })}
          >
            <Text style={styles.addBtnText}>+ Agregar servicio</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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

  card: {
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconBox: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  info: { flex: 1 },
  svcName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  svcMeta: { fontSize: 13, color: '#9ca3af' },

  cardActions: { flexDirection: 'row' },
  editBtn: {
    flex: 1, backgroundColor: '#ede9fe', borderRadius: radius.md,
    paddingVertical: 8, alignItems: 'center', marginRight: spacing.sm,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  deactivateBtn: {
    flex: 1, backgroundColor: '#fee2e2', borderRadius: radius.md,
    paddingVertical: 8, alignItems: 'center',
  },
  deactivateBtnText: { fontSize: 13, fontWeight: '600', color: '#dc2626' },

  addBtn: {
    borderRadius: radius.xl, paddingVertical: spacing.lg,
    alignItems: 'center', borderWidth: 2,
    borderColor: colors.primary, borderStyle: 'dashed', marginTop: spacing.sm,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
