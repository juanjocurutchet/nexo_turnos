import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';
import { TimeSlot } from '../../types';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { bookingApi } from '../../services/api';
import { useBookingStore } from '../../store/bookingStore';
import { colors, spacing, radius, BOTTOM_INSET } from '../../theme';
import { DAYS_SHORT as DAYS, MONTHS_LONG as MONTHS } from '../../utils/dates';

type Props = { navigation: AppNavigation; route: AppRoute<'SelectDateTime'> };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLOT_WIDTH = Math.floor((SCREEN_WIDTH - spacing.xl * 2 - spacing.sm * 2) / 3);

export function SelectDateTimeScreen({ navigation, route }: Props) {
  const { tenant, service, professional } = route.params;
  const { setDateTime } = useBookingStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const loadSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedTime(null);
    try {
      const data = await bookingApi.getSlots({
        tenantId: tenant.id,
        serviceId: service.id,
        professionalId: professional?.id ?? '',
        date,
      });
      setSlots(data);
    } catch {
      // error silencioso — la grilla queda vacía
    } finally {
      setLoadingSlots(false);
    }
  }, [tenant.id, service.id, professional?.id]);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    setDateTime(selectedDate, selectedTime);
    if (!professional) return;
    navigation.navigate('ClientInfo', {
      tenant, service, professional,
      date: selectedDate,
      time: selectedTime,
    });
  };

  // Construir grid del mes
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Elegí tu turno</Text>
        <Text style={styles.subtitle}>{service.name} · {service.durationMin} min</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + BOTTOM_INSET }}>

        {/* Calendario */}
        <View style={styles.calCard}>
          {/* Navegación de mes */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Encabezado días */}
          <View style={styles.dayHeaders}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.calGrid}>
            {calDays.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={styles.calCell} />;

              const date = toDateString(new Date(viewYear, viewMonth, day));
              const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isSelected = selectedDate === date;
              const isToday = date === toDateString(today);

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calCell,
                    styles.calDay,
                    isPast && styles.calDayPast,
                    isToday && styles.calDayToday,
                    isSelected && styles.calDaySelected,
                  ]}
                  onPress={() => !isPast && setSelectedDate(date)}
                  disabled={isPast}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calDayText,
                    isPast && styles.calDayTextPast,
                    isToday && styles.calDayTextToday,
                    isSelected && styles.calDayTextSelected,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Slots de horario */}
        {selectedDate && (
          <View style={styles.slotsSection}>
            <Text style={styles.slotsTitle}>
              {(() => {
                const d = new Date(selectedDate + 'T12:00:00Z');
                return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
              })()}
            </Text>

            {loadingSlots ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : slots.length === 0 ? (
              <Text style={styles.noSlots}>No hay turnos disponibles para este día</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot, idx) => (
                  <TouchableOpacity
                    key={slot.time}
                    onPress={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    style={[
                      styles.slot,
                      !slot.available && styles.slotBusy,
                      selectedTime === slot.time && styles.slotSelected,
                      { marginRight: (idx + 1) % 3 === 0 ? 0 : spacing.sm },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.slotText,
                      !slot.available && styles.slotTextBusy,
                      selectedTime === slot.time && styles.slotTextSelected,
                    ]}>
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTime}
          activeOpacity={0.85}
        >
          <View style={[
            styles.footerBtn,
            (!selectedDate || !selectedTime) && styles.footerBtnDisabled,
          ]}>
            <Text style={styles.footerBtnText}>Confirmar turno →</Text>
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

  calCard: {
    margin: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  navBtn: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: '#f4f3ff', alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 18, color: colors.primary, lineHeight: 22 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },

  dayHeaders: { flexDirection: 'row', marginBottom: spacing.sm },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9ca3af' },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calDay: {},
  calDayPast: {},
  calDayToday: {
    borderWidth: 2, borderColor: colors.primaryLight, borderRadius: 10,
  },
  calDaySelected: {
    backgroundColor: colors.primary, borderRadius: 10,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  calDayText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  calDayTextPast: { color: '#d1d5db' },
  calDayTextToday: { color: colors.primary, fontWeight: '700' },
  calDayTextSelected: { color: colors.white, fontWeight: '700' },

  slotsSection: { paddingHorizontal: spacing.xl },
  slotsTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: spacing.md },
  noSlots: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: spacing.lg },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: {
    width: SLOT_WIDTH,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 2, borderColor: '#e8e6f0',
    backgroundColor: colors.white, alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slotBusy: { backgroundColor: '#f3f4f6', borderColor: '#f3f4f6' },
  slotSelected: {
    backgroundColor: colors.primary, borderColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  slotText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  slotTextBusy: { color: '#d1d5db' },
  slotTextSelected: { color: colors.white },

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
  footerBtnDisabled: { backgroundColor: '#4b5563' },
  footerBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
