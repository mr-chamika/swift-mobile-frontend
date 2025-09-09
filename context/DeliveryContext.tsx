import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type DeliveryStatus = 'idle' | 'not_started' | 'en_route' | 'arrived' | 'ended' | 'cancelled';

export type Delivery = {
  id: number;
  code: string;
  destination: string;
  expectedFee: number;
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
  endOngoing: (id: number) => void;
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

  const addDeliveryByCode = async (code: string) => {
    if (ongoingDelivery) return;
    try {
      const response = await fetch(`http://localhost:8080/deliveries/by-code?code=${code.trim()}`);
      if (!response.ok) throw new Error('Delivery not found');
      const delivery: Delivery = await response.json();
      if (delivery.status !== 'not_started') {
        alert('Delivery already added, try another one');
        setOngoingDelivery(null);
        return;
      }
      setOngoingDelivery(delivery);
    } catch (error) {
      alert('Failed to fetch delivery : ' + error);
    }
  };

  const cancelOngoing = useCallback(() => {
    setOngoingDelivery((current) => {
      if (!current) return current;
      if (current.status !== 'not_started') return current;
      return null;
    });
  }, []);

  const startOngoing = useCallback(async () => {
    if (!ongoingDelivery) return;

    try {
      // Update status to 'en_route' in backend
      await fetch(`http://localhost:8080/deliveries/changeStatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'en_route', startedAt: Date.now(), id: ongoingDelivery.id }),
      });
    } catch (err) {
      alert('Error changing status to en_route');
    }

    setOngoingDelivery((current) => {
      if (!current) return current;
      if (current.status !== 'not_started') return current;
      const started: Delivery = {
        ...current,
        status: 'en_route',
        startedAt: Date.now(),
      };

      // Open Google Maps deep link with destination in in-app browser
      const startingLocation = "Colombo";
      const encodedDest = encodeURIComponent(started.destination);
      const encodedOrigin = encodeURIComponent(startingLocation);
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDest}&travelmode=driving`;

      WebBrowser.openBrowserAsync(url);

      // Simulate arrival in 10 seconds, then close browser and update status
      if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
      arrivalTimerRef.current = setTimeout(async () => {
        WebBrowser.dismissBrowser();

        // Update status to 'arrived' in backend
        await fetch(`http://localhost:8080/deliveries/changeStatus`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'arrived', arrivedAt: Date.now(), id: current.id }),
        });

        setOngoingDelivery((curr) => (curr ? { ...curr, status: 'arrived', arrivedAt: Date.now() } : curr));
      }, 10000);

      return started;
    });
  }, [ongoingDelivery]);

  const endOngoing = useCallback(async (id: number) => {
    if (!ongoingDelivery || ongoingDelivery.status !== 'arrived') return;

    try {
      // Update status to 'ended' in backend
      const res = await fetch(`http://localhost:8080/deliveries/changeStatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended', endedAt: Date.now(), id }),
      });

      const x = await res.text();
      console.log(x);

      const ended: Delivery = { ...ongoingDelivery, status: 'ended', endedAt: Date.now() };
      setDeliveryHistory((prev) => [ended, ...prev]);
      setTotalEarnings((prev) => prev + ended.expectedFee);
      setOngoingDelivery(null);
    } catch (err) {
      alert('Error occurred when ending delivery');
    }
  }, [ongoingDelivery]);

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