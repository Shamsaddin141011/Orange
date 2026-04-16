import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { AuthScreen } from '../screens/AuthScreen';
import { CompareScreen } from '../screens/CompareScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ShortlistScreen } from '../screens/ShortlistScreen';
import { TrackerScreen } from '../screens/TrackerScreen';
import { UniversityDetailScreen } from '../screens/UniversityDetailScreen';
import { PeopleScreen } from '../screens/PeopleScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { UsernameSetupModal } from '../components/UsernameSetupModal';

export type DiscoverStackParamList = {
  DiscoverResults: undefined;
  UniversityDetail: { id: string };
};

export type ShortlistStackParamList = {
  ShortlistMain: undefined;
  UniversityDetail: { id: string };
};

export type PeopleStackParamList = {
  PeopleSearch: undefined;
  PublicProfile: { userId: string };
  Chat: { conversationId: string; otherUsername: string };
  Inbox: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<DiscoverStackParamList>();
const ShortlistNav = createNativeStackNavigator<ShortlistStackParamList>();
const PeopleNav = createNativeStackNavigator<PeopleStackParamList>();

function ShortlistStack() {
  return (
    <ShortlistNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: '#111827' },
        headerTintColor: '#f97316',
      }}
    >
      <ShortlistNav.Screen name="ShortlistMain" component={ShortlistScreen} options={{ title: 'Shortlist' }} />
      <ShortlistNav.Screen name="UniversityDetail" component={UniversityDetailScreen} options={{ title: '' }} />
    </ShortlistNav.Navigator>
  );
}

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
      <Stack.Screen name="DiscoverResults" component={DiscoverScreen} options={{ title: 'Discover' }} />
      <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function PeopleStack() {
  return (
    <PeopleNav.Navigator screenOptions={{ headerShown: false }}>
      <PeopleNav.Screen name="PeopleSearch" component={PeopleScreen} />
      <PeopleNav.Screen name="PublicProfile" component={PublicProfileScreen} />
      <PeopleNav.Screen name="Chat" component={ChatScreen} />
      <PeopleNav.Screen name="Inbox" component={InboxScreen} />
    </PeopleNav.Navigator>
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Home:      { active: 'home',             inactive: 'home-outline' },
  Discover:  { active: 'search',           inactive: 'search-outline' },
  Shortlist: { active: 'heart',            inactive: 'heart-outline' },
  Compare:   { active: 'git-compare',      inactive: 'git-compare-outline' },
  Tracker:   { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  People:    { active: 'people',           inactive: 'people-outline' },
  Profile:   { active: 'person',           inactive: 'person-outline' },
};

function MainTabs() {
  const { username } = useAppStore();

  return (
    <>
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
        <Tab.Screen name="Shortlist" component={ShortlistStack} />
        <Tab.Screen name="Compare" component={CompareScreen} />
        <Tab.Screen name="Tracker" component={TrackerScreen} />
        <Tab.Screen name="People" component={PeopleStack} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      {/* Username setup blocks interaction until user picks a username */}
      <UsernameSetupModal visible={username === null} />
    </>
  );
}

export function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialising, setInitialising] = useState(true);
  const { setSession: storeSetSession, loadUserData } = useAppStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      storeSetSession(session);
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        loadUserData();
      }
      setInitialising(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (initialising) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}
