import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDelivery } from '@/context/DeliveryContext';
import React, { useState } from 'react';
import { Alert, Button, Modal, StyleSheet, TextInput, View } from 'react-native';

export default function HomeScreen() {
  const { addDeliveryByCode, ongoingDelivery, totalEarnings } = useDelivery();
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualCode, setManualCode] = useState('');

  const onAddByManual = () => {
    if (ongoingDelivery) return;
    if (!manualCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a delivery code.');
      return;
    }

    addDeliveryByCode(manualCode.trim());
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
        {addDisabled ? (
          <ThemedText>You already have an ongoing delivery, Check Ongoing Tab.</ThemedText>
        ) : (
          <Button title="Add Delivery" onPress={() => setModalVisible(true)} disabled={addDisabled} />
        )}

        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <ThemedText type="title">Add Delivery</ThemedText>


            <View style={styles.section}>

              <TextInput
                style={styles.input}
                placeholder="Enter code"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
              />
              <Button title="Add" onPress={onAddByManual} />
            </View>

            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </Modal>
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
});