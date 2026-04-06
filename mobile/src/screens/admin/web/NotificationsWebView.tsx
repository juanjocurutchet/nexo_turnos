import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch, ScrollView } from 'react-native';
import { adminApi } from '../../../services/api';

type Rule = {
  id: string;
  trigger: string;
  isEnabled: boolean;
  offsetMinutes: number | null;
  message: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  BOOKING_CREATED: 'Al recibir una reserva',
  BOOKING_CONFIRMED: 'Al confirmar un turno',
  BOOKING_CANCELLED: 'Al cancelar un turno',
  REMINDER: 'Recordatorio',
};

const TRIGGER_ICONS: Record<string, string> = {
  BOOKING_CREATED: '📥',
  BOOKING_CONFIRMED: '✅',
  BOOKING_CANCELLED: '❌',
  REMINDER: '⏰',
};

const OFFSET_OPTIONS = [
  { label: '48 horas antes', value: -2880 },
  { label: '24 horas antes', value: -1440 },
  { label: '2 horas antes', value: -120 },
  { label: '1 hora antes', value: -60 },
];

const VARIABLES = ['{{clientName}}', '{{businessName}}', '{{serviceName}}', '{{date}}', '{{time}}'];

function offsetLabel(minutes: number | null): string {
  if (minutes === null) return '';
  const opt = OFFSET_OPTIONS.find((o) => o.value === minutes);
  if (opt) return opt.label;
  const abs = Math.abs(minutes);
  return abs >= 60 ? `${abs / 60}h antes` : `${abs} min antes`;
}

