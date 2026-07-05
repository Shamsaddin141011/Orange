import { StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Button } from './Button';
import { fonts, iconSize } from '../../theme';
import { useThemeColors } from '../../theme';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: Props) {
  const c = useThemeColors();

  return (
    <View style={styles.container}>
      <Icon size={iconSize.hero} color={c.textTertiary} strokeWidth={1.5} />
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      {!!actionLabel && !!onAction && (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.heading,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: { marginTop: 4 },
});
