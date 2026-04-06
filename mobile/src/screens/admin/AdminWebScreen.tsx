import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { AppNavigation, AppRoute } from '../../navigation/AppNavigator';
import { adminApi } from '../../services/api';
import { BookingAdmin } from '../../types';
import { MONTHS_LONG } from '../../utils/dates';
import { ProfessionalsWebView } from './web/ProfessionalsWebView';
import { ServicesWebView } from './web/ServicesWebView';
import { ScheduleWebView } from './web/ScheduleWebView';
import { SettingsWebView } from './web/SettingsWebView';
import { NotificationsWebView } from './web/NotificationsWebView';

type Props = { navigation: AppNavigation; route: AppRoute<'AdminWeb'> };

type Section = 'dashboard' | 'agenda' | 'professionals' | 'services' | 'schedule' | 'notifications' | 'settings';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado', NO_SHOW: 'No se presentó',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#fbbf24', CONFIRMED: '#4ade80',
  COMPLETED: '#9ca3af', CANCELLED: '#f87171', NO_SHOW: '#f87171',
};
const STATUS_BG: Record<string, string> = {
  PENDING: 'rgba(217,119,6,0.15)', CONFIRMED: 'rgba(5,150,105,0.15)',
  COMPLETED: 'rgba(107,114,128,0.15)', CANCELLED: 'rgba(248,113,113,0.15)', NO_SHOW: 'rgba(248,113,113,0.15)',
};
const TL_COLOR: Record<string, string> = {
  PENDING: '#d97706', CONFIRMED: '#059669',
  COMPLETED: '#6b7280', CANCELLED: '#f87171', NO_SHOW: '#f87171',
};
const TL_CARD_BG: Record<string, string> = {
  PENDING: 'rgba(217,119,6,0.08)', CONFIRMED: 'rgba(5,150,105,0.08)',
  COMPLETED: 'rgba(107,114,128,0.06)', CANCELLED: 'rgba(248,113,113,0.08)', NO_SHOW: 'rgba(248,113,113,0.08)',
};
const TL_CARD_BORDER: Record<string, string> = {
  PENDING: 'rgba(217,119,6,0.2)', CONFIRMED: 'rgba(5,150,105,0.2)',
  COMPLETED: 'rgba(107,114,128,0.15)', CANCELLED: 'rgba(248,113,113,0.2)', NO_SHOW: 'rgba(248,113,113,0.2)',
};

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return toDateString(d);
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function fmtDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()].slice(0, 3)}`;
}

const NAV_ITEMS: { key: Section; icon: string; label: string }[] = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'agenda', icon: '📅', label: 'Agenda' },
  { key: 'professionals', icon: '👥', label: 'Profesionales' },
  { key: 'services', icon: '✨', label: 'Servicios' },
  { key: 'schedule', icon: '🕐', label: 'Horarios' },
  { key: 'notifications', icon: '💬', label: 'Notificaciones' },
  { key: 'settings', icon: '⚙️', label: 'Configuración' },
];

export function AdminWebScreen({ navigation, route }: Props) {
  const { tenantId, tenantName } = route.params;
  const [section, setSection] = useState<Section>('dashboard');
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [bookings, setBookings] = useState<BookingAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadBookings = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const data = await adminApi.getDayBookings(tenantId, date);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadBookings(selectedDate); }, [selectedDate, loadBookings]);

  const handleStatus = (booking: BookingAdmin, status: string) => {
    Alert.alert(
      'Cambiar estado',
      `¿Marcar turno de ${booking.client.firstName} como "${STATUS_LABEL[status]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await adminApi.updateBookingStatus(booking.id, tenantId, status);
            loadBookings(selectedDate);
          },
        },
      ],
    );
  };

  const filteredBookings = searchText.trim()
    ? bookings.filter(b =>
        `${b.client.firstName} ${b.client.lastName} ${b.client.phone} ${b.service.name}`
          .toLowerCase().includes(searchText.toLowerCase())
      )
    : bookings;

  const todayStr = toDateString(new Date());
  const todayDisplay = fmtDate(todayStr);

  const totalRevenue = bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.sidebarBrand}>
          <Text style={styles.brandIcon}>💅</Text>
          <View>
            <Text style={styles.brandName} numberOfLines={1}>{tenantName}</Text>
            <Text style={styles.brandSub}>Panel admin</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sidebarNav}>
          <Text style={styles.sidebarSection}>PRINCIPAL</Text>
          {NAV_ITEMS.slice(0, 2).map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, section === item.key && styles.navItemActive]}
              onPress={() => setSection(item.key)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, section === item.key && styles.navLabelActive]}>
                {item.label}
              </Text>
              {item.key === 'agenda' && pendingCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <Text style={[styles.sidebarSection, { marginTop: 20 }]}>GESTIÓN</Text>
          {NAV_ITEMS.slice(2).map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, section === item.key && styles.navItemActive]}
              onPress={() => setSection(item.key)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, section === item.key && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.sidebarProfile}>
            <View style={styles.spAvatar}>
              <Text style={{ fontSize: 16 }}>👩</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.spName} numberOfLines={1}>{tenantName}</Text>
              <Text style={styles.spPlan}>Plan Free</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.main}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.topbarTitle}>
              {section === 'dashboard' && 'Dashboard'}
              {section === 'agenda' && 'Agenda'}
              {section === 'professionals' && 'Profesionales'}
              {section === 'services' && 'Servicios'}
              {section === 'schedule' && 'Horarios del local'}
              {section === 'notifications' && 'Notificaciones'}
              {section === 'settings' && 'Configuración'}
            </Text>
            <Text style={styles.topbarSub}>{todayDisplay}</Text>
          </View>

          <View style={styles.searchBox}>
            <Text style={{ fontSize: 13, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente o turno..."
              placeholderTextColor="#4b5563"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AdminBookingCreate', { tenantId, date: selectedDate })}
          >
            <Text style={styles.addBtnText}>+ Nuevo turno</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {section === 'dashboard' && (
            <DashboardView
              bookings={bookings}
              filteredBookings={filteredBookings}
              loading={loading}
              selectedDate={selectedDate}
              totalRevenue={totalRevenue}
              pendingCount={pendingCount}
              confirmedCount={confirmedCount}
              onStatusChange={handleStatus}
              onNavigateAgenda={() => setSection('agenda')}
            />
          )}
          {section === 'agenda' && (
            <AgendaView
              tenantId={tenantId}
              bookings={filteredBookings}
              loading={loading}
              selectedDate={selectedDate}
              onDateChange={(d) => setSelectedDate(d)}
              onStatusChange={handleStatus}
              onAddBooking={(date) => navigation.navigate('AdminBookingCreate', { tenantId, date })}
            />
          )}
          {section === 'professionals' && <ProfessionalsWebView tenantId={tenantId} />}
          {section === 'services' && <ServicesWebView tenantId={tenantId} />}
          {section === 'schedule' && <ScheduleWebView tenantId={tenantId} />}
          {section === 'notifications' && <NotificationsWebView tenantId={tenantId} />}
          {section === 'settings' && <SettingsWebView tenantId={tenantId} />}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Dashboard Overview ────────────────────────────────────────────────────────

function DashboardView({ bookings, filteredBookings, loading, selectedDate, totalRevenue, pendingCount, confirmedCount, onStatusChange, onNavigateAgenda }: any) {
  return (
    <>
      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <KpiCard color="#7c3aed" icon="📅" label="Turnos hoy" value={String(bookings.length)} sub={`${confirmedCount} confirmados`} />
        <KpiCard color="#db2777" icon="💰" label="Facturado hoy" value={`$${totalRevenue.toLocaleString('es-AR')}`} sub="servicios completados" />
        <KpiCard color="#059669" icon="⏳" label="Pendientes" value={String(pendingCount)} sub="requieren confirmación" />
        <KpiCard color="#d97706" icon="✅" label="Completados" value={String(bookings.filter((b: any) => b.status === 'COMPLETED').length)} sub="de hoy" />
      </View>

      <View style={styles.dashGrid}>
        {/* Agenda del día */}
        <View style={styles.agendaCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Agenda de hoy · {fmtDateShort(selectedDate)}</Text>
            <TouchableOpacity onPress={onNavigateAgenda} style={styles.cardAction}>
              <Text style={styles.cardActionText}>Ver agenda completa →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#7c3aed" style={{ padding: 40 }} />
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
              <Text style={styles.emptyText}>Sin turnos este día</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {filteredBookings.map((b: BookingAdmin) => (
                <View key={b.id} style={styles.timelineItem}>
                  <Text style={styles.tlTime}>{fmtTime(b.startTime)}</Text>
                  <View style={[styles.tlDot, { backgroundColor: TL_COLOR[b.status] }]} />
                  <View style={[styles.tlCard, {
                    backgroundColor: TL_CARD_BG[b.status],
                    borderColor: TL_CARD_BORDER[b.status],
                  }]}>
                    <View style={styles.tlAvatar}>
                      <Text style={{ fontSize: 18 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tlClient}>{b.client.firstName} {b.client.lastName}</Text>
                      <Text style={styles.tlService}>{b.service.name} · {b.professional.firstName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.tlDuration}>{b.service.durationMin} min</Text>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[b.status] }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] }]}>
                          {STATUS_LABEL[b.status]}
                        </Text>
                      </View>
                    </View>
                    {b.status === 'PENDING' && (
                      <View style={styles.tlActions}>
                        <TouchableOpacity style={styles.tlBtn} onPress={() => onStatusChange(b, 'CONFIRMED')}>
                          <Text style={[styles.tlBtnText, { color: '#4ade80' }]}>✓ Confirmar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tlBtn} onPress={() => onStatusChange(b, 'CANCELLED')}>
                          <Text style={[styles.tlBtnText, { color: '#f87171' }]}>✕ Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <View style={styles.tlActions}>
                        <TouchableOpacity style={styles.tlBtn} onPress={() => onStatusChange(b, 'COMPLETED')}>
                          <Text style={[styles.tlBtnText, { color: '#c084fc' }]}>✓ Completar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tlBtn} onPress={() => onStatusChange(b, 'NO_SHOW')}>
                          <Text style={[styles.tlBtnText, { color: '#f87171' }]}>✕ No vino</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Panel derecho */}
        <View style={styles.rightPanel}>
          {/* Mini stats */}
          <View style={styles.miniStatsGrid}>
            <MiniStat value={`${bookings.length > 0 ? Math.round((bookings.filter((b: any) => b.status !== 'CANCELLED' && b.status !== 'NO_SHOW').length / bookings.length) * 100) : 0}%`} label="Ocupación hoy" color="#4ade80" />
            <MiniStat value={String(bookings.filter((b: any) => b.status === 'PENDING').length)} label="Sin confirmar" color="#fbbf24" />
            <MiniStat value={`$${bookings.length > 0 ? Math.round(totalRevenue / (bookings.filter((b: any) => b.status === 'COMPLETED').length || 1)).toLocaleString('es-AR') : 0}`} label="Ticket promedio" color="#c084fc" />
            <MiniStat value={String(bookings.filter((b: any) => b.status === 'COMPLETED').length)} label="Completados" color="#4ade80" />
          </View>

          {/* Próximos turnos */}
          <View style={styles.rightCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Próximos turnos</Text>
            </View>
            {bookings
              .filter((b: BookingAdmin) => b.status === 'PENDING' || b.status === 'CONFIRMED')
              .slice(0, 4)
              .map((b: BookingAdmin) => (
                <View key={b.id} style={styles.nextItem}>
                  <View style={[styles.nextDot, { backgroundColor: TL_COLOR[b.status] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextClient}>{b.client.firstName} {b.client.lastName}</Text>
                    <Text style={styles.nextService}>{b.service.name}</Text>
                  </View>
                  <Text style={styles.nextTime}>{fmtTime(b.startTime)}</Text>
                </View>
              ))}
            {bookings.filter((b: BookingAdmin) => b.status === 'PENDING' || b.status === 'CONFIRMED').length === 0 && (
              <Text style={[styles.emptyText, { padding: 16 }]}>Sin turnos pendientes</Text>
            )}
          </View>
        </View>
      </View>
    </>
  );
}

// ── Agenda Full View ──────────────────────────────────────────────────────────

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function AgendaView({ tenantId, bookings, loading, selectedDate, onDateChange, onStatusChange, onAddBooking }: any) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = toDateString(new Date());
  const baseDate = addDays(today, weekOffset * 7);
  const baseDow = new Date(baseDate + 'T12:00:00Z').getUTCDay();
  const weekStart = addDays(baseDate, -baseDow);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selD = new Date(selectedDate + 'T12:00:00Z');
  const monthYear = `${MONTHS_LONG[selD.getUTCMonth()]} ${selD.getUTCFullYear()}`;

  return (
    <>
      {/* Week navigation */}
      <View style={styles.agendaTopBar}>
        <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset(w => w - 1)}>
          <Text style={styles.weekNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekNavMonth}>{monthYear}</Text>
        <TouchableOpacity style={styles.weekNavBtn} onPress={() => setWeekOffset(w => w + 1)}>
          <Text style={styles.weekNavText}>›</Text>
        </TouchableOpacity>

        <View style={styles.weekStrip}>
          {weekDates.map((date, i) => {
            const d = new Date(date + 'T12:00:00Z');
            const isSelected = date === selectedDate;
            const isToday = date === today;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                onPress={() => onDateChange(date)}
              >
                <Text style={[styles.dayPillLabel, isSelected && styles.dayPillLabelSel]}>
                  {WEEK_DAYS[i]}
                </Text>
                <Text style={[
                  styles.dayPillNum,
                  isSelected && styles.dayPillNumSel,
                  isToday && !isSelected && styles.dayPillNumToday,
                ]}>
                  {d.getUTCDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.agendaAddBtn}
          onPress={() => onAddBooking(selectedDate)}
        >
          <Text style={styles.agendaAddText}>+ Agregar turno</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.agendaCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Turnos — {fmtDate(selectedDate)}</Text>
          <Text style={styles.cardSubtitle}>{bookings.length} turno{bookings.length !== 1 ? 's' : ''}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#7c3aed" style={{ padding: 40 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={styles.emptyText}>Sin turnos este día</Text>
          </View>
        ) : (
          <View style={styles.agendaList}>
            {bookings.map((b: BookingAdmin) => (
              <View key={b.id} style={styles.agendaRow}>
                <Text style={styles.agendaTime}>{fmtTime(b.startTime)}</Text>
                <View style={[styles.agendaRowDot, { backgroundColor: TL_COLOR[b.status] }]} />
                <View style={[styles.agendaRowCard, {
                  backgroundColor: TL_CARD_BG[b.status],
                  borderColor: TL_CARD_BORDER[b.status],
                }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tlClient}>{b.client.firstName} {b.client.lastName}</Text>
                    <Text style={styles.tlService}>{b.service.name} · {b.professional.firstName} · {b.service.durationMin} min</Text>
                    <Text style={[styles.tlService, { color: '#6b7280', marginTop: 2 }]}>{b.client.phone}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[b.status] }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] }]}>
                        {STATUS_LABEL[b.status]}
                      </Text>
                    </View>
                    <Text style={styles.agendaPrice}>${Number(b.totalPrice).toLocaleString('es-AR')}</Text>
                  </View>
                  {b.status === 'PENDING' && (
                    <View style={[styles.tlActions, { marginTop: 8 }]}>
                      <TouchableOpacity style={styles.agendaActionBtn} onPress={() => onStatusChange(b, 'CONFIRMED')}>
                        <Text style={[styles.agendaActionText, { color: '#4ade80' }]}>✓ Confirmar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.agendaActionBtn} onPress={() => onStatusChange(b, 'CANCELLED')}>
                        <Text style={[styles.agendaActionText, { color: '#f87171' }]}>✕ Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <View style={[styles.tlActions, { marginTop: 8 }]}>
                      <TouchableOpacity style={styles.agendaActionBtn} onPress={() => onStatusChange(b, 'COMPLETED')}>
                        <Text style={[styles.agendaActionText, { color: '#c084fc' }]}>✓ Completar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.agendaActionBtn} onPress={() => onStatusChange(b, 'NO_SHOW')}>
                        <Text style={[styles.agendaActionText, { color: '#f87171' }]}>✕ No vino</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function KpiCard({ color, icon, label, value, sub }: any) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <Text style={styles.kpiIcon}>{icon}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

function MiniStat({ value, label, color }: any) {
  return (
    <View style={styles.miniStatCard}>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#0f0f13' },

  // Sidebar
  sidebar: {
    width: 240, backgroundColor: '#18181f',
    borderRightWidth: 1, borderRightColor: '#2a2a35',
    paddingVertical: 20, paddingHorizontal: 12,
  },
  sidebarBrand: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10, marginBottom: 20,
  },
  brandIcon: { fontSize: 28, marginRight: 10 },
  brandName: { fontSize: 14, fontWeight: '700', color: '#c084fc', maxWidth: 160 },
  brandSub: { fontSize: 11, color: '#4b5563' },
  sidebarNav: { flex: 1 },
  sidebarSection: {
    fontSize: 10, fontWeight: '700', color: '#4b5563',
    letterSpacing: 1, paddingHorizontal: 10, marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 10, marginBottom: 2,
  },
  navItemActive: { backgroundColor: 'rgba(124,58,237,0.2)' },
  navIcon: { fontSize: 15, width: 22, marginRight: 8 },
  navLabel: { fontSize: 13, fontWeight: '500', color: '#9ca3af', flex: 1 },
  navLabelActive: { color: '#c084fc', fontWeight: '600' },
  navBadge: {
    backgroundColor: '#7c3aed', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  navBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  sidebarFooter: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a35' },
  sidebarProfile: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2a2a35', borderRadius: 12, padding: 10,
  },
  spAvatar: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#3a3a45', alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  spName: { fontSize: 12, fontWeight: '600', color: '#e5e7eb' },
  spPlan: { fontSize: 10, color: '#6b7280' },

  // Main
  main: { flex: 1, backgroundColor: '#0f0f13' },
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#2a2a35',
    backgroundColor: '#0f0f13',
  },
  topbarTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb' },
  topbarSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2a2a35', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    marginLeft: 16, borderWidth: 1, borderColor: '#3a3a45',
  },
  searchInput: {
    color: '#9ca3af', fontSize: 13, width: 200,
    outlineStyle: 'none',
  } as any,
  addBtn: {
    marginLeft: 12, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#7c3aed', borderRadius: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  content: { padding: 24 },

  // KPI
  kpiGrid: {
    flexDirection: 'row', marginBottom: 24,
  },
  kpiCard: {
    flex: 1, backgroundColor: '#18181f',
    borderRadius: 16, padding: 20, marginRight: 16,
    borderWidth: 1, borderColor: '#2a2a35',
    borderTopWidth: 3,
  },
  kpiIcon: { fontSize: 22, opacity: 0.5, marginBottom: 8 },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', letterSpacing: 0.5, marginBottom: 8 },
  kpiValue: { fontSize: 26, fontWeight: '800', color: '#f9fafb', marginBottom: 4 },
  kpiSub: { fontSize: 12, color: '#4b5563' },

  // Dash grid
  dashGrid: { flexDirection: 'row', alignItems: 'flex-start' },
  agendaCard: {
    flex: 1, backgroundColor: '#18181f',
    borderRadius: 16, borderWidth: 1, borderColor: '#2a2a35',
    overflow: 'hidden', marginRight: 20,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#2a2a35',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#f9fafb' },
  cardSubtitle: { fontSize: 12, color: '#6b7280' },
  cardAction: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 8,
  },
  cardActionText: { fontSize: 12, fontWeight: '600', color: '#7c3aed' },

  // Timeline
  timeline: { padding: 16 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  tlTime: {
    width: 48, fontSize: 11, fontWeight: '600',
    color: '#6b7280', paddingTop: 14, textAlign: 'right', marginRight: 10,
  },
  tlDot: {
    width: 10, height: 10, borderRadius: 5,
    marginTop: 16, marginRight: 10, flexShrink: 0,
  },
  tlCard: {
    flex: 1, borderRadius: 12, padding: 12,
    borderWidth: 1, flexDirection: 'row',
    alignItems: 'center', flexWrap: 'wrap',
  },
  tlAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  tlClient: { fontSize: 13, fontWeight: '600', color: '#f9fafb', marginBottom: 2 },
  tlService: { fontSize: 11, color: '#9ca3af' },
  tlDuration: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  tlActions: { flexDirection: 'row', width: '100%', marginTop: 6 },
  tlBtn: { marginRight: 8, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' },
  tlBtnText: { fontSize: 12, fontWeight: '600' },

  // Right panel
  rightPanel: { width: 320 },
  miniStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  miniStatCard: {
    width: '48%', backgroundColor: '#18181f',
    borderRadius: 14, borderWidth: 1, borderColor: '#2a2a35',
    padding: 14, alignItems: 'center', marginBottom: 8,
    marginRight: '2%',
  },
  miniStatValue: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  miniStatLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center' },

  rightCard: {
    backgroundColor: '#18181f', borderRadius: 16,
    borderWidth: 1, borderColor: '#2a2a35', overflow: 'hidden',
  },
  nextItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#2a2a35',
  },
  nextDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  nextClient: { fontSize: 13, fontWeight: '600', color: '#e5e7eb', marginBottom: 2 },
  nextService: { fontSize: 11, color: '#6b7280' },
  nextTime: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },

  emptyState: { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 14, color: '#4b5563' },

  // Agenda section
  agendaTopBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#18181f', borderRadius: 16,
    borderWidth: 1, borderColor: '#2a2a35',
    padding: 16, marginBottom: 20,
  },
  weekNavBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#2a2a35', alignItems: 'center', justifyContent: 'center',
  },
  weekNavText: { fontSize: 18, color: '#9ca3af', lineHeight: 22 },
  weekNavMonth: { fontSize: 14, fontWeight: '600', color: '#f9fafb', marginHorizontal: 12 },
  weekStrip: { flex: 1, flexDirection: 'row', marginHorizontal: 12 },
  dayPill: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    borderRadius: 10, marginHorizontal: 2,
  },
  dayPillSelected: { backgroundColor: 'rgba(124,58,237,0.3)' },
  dayPillLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  dayPillLabelSel: { color: '#c084fc' },
  dayPillNum: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
  dayPillNumSel: { color: '#fff' },
  dayPillNumToday: { color: '#fbbf24' },
  agendaAddBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#7c3aed', borderRadius: 10,
    marginLeft: 12,
  },
  agendaAddText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  agendaList: { padding: 16 },
  agendaRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  agendaTime: {
    width: 52, fontSize: 12, fontWeight: '700',
    color: '#9ca3af', paddingTop: 16, textAlign: 'right', marginRight: 12,
  },
  agendaRowDot: { width: 10, height: 10, borderRadius: 5, marginTop: 18, marginRight: 12 },
  agendaRowCard: {
    flex: 1, borderRadius: 12, padding: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap',
  },
  agendaPrice: { fontSize: 13, fontWeight: '700', color: '#c084fc' },
  agendaActionBtn: {
    marginRight: 8, paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  agendaActionText: { fontSize: 12, fontWeight: '600' },

});
