import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminProfessionals'> };

export function AdminProfessionalsScreen({ navigation, route }: Props) {
  const { tenantId } = route.params;
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getProfessionals(tenantId);
      setProfessionals(data);
    } catch {
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = (prof: any) => {
    Alert.alert(
      'Desactivar profesional',
      `¿Desactivar a ${prof.firstName} ${prof.lastName}? No aparecerá más en los turnos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            await adminApi.deactivateProfessional(prof.id, tenantId);
            load();
          },
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
        <Text style={styles.title}>Profesionales</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {professionals.map((prof) => (
            <View key={prof.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: prof.color + '30' }]}>
                  <Text style={{ fontSize: 22 }}>👩</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{prof.firstName} {prof.lastName}</Text>
                  {prof.bio && <Text style={styles.bio}>{prof.bio}</Text>}
                  <Text style={styles.services}>
                    {prof.services.map((ps: any) => ps.service.name).join(', ')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('AdminProfessionalDetail', { tenantId, professionalId: prof.id })}
                >
                  <Text style={styles.editBtnText}>Editar / Horarios</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deactivateBtn}
                  onPress={() => handleDeactivate(prof)}
                >
                  <Text style={styles.deactivateBtnText}>Desactivar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AdminProfessionalDetail', { tenantId })}
          >
            <Text style={styles.addBtnText}>+ Agregar profesional</Text>
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
  avatar: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  bio: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  services: { fontSize: 12, color: colors.primary },

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
    borderColor: colors.primary, borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
