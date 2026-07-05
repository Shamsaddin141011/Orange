import { StyleSheet, Text, View } from 'react-native';
import { fonts, radius } from '../../theme';
import { useThemeColors } from '../../theme';

interface Props {
  score: number; // 0-100
}

export function MatchBadge({ score }: Props) {
  const c = useThemeColors();

  const bg   = score >= 80 ? c.successSurface : score >= 60 ? c.primarySurface : score >= 40 ? c.warningSurface : c.bgMuted;
  const text = score >= 80 ? c.success        : score >= 60 ? c.primary        : score >= 40 ? c.warning        : c.textTertiary;
  const border = score >= 80 ? c.successBorder : score >= 60 ? c.primaryBorder : score >= 40 ? c.warningBorder  : c.surfaceBorder;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.label, { color: text }]}>{score}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
});
