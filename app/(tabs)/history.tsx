import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

export type Delivery = {
  id: number;
  code: string;
  destination: string; // Free-form address for Google Maps deep link
  expectedFee: number; // In LKR or any currency, just a number client-side
  createdAt: number;
  startedAt?: number;
  arrivedAt?: number;
  endedAt?: number;
  status: string;
};

export default function HistoryScreen() {
  const [endedDeliveries, setEndedDeliveries] = useState<Delivery[]>([]);

  useFocusEffect(

    useCallback(() => {

      const getHistory = async () => {

        const status = "ended";

        const res = await fetch(`http://localhost:8080/deliveries/ended?status=${status}`)

        const data = await res.json();
        // console.log(data)
        setEndedDeliveries(data)

      }
      getHistory()
    }, [])

  )

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Delivery History</ThemedText>
      <FlatList
        data={endedDeliveries}
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
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    flex: 1,
    marginTop: 40
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