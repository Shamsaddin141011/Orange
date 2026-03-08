import { StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export function ProfileScreen() {
  const { profile } = useAppStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>Country: {profile.country}</Text>
      <Text>Interests: {profile.interests.join(', ') || 'None'}</Text>
      <Text>SAT: {profile.satTotal ?? 'Not set'}</Text>
      <Text>GPA: {profile.gpa ?? 'Not set'}</Text>
      <Text>Budget: {profile.budgetMax ? `$${profile.budgetMax}` : 'Not set'}</Text>
      <Text>Location pref: {profile.preferredLocation ?? 'Not set'}</Text>
      <Text style={styles.note}>Demo data is approximate and for guidance only.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#c2410c', marginBottom: 10 },
  note: { marginTop: 16, color: '#9a3412' }
});
