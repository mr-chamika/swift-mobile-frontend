import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDelivery } from '@/context/DeliveryContext';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Button, Image, StyleSheet, View } from 'react-native';

export default function OngoingScreen() {
  const { ongoingDelivery, cancelOngoing, startOngoing, endOngoing } = useDelivery();
  const router = useRouter();
  const [image, setImage] = React.useState<string | null>(null);
  const [showPicker, setShowPicker] = React.useState(false);
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);

  const handleEnd = () => {
    if (!ongoingDelivery || ongoingDelivery.status !== 'arrived') {
      Alert.alert('Not arrived yet', 'You can end the delivery once you arrive.');
      return;
    }
    setShowPicker(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null); // <-- Store base64 string

    }
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
  const confirmEnd = async () => {
    // Optionally upload the image to your backend here
    // Example: use fetch or axios to POST the image file

    endOngoing(ongoingDelivery.id, imageBase64);
    setShowPicker(false);
    setImage(null);
    setImageBase64(null);
    router.push('/thank-you');
  };

  const disableCancel = ongoingDelivery.status !== 'not_started';
  const disableStart = ongoingDelivery.status !== 'not_started';
  const canEnd = ongoingDelivery.status === 'arrived';

  return (
    <ParallaxScrollView headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}>
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

        {/* Image picker modal */}
        {showPicker && (
          <View style={{ marginTop: 24 }}>
            <Button title="Pick Image" onPress={pickImage} />
            {image && (
              <View style={{ marginVertical: 12 }}>
                <ThemedText>Selected Image:</ThemedText>
                <Image source={{ uri: image }} style={{ width: '100%', height: 100, borderRadius: 8 }} />
              </View>
            )}
            <Button title="Confirm End Delivery" onPress={confirmEnd} disabled={!image} />
            <Button title="Cancel" onPress={() => { setShowPicker(false); setImage(null); }} color="#cc0000" />
          </View>
        )}
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


