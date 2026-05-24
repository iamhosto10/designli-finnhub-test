import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import StocksScreen from "../screens/StocksScreen";
import AlertsScreen from "../screens/AlertsScreen";

import { Ionicons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,

      tabBarStyle: {
        backgroundColor: "#0f172a",
        borderTopColor: "#1e293b",
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 10,
        paddingTop: 8,
      },

      tabBarActiveTintColor: "#3b82f6",
      tabBarInactiveTintColor: "#475569",

      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.3,
      },

      tabBarActiveBackgroundColor: "transparent",

      tabBarIcon: ({ color, size, focused }) => {
        let iconName:
          | "trending-up"
          | "trending-up-outline"
          | "notifications"
          | "notifications-outline";

        if (route.name === "Stocks") {
          iconName = focused ? "trending-up" : "trending-up-outline";
        } else {
          iconName = focused ? "notifications" : "notifications-outline";
        }

        return (
          <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
        );
      },
    })}
  >
    <Tab.Screen
      name="Stocks"
      component={StocksScreen}
      options={{ tabBarLabel: "Market" }}
    />
    <Tab.Screen
      name="Alerts"
      component={AlertsScreen}
      options={{ tabBarLabel: "My Alerts" }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
