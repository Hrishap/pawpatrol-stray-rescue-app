import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors, fonts } from '@/theme';

export default function ReporterTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      initialRouteName="map"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted50,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 10.5 },
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.hairline08 },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: t('navMap'),
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t('navCases'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="adopt"
        options={{
          title: t('navAdopt'),
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shelters"
        options={{
          title: t('navShelters'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navProfile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
