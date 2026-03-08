import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UniversityDetailScreen } from '../screens/UniversityDetailScreen';
import { ShortlistScreen } from '../screens/ShortlistScreen';
import { CompareScreen } from '../screens/CompareScreen';
import { TrackerScreen } from '../screens/TrackerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type DiscoverStackParamList = {
  Onboarding: undefined;
  DiscoverResults: undefined;
  UniversityDetail: { id: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<DiscoverStackParamList>();

function DiscoverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="DiscoverResults" component={DiscoverScreen} options={{ title: 'Discover' }} />
      <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} options={{ title: 'University' }} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff7ed' }, tabBarActiveTintColor: '#ea580c' }}>
        <Tab.Screen name="Discover" component={DiscoverStack} options={{ headerShown: false }} />
        <Tab.Screen name="Shortlist" component={ShortlistScreen} />
        <Tab.Screen name="Compare" component={CompareScreen} />
        <Tab.Screen name="Tracker" component={TrackerScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
