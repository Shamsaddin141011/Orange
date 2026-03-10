import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CompareScreen } from '../screens/CompareScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ShortlistScreen } from '../screens/ShortlistScreen';
import { TrackerScreen } from '../screens/TrackerScreen';
import { UniversityDetailScreen } from '../screens/UniversityDetailScreen';

export type DiscoverStackParamList = {
  Onboarding: undefined;
  DiscoverResults: undefined;
  UniversityDetail: { id: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<DiscoverStackParamList>();

function DiscoverStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: '#111827' },
        headerTintColor: '#f97316',
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'Find Your Match' }} />
      <Stack.Screen name="DiscoverResults" component={DiscoverScreen} options={{ title: 'Results' }} />
      <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Home:      { active: 'home',           inactive: 'home-outline' },
  Discover:  { active: 'search',         inactive: 'search-outline' },
  Shortlist: { active: 'heart',          inactive: 'heart-outline' },
  Compare:   { active: 'git-compare',    inactive: 'git-compare-outline' },
  Tracker:   { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Profile:   { active: 'person',         inactive: 'person-outline' },
};

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#f97316',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#f3f4f6',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            if (!icons) return null;
            return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Discover" component={DiscoverStack} />
        <Tab.Screen name="Shortlist" component={ShortlistScreen} />
        <Tab.Screen name="Compare" component={CompareScreen} />
        <Tab.Screen name="Tracker" component={TrackerScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
