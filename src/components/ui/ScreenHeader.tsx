import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { fonts, iconSize, layout } from '../../theme';
import { useThemeColors } from '../../theme';

interface Props {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, right }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.header,
      {
        paddingTop: insets.top + 8,
        backgroundColor: c.bg,
        borderBottomColor: c.divider,
      },
    ]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: c.bgMuted }]}
            hitSlop={8}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={iconSize.md} color={c.textPrimary} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightSlot}>{right ?? <View style={styles.placeholder} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 12,
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.headerHeight - 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
  placeholder: { width: 36 },
});
