import { StyleSheet, Text, View } from 'react-native';
import { fonts, radius } from '../../theme';
import { useThemeColors } from '../../theme';

type Status = 'researching' | 'applying' | 'applied' | 'offer' | 'rejected' | 'unsent' | 'pending' | 'accepted' | 'not_accepted';

interface Props {
  status: Status;
}

export function StatusBadge({ status }: Props) {
  const c = useThemeColors();

  const config: Record<Status, { label: string; bg: string; text: string; border: string }> = {
    researching:   { label: 'Researching',   bg: c.accentSurface,   text: c.accent,   border: c.accentBorder },
    applying:      { label: 'Applying',      bg: c.primarySurface,  text: c.primary,  border: c.primaryBorder },
    applied:       { label: 'Applied',       bg: c.warningSurface,  text: c.warning,  border: c.warningBorder },
    offer:         { label: 'Offer',         bg: c.successSurface,  text: c.success,  border: c.successBorder },
    rejected:      { label: 'Rejected',      bg: c.dangerSurface,   text: c.danger,   border: c.dangerBorder },
    unsent:        { label: 'Not Started',   bg: c.bgMuted,         text: c.textTertiary, border: c.surfaceBorder },
    pending:       { label: 'Pending',       bg: c.warningSurface,  text: c.warning,  border: c.warningBorder },
    accepted:      { label: 'Accepted',      bg: c.successSurface,  text: c.success,  border: c.successBorder },
    not_accepted:  { label: 'Not Accepted',  bg: c.dangerSurface,   text: c.danger,   border: c.dangerBorder },
  };

  const cfg = config[status] ?? config.unsent;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
