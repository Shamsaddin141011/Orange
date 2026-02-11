import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { universities } from '../data/universities';
import { DiscoverStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';

export function UniversityDetailScreen({ route }: NativeStackScreenProps<DiscoverStackParamList, 'UniversityDetail'>) {
  const uni = universities.find((u) => u.id === route.params.id);
  const { shortlist, toggleShortlist, compareIds, toggleCompare } = useAppStore();
  if (!uni) return <View style={styles.center}><Text>University not found.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 8 }}>
      <Text style={styles.title}>{uni.name}</Text>
      <Text>{uni.city}, {uni.state} ({uni.country})</Text>
      <Text>{uni.brief_description}</Text>
      <Text style={styles.h}>Programs</Text><Text>{uni.majors.join(', ')}</Text>
      <Text style={styles.h}>Admissions Stats</Text>
      <Text>SAT middle 50: {uni.sat_middle_50.min}-{uni.sat_middle_50.max}</Text>
      <Text>Acceptance rate: {uni.acceptance_rate ? `${Math.round(uni.acceptance_rate * 100)}%` : 'N/A'}</Text>
      <Text style={styles.h}>Costs & Aid</Text>
      <Text>Estimated tuition: ${uni.tuition_estimate.toLocaleString()}</Text>
      <Text>International aid: {uni.intl_aid}</Text>
      <Text style={styles.h}>Deadlines</Text>
      {uni.deadlines.map((d) => <Text key={d.label}>{d.label}: {d.date}</Text>)}
      <Text style={styles.h}>Requirements</Text>
      <Text>Required tests: SAT/ACT optional by policy; check official site.</Text>
      <Text>International: English proficiency + visa docs required.</Text>
      <Pressable onPress={() => Linking.openURL(uni.website)}><Text style={styles.link}>Visit website</Text></Pressable>
      <View style={styles.row}>
        <Pressable onPress={() => toggleShortlist(uni.id)}><Text style={styles.action}>{shortlist[uni.id] ? 'Unsave' : 'Save'}</Text></Pressable>
        <Pressable onPress={() => toggleCompare(uni.id)}><Text style={styles.action}>{compareIds.includes(uni.id) ? 'Remove compare' : 'Add compare'}</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#c2410c' },
  h: { marginTop: 8, fontWeight: '700', color: '#7c2d12' },
  link: { color: '#ea580c', marginTop: 8, fontWeight: '700' },
  action: { color: '#ea580c', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 }
});
