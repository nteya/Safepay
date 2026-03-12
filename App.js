// App.js
import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SystemUI from "expo-system-ui";
import * as NavigationBar from "expo-navigation-bar";

// ✅ Import Firebase setup
import "./firebase";

import SplashScreen from "./SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
import EvidenceScreen from "./screens/EvidenceScreen";
import EwalletScreen from "./screens/EwalletScreen";
import AICheckScreen from "./screens/AICheckScreen";

const BG = "#0B0B0F";

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BG,
    card: BG,
    primary: "#5FE1B9",
    text: "#EAEAF0",
    border: BG,
  },
};

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Keep native surfaces aligned with our dark UI
    SystemUI.setBackgroundColorAsync(BG);
    NavigationBar.setBackgroundColorAsync(BG);
    NavigationBar.setButtonStyleAsync("light");
  }, []);

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: BG },
          orientation: "portrait_up",
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Ewallet" component={EwalletScreen} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="Evidence" component={EvidenceScreen} />
        <Stack.Screen name="AICheck" component={AICheckScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
