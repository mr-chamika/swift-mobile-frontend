import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDelivery } from '@/context/DeliveryContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';

export default function OngoingScreen() {
  const { ongoingDelivery, cancelOngoing, startOngoing, endOngoing } = useDelivery();
  const router = useRouter();

  const handleEnd = () => {
    if (!ongoingDelivery || ongoingDelivery.status !== 'arrived') {
      Alert.alert('Not arrived yet', 'You can end the delivery once you arrive.');
      return;
    }
    endOngoing(ongoingDelivery.id);
    router.push('/thank-you');
  };

  if (!ongoingDelivery) {
    return (
      <ParallaxScrollView>
        <ThemedView style={styles.container}>
          <ThemedText>No ongoing delivery.</ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  const disableCancel = ongoingDelivery.status !== 'not_started';
  const disableStart = ongoingDelivery.status !== 'not_started';
  const canEnd = ongoingDelivery.status === 'arrived';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Current Delivery</ThemedText>
        <ThemedText>Code: {ongoingDelivery.code}</ThemedText>
        <ThemedText>Destination: {ongoingDelivery.destination}</ThemedText>
        <ThemedText>Expected Fee: LKR {ongoingDelivery.expectedFee.toFixed(2)}</ThemedText>
        <ThemedText>Status: {ongoingDelivery.status}</ThemedText>

        <View style={styles.buttonRow}>
          <Button title="Start" onPress={startOngoing} disabled={disableStart} />
          <Button title="End" onPress={handleEnd} disabled={!canEnd} />
          <Button title="Cancel" onPress={cancelOngoing} disabled={disableCancel} color="#cc0000" />
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
});


