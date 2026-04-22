import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { GlassCard } from './GlassCard';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  visible: boolean;
  value?: string;
  onConfirm: (date: string) => void;
  onDismiss: () => void;
}

function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function displayDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function CalendarPickerModal({ visible, value, onConfirm, onDismiss }: Props) {
  const today = new Date();
  const todayStr = fmt(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | undefined>(value);

  useEffect(() => {
    if (visible) {
      const base = value ? new Date(value + 'T12:00:00') : today;
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
      setSelected(value);
    }
  }, [visible]);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrap}>
          <GlassCard padding={20} style={styles.card}>
            {/* Month / year nav */}
            <View style={styles.navRow}>
              <Pressable onPress={prevMonth} hitSlop={14} style={styles.navBtn}>
                <Text style={styles.navArrow}>‹</Text>
              </Pressable>
              <Text style={styles.monthYear}>{MONTHS[viewMonth]} {viewYear}</Text>
              <Pressable onPress={nextMonth} hitSlop={14} style={styles.navBtn}>
                <Text style={styles.navArrow}>›</Text>
              </Pressable>
            </View>

            {/* Day-of-week headers */}
            <View style={styles.weekRow}>
              {DAY_LABELS.map((d, i) => (
                <View key={i} style={styles.weekCell}>
                  <Text style={styles.weekLabel}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`e${i}`} style={styles.gridCell} />;
                const dateStr = fmt(viewYear, viewMonth + 1, day);
                const isSel = dateStr === selected;
                const isToday = dateStr === todayStr;
                return (
                  <Pressable key={dateStr} style={styles.gridCell} onPress={() => setSelected(dateStr)}>
                    <View style={[
                      styles.dayCircle,
                      isSel && styles.dayCircleSel,
                      !isSel && isToday && styles.dayCircleToday,
                    ]}>
                      <Text style={[
                        styles.dayNum,
                        isSel && styles.dayNumSel,
                        !isSel && isToday && styles.dayNumToday,
                      ]}>{day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Selected date label */}
            <View style={styles.selectedRow}>
              {selected
                ? <Text style={styles.selectedText}>{displayDate(selected)}</Text>
                : <Text style={styles.selectedPlaceholder}>Select a date</Text>
              }
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable onPress={onDismiss} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => { if (selected) onConfirm(selected); }}
                style={[styles.doneBtn, !selected && { opacity: 0.4 }]}
                disabled={!selected}
              >
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardWrap: { width: '100%', maxWidth: 360 },
  card: { width: '100%' },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 28, color: colors.textPrimary, lineHeight: 32 },
  monthYear: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
  weekLabel: { fontSize: 12, fontWeight: '600', color: colors.textTertiary },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayCircleSel: { backgroundColor: colors.orange },
  dayCircleToday: { borderWidth: 1.5, borderColor: colors.orange },
  dayNum: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  dayNumSel: { color: '#fff', fontWeight: '700' },
  dayNumToday: { color: colors.orange, fontWeight: '700' },

  selectedRow: { marginTop: 14, alignItems: 'center' },
  selectedText: { fontSize: 13, color: colors.orange, fontWeight: '600' },
  selectedPlaceholder: { fontSize: 13, color: colors.textTertiary },

  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  doneBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.orange,
    alignItems: 'center',
  },
  doneText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
