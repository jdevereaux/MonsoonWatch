import React, {useEffect} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';

import WeatherScreen from './src/screens/WeatherScreen';
import OfflineScreen from './src/screens/OfflineScreen';

export type RootStackParamList = {
  Weather: undefined;
  Offline: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  useEffect(() => {
    // Hide native splash after JS bundle loads
    SplashScreen.hide();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0f1e"
        translucent={false}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Weather"
          screenOptions={{headerShown: false}}>
          <Stack.Screen name="Weather" component={WeatherScreen} />
          <Stack.Screen name="Offline" component={OfflineScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#0a0f1e'},
});
