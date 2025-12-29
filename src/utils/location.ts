/**
 * Location utilities
 * Functions for getting and formatting location data
 */

import * as Location from 'expo-location';
import { logger } from './logger';

export type LocationResult = {
  success: boolean;
  location?: string;
  error?: string;
};

/**
 * Get current location and reverse geocode to city/region name
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission denied',
      };
    }

    // Get current position
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Reverse geocode to get address
    const [address] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    if (!address) {
      return {
        success: false,
        error: 'Could not determine location',
      };
    }

    // Format location string (city, region or city, country)
    const parts: string[] = [];

    if (address.city) {
      parts.push(address.city);
    } else if (address.subregion) {
      parts.push(address.subregion);
    }

    if (address.region && address.region !== address.city) {
      parts.push(address.region);
    } else if (address.country && parts.length === 0) {
      parts.push(address.country);
    }

    const locationString = parts.join(', ') || address.country || 'Unknown location';

    return {
      success: true,
      location: locationString,
    };
  } catch (error) {
    logger.error('location', 'Failed to get current location:', error);
    return {
      success: false,
      error: 'Failed to get location',
    };
  }
}
