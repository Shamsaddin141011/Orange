import { NavigationContainer, NavigatorScreenParams, LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import {
  Home, Search, Heart, CheckSquare, MoreHorizontal,
  BarChart3, Users, User, X,
} from 'lucide-react-native';
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
import { OnboardingModal } from '../components/OnboardingModal';
import { HelpFAQ } from '../components/HelpFAQ';
import { useThemeColors, radius, fonts, iconSize, layout } from '../theme';

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

export type MainTabParamList = {
  Home: undefined;
  Discover: NavigatorScreenParams<DiscoverStackParamList>;
  Shortlist: NavigatorScreenParams<ShortlistStackParamList>;
  Tracker: undefined;
  More: undefined;
  Compare: undefined;
  People: NavigatorScreenParams<PeopleStackParamList>;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<DiscoverStackParamList>();
const ShortlistNav = createNativeStackNavigator<ShortlistStackParamList>();
const PeopleNav = createNativeStackNavigator<PeopleStackParamList>();

const stackOptions = { headerShown: false };

function ShortlistStack() {
  return (
    <ShortlistNav.Navigator screenOptions={stackOptions}>
      <ShortlistNav.Screen name="ShortlistMain" component={ShortlistScreen} />
      <ShortlistNav.Screen name="UniversityDetail" component={UniversityDetailScreen} />
    </ShortlistNav.Navigator>
  );
}

function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DiscoverResults" component={DiscoverScreen} />
      <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} />
    </Stack.Navigator>
  );
}

function PeopleStack() {
  return (
    <PeopleNav.Navigator screenOptions={stackOptions}>
      <PeopleNav.Screen name="PeopleSearch" component={PeopleScreen} />
      <PeopleNav.Screen name="PublicProfile" component={PublicProfileScreen} />
      <PeopleNav.Screen name="Chat" component={ChatScreen} />
      <PeopleNav.Screen name="Inbox" component={InboxScreen} />
    </PeopleNav.Navigator>
  );
}

// ─── More modal ──────────────────────────────────────────────────────────────

interface MoreModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

