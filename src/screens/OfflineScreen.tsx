import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../../App';

type Nav = StackNavigationProp<RootStackParamList, 'Offline'>;

export default function OfflineScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.title}>No Connection</Text>
      <Text style={styles.sub}>
        MonsoonWatch needs an internet connection to fetch live radar and
        forecast data. Please check your Wi-Fi or mobile data and try again.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('Weather')}>
        <Text style={styles.btnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {fontSize: 64, marginBottom: 24},
  title: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  sub: {
    color: '#718096',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: {color: '#fff', fontWeight: '700', fontSize: 16},
});
