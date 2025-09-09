import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type DeliveryStatus = 'idle' | 'not_started' | 'en_route' | 'arrived' | 'ended' | 'cancelled';

export type Delivery = {
  id: number;
  code: string;
  destination: string; // Free-form address for Google Maps deep link
  expectedFee: number; // In LKR or any currency, just a number client-side
  createdAt: number;
  startedAt?: number;
  arrivedAt?: number;
  endedAt?: number;
  status: DeliveryStatus;
};

type DeliveryContextValue = {
  ongoingDelivery: Delivery | null;
  deliveryHistory: Delivery[];
  totalEarnings: number;
  addDeliveryByCode: (code: string) => void;
  cancelOngoing: () => void;
  startOngoing: () => void;
  endOngoing: () => void;
};

const DeliveryContext = createContext<DeliveryContextValue | undefined>(undefined);

export const DeliveryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [ongoingDelivery, setOngoingDelivery] = useState<Delivery | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
    };
  }, []);

  // Remove or comment out generateMockDelivery if not needed

  const addDeliveryByCode = async (code: string) => {
    if (ongoingDelivery) return; // Prevent adding when already ongoing
    try {
      console.log('xx')
      const response = await fetch(`http://localhost:8080/deliveries/by-code?code=${code.trim()}`);
      if (!response.ok) throw new Error('Delivery not found');

      const delivery: Delivery = await response.json();
      console.log(delivery)
      setOngoingDelivery(delivery);
    } catch (error) {
      alert('Failed to fetch delivery : ' + error);
    }
  };

  const cancelOngoing = useCallback(() => {
    setOngoingDelivery((current) => {
      if (!current) return current;
      if (current.status !== 'not_started') return current; // Only allow cancel before start
      return null;
    });
  }, []);

  const startOngoing = useCallback(() => {
    setOngoingDelivery((current) => {
      if (!current) return current;
      if (current.status !== 'not_started') return current;
      const started: Delivery = {
        ...current,
        status: 'en_route',
        startedAt: Date.now(),
      };

      // Open Google Maps deep link with destination
      const startingLocation = "Colombo";
      const encodedDest = encodeURIComponent(started.destination);
      // Example: startingLocation is a string like "Colombo" or "7.1976765,80.1205763"
      const encodedOrigin = encodeURIComponent(startingLocation);
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDest}&travelmode=driving`;

      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            // ✅ Web fallback
            window.open(url, "_blank");
          }
        })
        .catch(() => {
          // ✅ In case Linking fails
          window.open(url, "_blank");
        });

      // Simulate arrival in 10 seconds
      if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
      arrivalTimerRef.current = setTimeout(() => {
        setOngoingDelivery((curr) => (curr ? { ...curr, status: 'arrived', arrivedAt: Date.now() } : curr));
      }, 10000);

      return started;
    });
  }, []);

  const endOngoing = useCallback(() => {
    setOngoingDelivery((current) => {
      if (!current) return current;
      if (current.status !== 'arrived') return current;
      const ended: Delivery = { ...current, status: 'ended', endedAt: Date.now() };
      setDeliveryHistory((prev) => [ended, ...prev]);
      setTotalEarnings((prev) => prev + ended.expectedFee);
      return null; // Clear ongoing after ending
    });
  }, []);

  const value = useMemo<DeliveryContextValue>(() => ({
    ongoingDelivery,
    deliveryHistory,
    totalEarnings,
    addDeliveryByCode,
    cancelOngoing,
    startOngoing,
    endOngoing,
  }), [ongoingDelivery, deliveryHistory, totalEarnings, addDeliveryByCode, cancelOngoing, startOngoing, endOngoing]);

  return (
    <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>
  );
};

export function useDelivery(): DeliveryContextValue {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error('useDelivery must be used within a DeliveryProvider');
  return ctx;
}