export function NotificationsWebView({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selected, setSelected] = useState<Rule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getNotificationRules(tenantId);
      setRules(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las reglas');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const updateSelected = (field: keyof Rule, value: any) => {
    if (!selected) return;
    const updated = { ...selected, [field]: value };
    setSelected(updated);
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const insertVariable = (variable: string) => {
    if (!selected) return;
    updateSelected('message', selected.message + variable);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updateNotificationRules(tenantId, rules);
      setRules(updated);
      Alert.alert('Guardado', 'Reglas de notificación actualizadas');
    } catch {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator color="#7c3aed" style={{ margin: 40 }} />;

  return (
    <View style={s.root}>
      {/* Lista de reglas */}
      <View style={s.listPanel}>
        <Text style={s.listTitle}>REGLAS</Text>
        {rules.map((rule) => (
          <TouchableOpacity
            key={rule.id}
            style={[s.ruleItem, selected?.id === rule.id && s.ruleItemActive]}
            onPress={() => setSelected(rule)}
          >
            <View style={s.ruleItemLeft}>
              <Text style={s.ruleIcon}>{TRIGGER_ICONS[rule.trigger]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.ruleName} numberOfLines={1}>{TRIGGER_LABELS[rule.trigger]}</Text>
                {rule.trigger === 'REMINDER' && (
                  <Text style={s.ruleMeta}>{offsetLabel(rule.offsetMinutes)}</Text>
                )}
              </View>
            </View>
            <Switch
              value={rule.isEnabled}
              onValueChange={(v) => {
                const updated = { ...rule, isEnabled: v };
                if (selected?.id === rule.id) setSelected(updated);
                setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
              }}
              trackColor={{ false: '#2a2a35', true: 'rgba(124,58,237,0.4)' }}
              thumbColor={rule.isEnabled ? '#7c3aed' : '#4b5563'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Editor */}
      {selected ? (
        <ScrollView style={s.editor} contentContainerStyle={{ padding: 24 }}>
          <View style={s.editorHeader}>
            <Text style={s.editorIcon}>{TRIGGER_ICONS[selected.trigger]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.editorTitle}>{TRIGGER_LABELS[selected.trigger]}</Text>
              {selected.trigger === 'REMINDER' && (
                <Text style={s.editorSub}>{offsetLabel(selected.offsetMinutes)}</Text>
              )}
            </View>
            <Switch
              value={selected.isEnabled}
              onValueChange={(v) => updateSelected('isEnabled', v)}
              trackColor={{ false: '#2a2a35', true: 'rgba(124,58,237,0.4)' }}
              thumbColor={selected.isEnabled ? '#7c3aed' : '#4b5563'}
            />
          </View>

          {selected.trigger === 'REMINDER' && (
            <>
              <Text style={s.sectionLabel}>ENVIAR</Text>
              <View style={s.card}>
                <View style={s.offsetGrid}>
                  {OFFSET_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.offsetBtn, selected.offsetMinutes === opt.value && s.offsetBtnActive]}
                      onPress={() => updateSelected('offsetMinutes', opt.value)}
                    >
                      <Text style={[s.offsetBtnText, selected.offsetMinutes === opt.value && s.offsetBtnTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <Text style={s.sectionLabel}>MENSAJE</Text>
          <View style={s.card}>
            <TextInput
              style={s.messageInput}
              value={selected.message}
              onChangeText={(v) => updateSelected('message', v)}
              multiline
              placeholderTextColor="#4b5563"
              placeholder="Escribí el mensaje..."
            />
            <Text style={s.hint}>
              Usá variables para personalizar el mensaje. Se reemplazan automáticamente con los datos del turno.
            </Text>
            <View style={s.varRow}>
              {VARIABLES.map((v) => (
                <TouchableOpacity key={v} style={s.varChip} onPress={() => insertVariable(v)}>
                  <Text style={s.varChipText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={[s.sectionLabel, { marginTop: 20 }]}>VISTA PREVIA</Text>
          <View style={s.previewCard}>
            <View style={s.previewBubble}>
              <Text style={s.previewText}>
                {selected.message
                  .replace(/\{\{clientName\}\}/g, 'María')
                  .replace(/\{\{businessName\}\}/g, 'MG Estética')
                  .replace(/\{\{serviceName\}\}/g, 'Manicura básica')
                  .replace(/\{\{date\}\}/g, 'lunes 7 de abril')
                  .replace(/\{\{time\}\}/g, '10:00')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>Guardar todas las reglas</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={s.empty}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
          <Text style={s.emptyText}>Seleccioná una regla para editar</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },

  listPanel: {
    width: 280, backgroundColor: '#18181f',
    borderRightWidth: 1, borderRightColor: '#2a2a35',
    paddingTop: 8,
  },
  listTitle: {
    fontSize: 10, fontWeight: '700', color: '#4b5563',
    letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 10,
  },
  ruleItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a35',
  },
  ruleItemActive: { backgroundColor: 'rgba(124,58,237,0.12)' },
  ruleItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  ruleIcon: { fontSize: 18, width: 28 },
  ruleName: { fontSize: 13, fontWeight: '600', color: '#e5e7eb' },
  ruleMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  editor: { flex: 1, backgroundColor: '#0f0f13' },
  editorHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#18181f', borderRadius: 16,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#2a2a35',
  },
  editorIcon: { fontSize: 28, marginRight: 14 },
  editorTitle: { fontSize: 16, fontWeight: '700', color: '#f9fafb' },
  editorSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#6b7280',
    letterSpacing: 1, marginBottom: 8,
  },
  card: {
    backgroundColor: '#18181f', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#2a2a35',
  },
  messageInput: {
    color: '#f9fafb', fontSize: 14, lineHeight: 22,
    minHeight: 100, textAlignVertical: 'top',
    outlineStyle: 'none',
  } as any,
  hint: { fontSize: 11, color: '#4b5563', marginTop: 10, marginBottom: 8 },
  offsetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  offsetBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#2a2a35', borderWidth: 1, borderColor: '#3a3a45',
  },
  offsetBtnActive: { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: '#7c3aed' },
  offsetBtnText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  offsetBtnTextActive: { color: '#c084fc', fontWeight: '700' },

  varRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  varChip: {
    backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  varChipText: { fontSize: 11, color: '#c084fc', fontWeight: '600' },

  previewCard: {
    backgroundColor: '#18181f', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#2a2a35',
    alignItems: 'flex-start',
  },
  previewBubble: {
    backgroundColor: '#25d366', borderRadius: 12,
    borderBottomLeftRadius: 4, padding: 12,
    maxWidth: '80%',
  },
  previewText: { fontSize: 13, color: '#fff', lineHeight: 20 },

  saveBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#4b5563' },
});
