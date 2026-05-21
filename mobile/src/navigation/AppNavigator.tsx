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
      tabBarActiveTintColor: "#3b82f6",
      tabBarInactiveTintColor: "gray",

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

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="Stocks"
      component={StocksScreen}
      options={{ tabBarLabel: "Mercado" }}
    />
    <Tab.Screen
      name="Alerts"
      component={AlertsScreen}
      options={{ tabBarLabel: "Mis Alertas" }}
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
