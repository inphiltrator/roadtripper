<script lang="ts">
  import { getSeasonalWarnings, getStateFromCoordinates } from '$lib/config/region';
  
  interface WeatherCondition {
    type: 'heat' | 'snow' | 'wind' | 'rain' | 'visibility';
    severity: 'low' | 'moderate' | 'high' | 'extreme';
    temperature?: number; // Fahrenheit
    condition: string;
    recommendation: string;
    validUntil?: Date;
    affectedAreas?: string[];
  }
  
  interface Props {
    location: { lat: number; lng: number; name?: string };
    conditions?: WeatherCondition[];
    class?: string;
    onClose?: () => void;
    compact?: boolean;
  }
  
  let {
    location,
    conditions = [],
    class: className = '',
    onClose,
    compact = false
  }: Props = $props();
  
  // Get seasonal warnings based on location and current date
  const currentDate = new Date();
  const seasonalWarnings = getSeasonalWarnings(location.lat, location.lng, currentDate);
  const currentState = getStateFromCoordinates(location.lat, location.lng);
  
  // Generate weather conditions if not provided
  const weatherConditions = conditions.length > 0 ? conditions : generateWeatherConditions();
  
  function generateWeatherConditions(): WeatherCondition[] {
    const month = currentDate.getMonth();
    const generatedConditions: WeatherCondition[] = [];
    
    // Summer heat warnings (May-September)
    if (month >= 4 && month <= 8) {
      const isDesertArea = currentState === 'AZ' || currentState === 'NV' || location.lat < 36.0;
      
      if (isDesertArea) {
        generatedConditions.push({
          type: 'heat',
          severity: 'extreme',
          temperature: 115,
          condition: 'Extreme Heat Warning',
          recommendation: 'Avoid outdoor activities between 10 AM - 6 PM. Carry extra water.',
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          affectedAreas: ['Desert regions', 'Low elevations']
        });
      } else {
        generatedConditions.push({
          type: 'heat',
          severity: 'high',
          temperature: 105,
          condition: 'Heat Advisory',
          recommendation: 'Stay hydrated and limit prolonged sun exposure.',
          validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000)
        });
      }
    }
    
    // Winter snow warnings (December-March)
    if (month >= 11 || month <= 2) {
      if (location.lat > 39.0 || currentState === 'UT') {
        generatedConditions.push({
          type: 'snow',
          severity: 'moderate',
          condition: 'Winter Weather Advisory',
          recommendation: 'Carry tire chains. Check road conditions before travel.',
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
          affectedAreas: ['Mountain passes', 'Elevations above 5000ft']
        });
      }
    }
    
    // Wind warnings for desert areas
    if (currentState === 'CA' && location.lat < 35.0) {
      generatedConditions.push({
        type: 'wind',
        severity: 'moderate',
        condition: 'Wind Advisory',
        recommendation: 'Use caution driving high-profile vehicles. Secure loose objects.',
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
        affectedAreas: ['Desert valleys', 'Mountain passes']
      });
    }
    
    return generatedConditions;
  }
  
  function getSeverityColor(severity: WeatherCondition['severity']): string {
    switch (severity) {
      case 'low': return 'border-l-blue-400 bg-blue-500/10 text-blue-100';
      case 'moderate': return 'border-l-yellow-400 bg-yellow-500/10 text-yellow-100';
      case 'high': return 'border-l-orange-400 bg-orange-500/10 text-orange-100';
      case 'extreme': return 'border-l-red-400 bg-red-500/10 text-red-100';
      default: return 'border-l-gray-400 bg-gray-500/10 text-gray-100';
    }
  }
  
  function getTypeIcon(type: WeatherCondition['type']): string {
    switch (type) {
      case 'heat': return '🔥';
      case 'snow': return '❄️';
      case 'wind': return '💨';
      case 'rain': return '🌧️';
      case 'visibility': return '🌫️';
      default: return '⚠️';
    }
  }
  
  function formatValidUntil(date: Date): string {
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Expires soon';
    if (diffHours < 24) return `Valid for ${diffHours} hours`;
    
    const diffDays = Math.round(diffHours / 24);
    return `Valid for ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
  
  function getRegionalContext(): string {
    if (!location.name && currentState) {
      return `${currentState} Region`;
    }
    return location.name || 'Current Location';
  }
</script>

<div class="border-l-4 p-4 space-y-4 {className}" style="background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05); border-radius: 1rem;">
  <!-- Header -->
  <div class="flex items-start justify-between">
    <div class="flex items-center space-x-3">
      <span class="text-2xl">🌡️</span>
      <div>
        <h3 class="font-bold text-white text-sm">Weather Alerts</h3>
        <p class="text-xs text-white/70">{getRegionalContext()}</p>
      </div>
    </div>
    
    {#if onClose}
      <button
        onclick={onClose}
        class="text-white/60 hover:text-white transition-colors"
        aria-label="Close weather alert"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    {/if}
  </div>

  <!-- Weather Conditions -->
  {#each weatherConditions as condition}
    <div class="border-l-4 p-3 space-y-2 {getSeverityColor(condition.severity)}" style="background-color: rgba(0, 0, 0, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.08); border-radius: 1rem;">
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-lg">{getTypeIcon(condition.type)}</span>
          <div>
            <div class="font-medium text-sm">{condition.condition}</div>
            {#if condition.temperature}
              <div class="text-xs opacity-80">Temperature: {condition.temperature}°F</div>
            {/if}
          </div>
        </div>
        
        {#if condition.validUntil}
          <div class="text-xs opacity-70">
            {formatValidUntil(condition.validUntil)}
          </div>
        {/if}
      </div>
      
      {#if !compact}
        <div class="text-xs opacity-90 leading-relaxed">
          {condition.recommendation}
        </div>
        
        {#if condition.affectedAreas && condition.affectedAreas.length > 0}
          <div class="flex flex-wrap gap-1 mt-2">
            {#each condition.affectedAreas as area}
              <span class="text-xs bg-white/20 rounded px-2 py-1 opacity-80">
                {area}
              </span>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/each}

  <!-- Regional Seasonal Warnings -->
  {#if seasonalWarnings.length > 0}
    <div class="border-t border-white/10 pt-3">
      <div class="flex items-center space-x-2 mb-2">
        <span class="text-sm">🌵</span>
        <span class="text-xs font-medium text-white/80">Southwest Travel Tips</span>
      </div>
      
      <div class="space-y-1">
        {#each seasonalWarnings as warning}
          <div class="text-xs text-white/70 bg-white/10 rounded px-2 py-1">
            {warning}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Emergency Contacts (Southwest Specific) -->
  {#if weatherConditions.some(c => c.severity === 'extreme')}
    <div class="border-t border-white/10 pt-3">
      <div class="flex items-center space-x-2 mb-2">
        <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-xs font-medium text-red-400">Emergency Resources</span>
      </div>
      
      <div class="text-xs text-white/70 space-y-1">
        <div class="flex justify-between">
          <span>Emergency:</span>
          <span class="font-mono">911</span>
        </div>
        <div class="flex justify-between">
          <span>Road Conditions:</span>
          <span class="font-mono">511</span>
        </div>
        {#if currentState === 'CA'}
          <div class="flex justify-between">
            <span>CA Travel Info:</span>
            <span class="font-mono">1-800-427-7623</span>
          </div>
        {:else if currentState === 'NV'}
          <div class="flex justify-between">
            <span>NV Road Conditions:</span>
            <span class="font-mono">1-877-687-6237</span>
          </div>
        {:else if currentState === 'UT'}
          <div class="flex justify-between">
            <span>UT Road Conditions:</span>
            <span class="font-mono">1-866-511-8824</span>
          </div>
        {:else if currentState === 'AZ'}
          <div class="flex justify-between">
            <span>AZ Road Conditions:</span>
            <span class="font-mono">1-888-411-7623</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Quick Actions -->
  {#if !compact && weatherConditions.length > 0}
    <div class="border-t border-white/10 pt-3">
      <div class="flex flex-wrap gap-2">
        <button class="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-2 transition-colors">
          📱 Share Alert
        </button>
        <button class="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-2 transition-colors">
          📍 Get Directions
        </button>
        <button class="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-2 transition-colors">
          ⏰ Set Reminder
        </button>
      </div>
    </div>
  {/if}
</div>
