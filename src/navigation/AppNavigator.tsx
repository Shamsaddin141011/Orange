import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
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
import { colors } from '../theme';

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

const stackScreenOptions = {
  headerShown: false,
};

function ShortlistStack() {
  return (
    <ShortlistNav.Navigator screenOptions={stackScreenOptions}>
      <ShortlistNav.Screen name="ShortlistMain" component={ShortlistScreen} />
      <ShortlistNav.Screen name="UniversityDetail" component={UniversityDetailScreen} />
    </ShortlistNav.Navigator>
  );
}

function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="DiscoverResults" component={DiscoverScreen} />
      <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} />
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

function TabBarBackground() {
  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.tabBarBg,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: colors.tabBarBorder,
          // @ts-ignore
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      />
    );
  }
  return (
    <BlurView
      intensity={30}
      tint="dark"
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.tabBarBorder,
      }}
    />
  );
}

function MainTabs() {
  const { username } = useAppStore();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarStyle: {
            position: 'absolute',
            bottom: 16,
            left: 12,
            right: 12,
            height: 62,
            borderRadius: 32,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => <TabBarBackground />,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
          tabBarItemStyle: { paddingTop: 6 },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            if (!icons) return null;
            return (
              <View style={focused ? {
                shadowColor: colors.orange,
                shadowOpacity: 0.6,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
              } : undefined}>
                <Ionicons
                  name={focused ? icons.active : icons.inactive}
                  size={focused ? size + 1 : size}
                  color={color}
                />
              </View>
            );
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgDeep }}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}
