import { writable } from 'svelte/store';
import type { Route } from '$lib/types';

export const elevationProfile = writable<Route['elevation'] | null>(null);
export const temperatureGradient = writable<{ min: number; max: number } | null>(null);

// Dummy function to simulate fetching elevation data
export async function fetchElevationData(routeId: string): Promise<Route['elevation']> {
  // Example values
  return {
    gain: 1500,
    loss: 1200,
    max: 3500,
    min: 1000,
  };
}

// Dummy function to simulate fetching temperature gradient
export async function fetchTemperature(routeId: string): Promise<{ min: number; max: number }> {
  // Example values
  return { min: 75, max: 105 };
}