function MoreModal({ visible, onClose, onNavigate }: MoreModalProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const items = [
    { icon: BarChart3, label: 'Compare',  screen: 'Compare' },
    { icon: Users,     label: 'People',   screen: 'People'  },
    { icon: User,      label: 'Profile',  screen: 'Profile' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.moreOverlay} onPress={onClose}>
        <View
          style={[
            styles.moreSheet,
            {
              backgroundColor: c.bgElevated,
              borderColor: c.surfaceBorder,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.moreDragHandle, { backgroundColor: c.surfaceBorder }]} />
          <Text style={[styles.moreTitle, { color: c.textPrimary }]}>More</Text>
          {items.map(({ icon: Icon, label, screen }) => (
            <Pressable
              key={screen}
              style={[styles.moreItem, { borderBottomColor: c.divider }]}
              onPress={() => { onClose(); onNavigate(screen); }}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Icon size={iconSize.md} color={c.primary} strokeWidth={1.5} />
              <Text style={[styles.moreItemLabel, { color: c.textPrimary }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Tab bar background ───────────────────────────────────────────────────────

function TabBarBackground({ isDark }: { isDark: boolean }) {
  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
          backgroundColor: isDark ? 'rgba(15,10,4,0.88)' : 'rgba(255,250,245,0.88)',
          borderRadius: 32,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
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
      tint={isDark ? 'dark' : 'light'}
      style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
      }}
    />
  );
}

// ─── More placeholder screen ──────────────────────────────────────────────────

function MorePlaceholder() {
  return <View style={{ flex: 1 }} />;
}

// ─── Main tabs ────────────────────────────────────────────────────────────────

function MainTabs() {
  const c = useThemeColors();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { username, userDataLoaded, profile } = useAppStore();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [moreNavigation, setMoreNavigation] = useState<any>(null);

  const showOnboarding = userDataLoaded && username !== null && profile.interests.length === 0 && !onboardingDismissed;

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: c.tabActive,
          tabBarInactiveTintColor: c.tabInactive,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarInactiveBackgroundColor: 'transparent',
          tabBarButton: (props) => (
            <Pressable {...props as any} style={[props.style as any, { backgroundColor: 'transparent' }]} />
          ),
          tabBarStyle: {
            position: 'absolute',
            bottom: 16,
            left: 12,
            right: 12,
            height: layout.tabBarHeight,
            borderRadius: 32,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => <TabBarBackground isDark={isDark} />,
          tabBarLabelStyle: { fontSize: 10, fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 4 },
          tabBarItemStyle: { paddingTop: 6 },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarIcon: ({ color, size, focused }) => <Home size={focused ? size + 1 : size} color={color} strokeWidth={1.5} /> }}
        />
        <Tab.Screen
          name="Discover"
          component={DiscoverStack}
          options={{ tabBarIcon: ({ color, size, focused }) => <Search size={focused ? size + 1 : size} color={color} strokeWidth={1.5} /> }}
        />
        <Tab.Screen
          name="Shortlist"
          component={ShortlistStack}
          options={{ tabBarIcon: ({ color, size, focused }) => <Heart size={focused ? size + 1 : size} color={color} fill={focused ? color : 'none'} strokeWidth={1.5} /> }}
        />
        <Tab.Screen
          name="Tracker"
          component={TrackerScreen}
          options={{ tabBarIcon: ({ color, size, focused }) => <CheckSquare size={focused ? size + 1 : size} color={color} strokeWidth={1.5} /> }}
        />
        <Tab.Screen
          name="More"
          component={MorePlaceholder}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              setMoreNavigation(navigation);
              setMoreVisible(true);
            },
          })}
          options={{ tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} strokeWidth={1.5} /> }}
        />
        {/* Hidden tabs — navigated to from More modal */}
        <Tab.Screen name="Compare" component={CompareScreen} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="People" component={PeopleStack} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarButton: () => null }} />
      </Tab.Navigator>

      <MoreModal
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        onNavigate={(screen) => moreNavigation?.navigate(screen)}
      />

      <UsernameSetupModal visible={userDataLoaded && username === null} />
      <OnboardingModal visible={showOnboarding} onDone={() => setOnboardingDismissed(true)} />
      <HelpFAQ />
    </>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

const linking: LinkingOptions<MainTabParamList> = {
  prefixes: ['https://www.orangeuni.org', 'https://orangeuni.org', 'orangeuni://'],
  config: {
    screens: {
      Home: 'home',
      Discover: {
        screens: {
          DiscoverResults: 'discover',
          UniversityDetail: 'discover/university/:id',
        },
      },
      Shortlist: {
        screens: {
          ShortlistMain: 'shortlist',
          UniversityDetail: 'shortlist/university/:id',
        },
      },
      Tracker: 'tracker',
      Compare: 'compare',
      People: {
        screens: {
          PeopleSearch: 'people',
          PublicProfile: 'people/:userId',
          Chat: 'people/chat/:conversationId',
          Inbox: 'inbox',
        },
      },
      Profile: 'profile',
    },
  },
};

export function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialising, setInitialising] = useState(true);
  const c = useThemeColors();
  const { setSession: storeSetSession, loadUserData } = useAppStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      storeSetSession(session);
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        loadUserData();
      }
      // After a Supabase pause, the access token may be expired on INITIAL_SESSION so DB
      // queries fail silently. autoRefreshToken will fire TOKEN_REFRESHED once the token is
      // renewed — retry loadUserData at that point if we haven't loaded yet.
      if (session && event === 'TOKEN_REFRESHED') {
        const { userDataLoaded } = useAppStore.getState();
        if (!userDataLoaded) loadUserData();
      }
      setInitialising(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (initialising) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {session ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  moreOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'flex-end',
  },
  moreSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  moreDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  moreTitle: {
    fontSize: 16,
    fontFamily: 'Syne_700Bold',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  moreItemLabel: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
});
