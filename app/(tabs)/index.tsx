import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { Delivery } from '@/context/DeliveryContext';
import { useDelivery } from '@/context/DeliveryContext';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { addDeliveryByCode, ongoingDelivery, totalEarnings } = useDelivery();
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [Deliveries, setDeliveries] = useState<Delivery[]>([{
    id: 2,
    code: 'DEL-002',
    destination: 'Kandy',
    expectedFee: 2000,
    createdAt: 1695283200000,
    startedAt: 1695285000000,
    arrivedAt: 1695285600000,
    endedAt: undefined,
    status: 'arrived',
  },
  {
    id: 2,
    code: 'DEL-002',
    destination: 'Kandy',
    expectedFee: 2000,
    createdAt: 1695283200000,
    startedAt: 1695285000000,
    arrivedAt: 1695285600000,
    endedAt: undefined,
    status: 'arrived',
  }
  ]);

  useFocusEffect(

    useCallback(() => {

      const get = async () => {

        const res = await fetch(`http://localhost:8088/deliveries/available`)

        const data = await res.json();
        // console.log(data)
        setDeliveries(data)

      }
      get()
    }, [])

  )

  const onAddByManual = (code: string) => {
    if (ongoingDelivery) return;
    if (!manualCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a delivery code.');
      return;
    }

    addDeliveryByCode(code);
    setManualCode('');
    setModalVisible(false);

  };

  const addDisabled = Boolean(ongoingDelivery);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">SwiftTrack Driver</ThemedText>
        <ThemedText>Total Earnings: LKR {totalEarnings.toFixed(2)}</ThemedText>
        {/* {addDisabled ? (
          <ThemedText>You already have an ongoing delivery, Check Ongoing Tab.</ThemedText>
        ) : (
          <Button title="Add Delivery" onPress={() => setModalVisible(true)} disabled={addDisabled} />
        )} */}

        {/* <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}> */}

        <FlatList
          data={Deliveries}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<ThemedText>No deliveries completed yet.</ThemedText>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ThemedText type="defaultSemiBold">{item.destination}</ThemedText>
              <ThemedText>Code: {item.code}</ThemedText>
              <ThemedText>Fee: LKR {item.expectedFee.toFixed(2)}</ThemedText>
              {item.endedAt ? (
                <ThemedText>Ended: {new Date(item.endedAt).toLocaleString()}</ThemedText>
              ) : null}
              <Button title="Add" onPress={() => onAddByManual(item.code)} />

            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />


      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  scannerContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  scanner: {
    width: '100%',
    height: 260,
  },
  scanAgain: {
    alignItems: 'center',
    padding: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3333',
    marginBottom: 12,
    gap: 4,
  },
});