import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDelivery } from '@/context/DeliveryContext';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

export default function HistoryScreen() {
  const { deliveryHistory } = useDelivery();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F2F2F2', dark: '#222222' }}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Delivery History</ThemedText>
        <FlatList
          data={deliveryHistory}
          keyExtractor={(item) => item.id}
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
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
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


