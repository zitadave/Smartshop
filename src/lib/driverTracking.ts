/**
 * Smart Shop — Driver Live Tracking System
 * 
 * Simulates real-time driver location updates for in-transit orders.
 * Uses geolocation simulation around Ethiopian cities.
 * Provides ETA calculations and route visualization.
 */

import { generateId } from './utils';
import { type OrderFulfillment } from './orderFulfillment';

// ============================================================
// Types
// ============================================================

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  plateNumber: string;
  photo?: string;
  rating: number;
  totalDeliveries: number;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number; // km/h
  heading?: number; // degrees
}

export interface DriverTracking {
  orderNumber: string;
  driver: Driver;
  currentLocation: LocationPoint;
  route: LocationPoint[];
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  estimatedDistance: number; // km
  estimatedDuration: number; // minutes
  progress: number; // 0-100
  status: 'en_route' | 'approaching' | 'arrived' | 'delivered';
  lastUpdated: string;
}

// ============================================================
// Ethiopian City Coordinates
// ============================================================

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Addis Ababa': { lat: 9.0320, lng: 38.7469 },
  'Bahir Dar': { lat: 11.5850, lng: 37.3900 },
  'Adama': { lat: 8.5400, lng: 39.2700 },
  'Hawassa': { lat: 7.0500, lng: 38.4700 },
  'Gondar': { lat: 12.6000, lng: 37.4600 },
  'Mekelle': { lat: 13.4967, lng: 39.4753 },
  'Dire Dawa': { lat: 9.5931, lng: 41.8661 },
  'Jimma': { lat: 7.6800, lng: 36.8300 },
};

// ============================================================
// Driver Pool
// ============================================================

const DRIVER_POOL: Driver[] = [
  { id: 'd1', name: 'Abebe K.', phone: '+251-911-123456', vehicleType: 'Motorcycle', plateNumber: 'AA-1234', rating: 4.8, totalDeliveries: 342 },
  { id: 'd2', name: 'Selam W.', phone: '+251-922-654321', vehicleType: 'Van', plateNumber: 'AA-5678', rating: 4.9, totalDeliveries: 512 },
  { id: 'd3', name: 'Biruk T.', phone: '+251-933-789012', vehicleType: 'Motorcycle', plateNumber: 'AA-9012', rating: 4.7, totalDeliveries: 289 },
  { id: 'd4', name: 'Hanna M.', phone: '+251-944-567890', vehicleType: 'Truck', plateNumber: 'AA-3456', rating: 4.6, totalDeliveries: 178 },
  { id: 'd5', name: 'Dawit E.', phone: '+251-955-789012', vehicleType: 'Motorcycle', plateNumber: 'AA-7890', rating: 5.0, totalDeliveries: 621 },
];

// ============================================================
// Storage
// ============================================================

const TRACKING_KEY = 'ss_driver_tracking';

export function getAllTracking(): Record<string, DriverTracking> {
  try { return JSON.parse(localStorage.getItem(TRACKING_KEY) || '{}'); } catch { return {}; }
}

export function getTracking(orderNumber: string): DriverTracking | null {
  const all = getAllTracking();
  return all[orderNumber] || null;
}

export function saveTracking(tracking: DriverTracking): void {
  const all = getAllTracking();
  all[tracking.orderNumber] = tracking;
  try { localStorage.setItem(TRACKING_KEY, JSON.stringify(all)); } catch {}
}

// ============================================================
// Create tracking for an order
// ============================================================

export function createDriverTracking(
  orderNumber: string,
  destinationCity: string,
  originCity: string = 'Addis Ababa'
): DriverTracking {
  const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
  const origin = CITY_COORDS[originCity] || CITY_COORDS['Addis Ababa'];
  const dest = CITY_COORDS[destinationCity] || CITY_COORDS['Addis Ababa'];

  // Calculate approximate distance (simple Haversine)
  const R = 6371;
  const dLat = (dest.lat - origin.lat) * Math.PI / 180;
  const dLng = (dest.lng - origin.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(origin.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

  // Start location near origin
  const startLat = origin.lat + (Math.random() - 0.5) * 0.05;
  const startLng = origin.lng + (Math.random() - 0.5) * 0.05;

  // Generate route points (simplified)
  const route: LocationPoint[] = [];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    route.push({
      lat: origin.lat + (dest.lat - origin.lat) * progress + (Math.random() - 0.5) * 0.02,
      lng: origin.lng + (dest.lng - origin.lng) * progress + (Math.random() - 0.5) * 0.02,
      timestamp: new Date(Date.now() - (steps - i) * 3600000).toISOString(),
    });
  }

  return {
    orderNumber,
    driver,
    currentLocation: { lat: startLat, lng: startLng, timestamp: new Date().toISOString() },
    route,
    origin: { ...origin, label: originCity },
    destination: { ...dest, label: destinationCity },
    estimatedDistance: distance,
    estimatedDuration: Math.round(distance / 30 * 60), // ~30km/h avg
    progress: Math.round(Math.random() * 40),
    status: 'en_route',
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================
// Simulate Live Location Update
// ============================================================

export function simulateDriverMove(orderNumber: string): DriverTracking | null {
  const tracking = getTracking(orderNumber);
  if (!tracking) return null;

  const dest = tracking.destination;
  const origin = tracking.origin;

  // Move driver closer to destination
  const moveAmount = 0.01 + Math.random() * 0.03;
  const newLat = tracking.currentLocation.lat + (dest.lat - origin.lat) / 100 * moveAmount * 5;
  const newLng = tracking.currentLocation.lng + (dest.lng - origin.lng) / 100 * moveAmount * 5;

  // Calculate new progress
  const totalLat = Math.abs(dest.lat - origin.lat);
  const totalLng = Math.abs(dest.lng - origin.lng);
  const currentLat = Math.abs(newLat - origin.lat);
  const currentLng = Math.abs(newLng - origin.lng);
  const progress = Math.min(100, Math.round(((currentLat / totalLat) + (currentLng / totalLng)) / 2 * 100));

  // Add to route
  const newPoint: LocationPoint = {
    lat: newLat, lng: newLng,
    timestamp: new Date().toISOString(),
    speed: 25 + Math.random() * 20,
    heading: Math.atan2(dest.lng - origin.lng, dest.lat - origin.lat) * 180 / Math.PI,
  };

  const updated: DriverTracking = {
    ...tracking,
    currentLocation: newPoint,
    route: [...tracking.route, newPoint].slice(-20),
    progress,
    status: progress >= 95 ? 'arrived' : progress >= 70 ? 'approaching' : 'en_route',
    lastUpdated: new Date().toISOString(),
  };

  if (progress >= 100) {
    updated.status = 'delivered';
  }

  saveTracking(updated);
  return updated;
}

// ============================================================
// Format ETA for display
// ============================================================

export function formatETA(minutes: number): string {
  if (minutes < 1) return 'Arriving now';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km} km`;
}
