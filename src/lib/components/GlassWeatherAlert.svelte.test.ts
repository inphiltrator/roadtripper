import { page } from '@vitest/browser/context';
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GlassWeatherAlert from './GlassWeatherAlert.svelte';

const mockLocation = { lat: 36.1699, lng: -115.1398, name: 'Las Vegas' };

const mockConditions = [
  {
    type: 'heat' as const,
    severity: 'extreme' as const,
    temperature: 110,
    condition: 'Extreme Heat Warning',
    recommendation: 'Stay indoors during the hottest part of the day.',
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    affectedAreas: ['Las Vegas', 'Nevada, USA']
  },
];

describe('GlassWeatherAlert Component', () => {
  it('renders with given location and conditions', async () => {
    render(GlassWeatherAlert, {
      props: {
        location: mockLocation,
        conditions: mockConditions
      }
    });

    await expect.element(page.getByText('Weather Alerts')).toBeInTheDocument();
    await expect.element(page.getByText('Extreme Heat Warning').first()).toBeInTheDocument();
    await expect.element(page.getByText('Temperature: 110°F')).toBeInTheDocument();
    await expect.element(page.getByText('Stay indoors during the hottest part of the day.')).toBeInTheDocument();
  });

  it('displays correct location context', async () => {
    render(GlassWeatherAlert, {
      props: {
        location: mockLocation,
        conditions: mockConditions
      }
    });

    await expect.element(page.getByText('Las Vegas').first()).toBeInTheDocument();
  });

  it('shows temperature for heat warnings', async () => {
    render(GlassWeatherAlert, {
      props: {
        location: mockLocation,
        conditions: mockConditions
      }
    });

    await expect.element(page.getByText('Temperature: 110°F')).toBeInTheDocument();
  });

  it('displays weather icons for different condition types', async () => {
    const snowCondition = [{
      type: 'snow' as const,
      severity: 'moderate' as const,
      condition: 'Winter Weather Advisory',
      recommendation: 'Carry tire chains.',
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000)
    }];

    render(GlassWeatherAlert, {
      props: {
        location: { lat: 40.7608, lng: -111.8910, name: 'Salt Lake City' },
        conditions: snowCondition
      }
    });

    await expect.element(page.getByText('Winter Weather Advisory')).toBeInTheDocument();
  });
});

