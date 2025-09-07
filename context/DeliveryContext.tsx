import * as Linking from 'expo-linking';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type DeliveryStatus = 'idle' | 'not_started' | 'en_route' | 'arrived' | 'ended' | 'cancelled';

export type Delivery = {
  id: string;
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

function generateMockDelivery(code: string): Delivery {
  const feeBase = 450;
  const hash = Array.from(code).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const expectedFee = feeBase + (hash % 550); // 450 - 999
  const destinations = [
    'Colombo Fort, Sri Lanka',
    'Galle Face Green, Colombo',
    'Kandy City Center, Kandy',
    'Gampaha Railway Station, Gampaha',
    'Matara Bus Stand, Matara',
  ];
  const destination = destinations[hash % destinations.length];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    code,
    destination,
    expectedFee,
    createdAt: Date.now(),
    status: 'not_started',
  };
}

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

  const addDeliveryByCode = useCallback((code: string) => {
    if (ongoingDelivery) return; // Prevent adding when already ongoing
    const newDelivery = generateMockDelivery(code.trim());
    setOngoingDelivery(newDelivery);
  }, [ongoingDelivery]);

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
      const encodedDest = encodeURIComponent(started.destination);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=driving`;
      Linking.openURL(url).catch(() => {});

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


