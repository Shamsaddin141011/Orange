import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { colorIdx, rowToUniversity } from '../lib/transform';
import { useAppStore } from '../store/useAppStore';
import { University } from '../types';
import { GlassBackground } from '../components/GlassBackground';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { getPalette, getInitials } from '../components/CardBanner';
import { colors, radius, shadow } from '../theme';

type Props = {
  route: { params: { id: string } };
  navigation: { goBack: () => void };
};

export function UniversityDetailScreen({ route, navigation }: Props) {
  const { shortlist, toggleShortlist, compareIds, toggleCompare, matches } = useAppStore();
  const [fetchedUni, setFetchedUni] = useState<University | null>(null);

  const matchedUni = matches.find((m) => m.university.id === route.params.id)?.university;

  useEffect(() => {
    if (matchedUni) return;
    supabase.from('universities').select('*').eq('id', route.params.id).single().then(({ data }) => {
      if (data) setFetchedUni(rowToUniversity(data as any));
    });
  }, [route.params.id]);

  const uni = matchedUni ?? fetchedUni;
  if (!uni) {
    return (
      <GlassBackground style={styles.center}>
        <ActivityIndicator color={colors.orange} />
      </GlassBackground>
    );
  }

  const saved = !!shortlist[uni.id];
  const compared = compareIds.includes(uni.id);
  const [bgA, bgB] = getPalette(colorIdx(uni.id));
  const initials = getInitials(uni.name);

  return (
    <GlassBackground>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <View style={[styles.hero, { backgroundColor: bgA }]}>
          <LinearGradient
            colors={[bgB, bgA]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.accentBlob, { backgroundColor: bgB }]} />
          <Text style={styles.heroBigInitials}>{initials}</Text>
          {/* Back + actions */}
          <View style={styles.actionBar}>
            <Pressable onPress={() => navigation.goBack()} style={styles.glassBtn}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => toggleShortlist(uni.id)} style={[styles.glassBtn, saved && styles.glassBtnActive]}>
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? colors.orange : colors.textPrimary} />
            </Pressable>
            <Pressable onPress={() => toggleCompare(uni.id)} style={[styles.glassBtn, compared && styles.glassBtnActive]}>
              <Ionicons name="git-compare-outline" size={20} color={compared ? colors.orange : colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroName}>{uni.name}</Text>
            <Text style={styles.heroLocation}>{uni.city}{uni.state ? `, ${uni.state}` : ''} · {uni.country}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Tags */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.tagRow}>
            {uni.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <Text style={styles.description}>{uni.brief_description}</Text>
          </Animated.View>

          {/* Stats grid */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.statsGrid}>
            <GlassCard padding={14} style={styles.statCard} glow>
              <Text style={styles.statValue}>${uni.tuition_estimate.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Tuition/yr</Text>
            </GlassCard>
            <GlassCard padding={14} style={styles.statCard}>
              <Text style={styles.statValue}>
                {uni.acceptance_rate ? `${Math.round(uni.acceptance_rate * 100)}%` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Acceptance</Text>
            </GlassCard>
            <GlassCard padding={14} style={styles.statCard}>
              <Text style={styles.statValue}>{uni.sat_middle_50.min}–{uni.sat_middle_50.max}</Text>
              <Text style={styles.statLabel}>SAT Mid-50</Text>
            </GlassCard>
            <GlassCard padding={14} style={styles.statCard}>
              <Text style={styles.statValue}>{uni.intl_aid}</Text>
              <Text style={styles.statLabel}>Intl Aid</Text>
            </GlassCard>
          </Animated.View>

          {/* Programs */}
          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <GlassCard padding={16} style={styles.section}>
              <Text style={styles.sectionTitle}>Programs</Text>
              <View style={styles.pillRow}>
                {uni.majors.map((m) => (
                  <View key={m} style={styles.majorPill}>
                    <Text style={styles.majorPillText}>{m}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Deadlines */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <GlassCard padding={16} style={styles.section}>
              <Text style={styles.sectionTitle}>Deadlines</Text>
              {uni.deadlines.map((d) => (
                <View key={d.label} style={styles.deadlineRow}>
                  <Text style={styles.deadlineLabel}>{d.label}</Text>
                  <Text style={styles.deadlineDate}>{d.date}</Text>
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Requirements */}
          <Animated.View entering={FadeInDown.duration(400).delay(350)}>
            <GlassCard padding={16} style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.bodyText}>SAT/ACT optional by policy; check official site.</Text>
              <Text style={styles.bodyText}>International: English proficiency + visa docs required.</Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <GlassButton
              label="Visit Official Website"
              onPress={() => Linking.openURL(uni.website)}
              style={styles.websiteBtn}
            />
          </Animated.View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    height: 260,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 20,
  },
  accentBlob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -60,
    opacity: 0.4,
  },
  heroBigInitials: {
    position: 'absolute',
    fontSize: 200,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -10,
    letterSpacing: -6,
  },
  actionBar: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBtnActive: {
    backgroundColor: colors.orangeDim,
    borderColor: colors.orangeBorder,
  },
  heroBottom: { gap: 4 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 28 },
  heroLocation: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  content: { padding: 16 },

  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  tag: {
    backgroundColor: colors.orangeDim,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  tagText: { fontSize: 12, color: colors.orange, fontWeight: '600' },

  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, minWidth: '44%', alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.orange, marginBottom: 3 },
  statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },

  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  majorPill: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  majorPillText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  deadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  deadlineLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  deadlineDate: { fontSize: 14, color: colors.textTertiary },

  bodyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 4 },

  websiteBtn: { marginTop: 4 },
});
