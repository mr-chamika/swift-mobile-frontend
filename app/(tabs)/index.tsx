import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDelivery } from '@/context/DeliveryContext';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { addDeliveryByCode, ongoingDelivery, totalEarnings } = useDelivery();
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [scannerModule, setScannerModule] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (modalVisible) {
      import('expo-barcode-scanner')
        .then((mod) => {
          if (cancelled) return;
          setScannerModule(mod);
          setScannerAvailable(Boolean(mod?.BarCodeScanner));
        })
        .catch(() => {
          if (cancelled) return;
          setScannerModule(null);
          setScannerAvailable(false);
        });
    } else {
      setScannerModule(null);
      setScannerAvailable(false);
      setHasPermission(null);
      setScanned(false);
    }
    return () => {
      cancelled = true;
    };
  }, [modalVisible]);

  useEffect(() => {
    (async () => {
      try {
        if (scannerModule && scannerModule.requestPermissionsAsync) {
          const { status } = await scannerModule.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        }
      } catch (e) {
        setHasPermission(false);
      }
    })();
  }, [scannerModule]);

  const handleScanned = ({ data }: { type: string; data: string }) => {
    if (ongoingDelivery) {
      Alert.alert('Ongoing delivery', 'You already have an ongoing delivery.');
      return;
    }
    if (scanned) return;
    setScanned(true);
    addDeliveryByCode(data);
    setModalVisible(false);
  };

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
          <ThemedText>You already have an ongoing delivery.</ThemedText>
        ) : (
          <Button title="Add Delivery" onPress={() => setModalVisible(true)} disabled={addDisabled} />
        )}

        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <ThemedText type="title">Add Delivery</ThemedText>
            <View style={styles.section}>
              <ThemedText type="subtitle">Scan QR Code</ThemedText>
              {!scannerAvailable ? (
                <ThemedText>QR scanning not available in this build.</ThemedText>
              ) : hasPermission === null ? (
                <ThemedText>Requesting camera permission...</ThemedText>
              ) : hasPermission === false ? (
                <ThemedText>No access to camera</ThemedText>
              ) : (
                <View style={styles.scannerContainer}>
                  {scannerModule?.BarCodeScanner ? (
                    <scannerModule.BarCodeScanner
                      onBarCodeScanned={scanned ? undefined : (e: any) => handleScanned({ data: e.data, type: String(e.type) })}
                      style={styles.scanner}
                    />
                  ) : null}
                  {scanned && (
                    <TouchableOpacity onPress={() => setScanned(false)} style={styles.scanAgain}>
                      <ThemedText>Tap to Scan Again</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle">Or enter code manually</ThemedText>
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
