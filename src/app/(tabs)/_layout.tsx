import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';
import { Button, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '../../shared/ui/theme';

/**
 * Persistent app shell.
 *
 * Only top-level destinations live in this group. Secondary flows are pushed
 * above the tab navigator so they keep focus and hide the tab bar.
 */
export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: styles.headerTitle,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 2,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              color={color as string}
              size={22}
              source={focused ? 'home-variant' : 'home-variant-outline'}
            />
          ),
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="routines/index"
        options={{
          headerRight: () => (
            <Button
              accessibilityLabel="Crear una rutina"
              compact
              contentStyle={styles.headerActionContent}
              icon="plus"
              mode="text"
              onPress={() => router.push('/routines/new')}
              style={styles.headerAction}
            >
              Nueva
            </Button>
          ),
          tabBarAccessibilityLabel: 'Rutinas',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              color={color as string}
              size={22}
              source={focused ? 'clipboard-list' : 'clipboard-list-outline'}
            />
          ),
          title: 'Rutinas',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarAccessibilityLabel: 'Progreso',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              color={color as string}
              size={22}
              source={focused ? 'chart-line' : 'chart-line-variant'}
            />
          ),
          title: 'Progreso',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              color={color as string}
              size={22}
              source={focused ? 'account-circle' : 'account-circle-outline'}
            />
          ),
          title: 'Perfil',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
  },
  headerAction: {
    marginRight: spacing.xs,
    borderRadius: radii.pill,
  },
  headerActionContent: {
    minHeight: 44,
  },
});
