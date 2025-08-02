<script lang="ts">
  interface ElevationPoint {
    distance: number; // in miles
    elevation: number; // in feet
    lat: number;
    lng: number;
    gradient?: number; // percentage grade
    surface?: 'paved' | 'gravel' | 'dirt';
    hazards?: string[]; // e.g., ['steep grade', 'narrow road', 'wildlife crossing']
  }
  
  interface Props {
    elevationData?: ElevationPoint[];
    routeName?: string;
    totalDistance?: number;
    maxElevation?: number;
    minElevation?: number;
    elevationGain?: number;
    elevationLoss?: number;
    class?: string;
    compact?: boolean;
    showGradient?: boolean;
    showHazards?: boolean;
    onPointHover?: (point: ElevationPoint | null) => void;
    onPointClick?: (point: ElevationPoint) => void;
  }
  
  let {
    elevationData = [],
    routeName = 'Route Elevation Profile',
    totalDistance,
    maxElevation,
    minElevation,
    elevationGain,
    elevationLoss,
    class: className = '',
    compact = false,
    showGradient = true,
    showHazards = true,
    onPointHover,
    onPointClick
  }: Props = $props();
  
  // Generate sample Southwest elevation data if none provided
  const sampleElevationData: ElevationPoint[] = [
    { distance: 0, elevation: 2100, lat: 34.0522, lng: -118.2437, gradient: 0, surface: 'paved' },
    { distance: 5, elevation: 2200, lat: 34.0622, lng: -118.1437, gradient: 2, surface: 'paved' },
    { distance: 15, elevation: 2800, lat: 34.1122, lng: -118.0437, gradient: 4, surface: 'paved' },
    { distance: 25, elevation: 3500, lat: 34.1622, lng: -117.9437, gradient: 2.8, surface: 'paved', hazards: ['steep grade'] },
    { distance: 35, elevation: 4200, lat: 34.2122, lng: -117.8437, gradient: 2, surface: 'paved' },
    { distance: 50, elevation: 5800, lat: 34.3122, lng: -117.6437, gradient: 3.2, surface: 'paved', hazards: ['narrow road'] },
    { distance: 65, elevation: 7200, lat: 34.4122, lng: -117.4437, gradient: 2.1, surface: 'paved' },
    { distance: 75, elevation: 8100, lat: 34.4622, lng: -117.3437, gradient: 1.2, surface: 'paved', hazards: ['wildlife crossing'] },
    { distance: 85, elevation: 7800, lat: 34.5122, lng: -117.2437, gradient: -0.4, surface: 'paved' },
    { distance: 95, elevation: 6900, lat: 34.5622, lng: -117.1437, gradient: -0.9, surface: 'paved' },
    { distance: 110, elevation: 5200, lat: 34.6622, lng: -116.9437, gradient: -1.5, surface: 'paved' },
    { distance: 125, elevation: 3800, lat: 34.7622, lng: -116.7437, gradient: -1.1, surface: 'paved' },
    { distance: 140, elevation: 2400, lat: 34.8622, lng: -116.5437, gradient: -1, surface: 'paved' },
    { distance: 150, elevation: 2100, lat: 34.9122, lng: -116.4437, gradient: -0.2, surface: 'paved' }
  ];
  
  const data = elevationData.length > 0 ? elevationData : sampleElevationData;
  
  // Calculate stats if not provided
  const calculatedMaxElevation = maxElevation ?? Math.max(...data.map(p => p.elevation));
  const calculatedMinElevation = minElevation ?? Math.min(...data.map(p => p.elevation));
  const calculatedTotalDistance = totalDistance ?? Math.max(...data.map(p => p.distance));
  
  const calculatedElevationGain = elevationGain ?? data.reduce((gain, point, index) => {
    if (index === 0) return 0;
    const diff = point.elevation - data[index - 1].elevation;
    return gain + (diff > 0 ? diff : 0);
  }, 0);
  
  const calculatedElevationLoss = elevationLoss ?? data.reduce((loss, point, index) => {
    if (index === 0) return 0;
    const diff = data[index - 1].elevation - point.elevation;
    return loss + (diff > 0 ? diff : 0);
  }, 0);
  
  // Chart dimensions
  const chartWidth = compact ? 300 : 500;
  const chartHeight = compact ? 120 : 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  
  // Scales
  function xScale(distance: number): number {
    return (distance / calculatedTotalDistance) * (chartWidth - padding.left - padding.right) + padding.left;
  }
  
  function yScale(elevation: number): number {
    const range = calculatedMaxElevation - calculatedMinElevation;
    const normalized = (elevation - calculatedMinElevation) / range;
    return chartHeight - padding.bottom - (normalized * (chartHeight - padding.top - padding.bottom));
  }
  
  // Generate path for elevation profile
  const pathData = data.map((point, index) => {
    const x = xScale(point.distance);
    const y = yScale(point.elevation);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Generate area path for filling
  const areaPath = pathData + 
    ` L ${xScale(data[data.length - 1].distance)} ${chartHeight - padding.bottom}` +
    ` L ${xScale(data[0].distance)} ${chartHeight - padding.bottom} Z`;
  
  // Get gradient color based on steepness
  function getGradientColor(gradient: number): string {
    const absGradient = Math.abs(gradient);
    if (absGradient < 2) return '#22C55E'; // green - easy
    if (absGradient < 4) return '#EAB308'; // yellow - moderate
    if (absGradient < 6) return '#F97316'; // orange - difficult
    return '#EF4444'; // red - very difficult
  }
  
  // Get surface icon
  function getSurfaceIcon(surface: string): string {
    switch (surface) {
      case 'paved': return '🛣️';
      case 'gravel': return '⚪';
      case 'dirt': return '🟤';
      default: return '❓';
    }
  }
  
  // Format elevation
  function formatElevation(elevation: number): string {
    return `${elevation.toLocaleString()} ft`;
  }
  
  // Format distance
  function formatDistance(distance: number): string {
    return `${distance.toFixed(1)} mi`;
  }
  
  // Format gradient
  function formatGradient(gradient: number): string {
    return `${gradient >= 0 ? '+' : ''}${gradient.toFixed(1)}%`;
  }
  
  // Get difficulty level based on elevation and gradient
  function getDifficultyLevel(): { level: string; color: string; description: string } {
    const maxGradient = Math.max(...data.map(p => Math.abs(p.gradient || 0)));
    const elevationRange = calculatedMaxElevation - calculatedMinElevation;
    
    if (maxGradient >= 6 || elevationRange > 6000) {
      return { 
        level: 'Very Difficult', 
        color: 'text-red-300', 
        description: 'Steep grades, high altitude changes' 
      };
    } else if (maxGradient >= 4 || elevationRange > 4000) {
      return { 
        level: 'Difficult', 
        color: 'text-orange-300', 
        description: 'Moderate grades, significant elevation changes' 
      };
    } else if (maxGradient >= 2 || elevationRange > 2000) {
      return { 
        level: 'Moderate', 
        color: 'text-yellow-300', 
        description: 'Some hills, moderate elevation changes' 
      };
    } else {
      return { 
        level: 'Easy', 
        color: 'text-green-300', 
        description: 'Mostly flat, minimal elevation changes' 
      };
    }
  }
  
  const difficulty = getDifficultyLevel();
  
  // Hover state
  let hoveredPoint: ElevationPoint | null = $state(null);
  let hoveredPointIndex: number = $state(-1);
  
  function handleMouseMove(event: MouseEvent) {
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Find closest point
    let closestIndex = -1;
    let closestDistance = Infinity;
    
    data.forEach((point, index) => {
      const pointX = xScale(point.distance);
      const distance = Math.abs(x - pointX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    if (closestDistance < 20) { // 20px tolerance
      hoveredPoint = data[closestIndex];
      hoveredPointIndex = closestIndex;
      onPointHover?.(hoveredPoint);
    } else {
      hoveredPoint = null;
      hoveredPointIndex = -1;
      onPointHover?.(null);
    }
  }
  
  function handleMouseLeave() {
    hoveredPoint = null;
    hoveredPointIndex = -1;
    onPointHover?.(null);
  }
  
  function handlePointClick(point: ElevationPoint) {
    onPointClick?.(point);
  }
</script>

<div class="p-4 space-y-4 {className}" style="background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05); border-radius: 1rem;">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <span class="text-2xl">⛰️</span>
      <div>
        <h3 class="font-bold text-white text-lg">{routeName}</h3>
        <div class="flex items-center space-x-4 text-xs text-white/70">
          <span>📏 {formatDistance(calculatedTotalDistance)}</span>
          <span>📈 {formatElevation(calculatedMaxElevation)}</span>
          <span>📉 {formatElevation(calculatedMinElevation)}</span>
        </div>
      </div>
    </div>
    
    <!-- Difficulty Badge -->
    <div class="text-right">
      <div class="px-3 py-1 rounded-full bg-white/20 text-xs font-medium {difficulty.color}">
        {difficulty.level}
      </div>
      {#if !compact}
        <div class="text-xs text-white/60 mt-1">
          {difficulty.description}
        </div>
      {/if}
    </div>
  </div>

  <!-- Elevation Chart -->
  <div class="relative">
    <svg 
      width={chartWidth} 
      height={chartHeight}
      class="w-full h-auto bg-black/20 rounded-lg"
      role="img"
      aria-label="Elevation profile chart"
      onmousemove={handleMouseMove}
      onmouseleave={handleMouseLeave}
    >
      <!-- Grid lines -->
      {#if !compact}
        <!-- Horizontal grid lines -->
        {#each Array(5) as _, i}
          {@const y = padding.top + (i * (chartHeight - padding.top - padding.bottom) / 4)}
          {@const elevation = calculatedMaxElevation - (i * (calculatedMaxElevation - calculatedMinElevation) / 4)}
          <line 
            x1={padding.left} 
            y1={y} 
            x2={chartWidth - padding.right} 
            y2={y}
            stroke="rgba(255, 255, 255, 0.1)"
            stroke-width="1"
          />
          <text 
            x={padding.left - 5} 
            y={y + 4} 
            fill="rgba(255, 255, 255, 0.6)"
            font-size="10"
            text-anchor="end"
          >
            {formatElevation(elevation)}
          </text>
        {/each}
        
        <!-- Vertical grid lines -->
        {#each Array(6) as _, i}
          {@const x = padding.left + (i * (chartWidth - padding.left - padding.right) / 5)}
          {@const distance = (i * calculatedTotalDistance / 5)}
          <line 
            x1={x} 
            y1={padding.top} 
            x2={x} 
            y2={chartHeight - padding.bottom}
            stroke="rgba(255, 255, 255, 0.1)"
            stroke-width="1"
          />
          <text 
            x={x} 
            y={chartHeight - padding.bottom + 15} 
            fill="rgba(255, 255, 255, 0.6)"
            font-size="10"
            text-anchor="middle"
          >
            {formatDistance(distance)}
          </text>
        {/each}
      {/if}
      
      <!-- Elevation area fill -->
      <path
        d={areaPath}
        fill="url(#elevationGradient)"
        opacity="0.3"
      />
      
      <!-- Elevation line -->
      <path
        d={pathData}
        fill="none"
        stroke="url(#elevationGradient)"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- Gradient indicators -->
      {#if showGradient && !compact}
        {#each data as point, index}
          {#if point.gradient && Math.abs(point.gradient) > 3}
            <circle
              cx={xScale(point.distance)}
              cy={yScale(point.elevation)}
              r="4"
              fill={getGradientColor(point.gradient)}
              stroke="white"
              stroke-width="1"
              opacity="0.8"
            />
          {/if}
        {/each}
      {/if}
      
      <!-- Hazard markers -->
      {#if showHazards && !compact}
        {#each data as point, index}
          {#if point.hazards && point.hazards.length > 0}
            <circle
              cx={xScale(point.distance)}
              cy={yScale(point.elevation) - 10}
              r="6"
              fill="#EF4444"
              stroke="white"
              stroke-width="2"
              opacity="0.9"
            />
            <text
              x={xScale(point.distance)}
              y={yScale(point.elevation) - 6}
              fill="white"
              font-size="8"
              text-anchor="middle"
              font-weight="bold"
            >
              !
            </text>
          {/if}
        {/each}
      {/if}
      
      <!-- Hovered point -->
      {#if hoveredPoint && hoveredPointIndex >= 0}
        <circle
          cx={xScale(hoveredPoint.distance)}
          cy={yScale(hoveredPoint.elevation)}
          r="6"
          fill="#F59E0B"
          stroke="white"
          stroke-width="2"
        />
      {/if}
      
      <!-- Gradient definitions -->
      <defs>
        <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#10B981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
    
    <!-- Hover tooltip -->
    {#if hoveredPoint}
      <div class="absolute p-2 text-xs pointer-events-none z-10" style="background-color: rgba(0, 0, 0, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.08); border-radius: 1rem; left: {xScale(hoveredPoint.distance)}px; top: {yScale(hoveredPoint.elevation) - 80}px; transform: translateX(-50%);">
        <div class="space-y-1">
          <div class="font-semibold text-white">Mile {formatDistance(hoveredPoint.distance)}</div>
          <div class="text-white/80">{formatElevation(hoveredPoint.elevation)}</div>
          {#if hoveredPoint.gradient}
            <div class="text-xs" style="color: {getGradientColor(hoveredPoint.gradient)}">
              Grade: {formatGradient(hoveredPoint.gradient)}
            </div>
          {/if}
          {#if hoveredPoint.surface}
            <div class="text-white/70">
              {getSurfaceIcon(hoveredPoint.surface)} {hoveredPoint.surface}
            </div>
          {/if}
          {#if hoveredPoint.hazards && hoveredPoint.hazards.length > 0}
            <div class="text-red-300 text-xs">
              ⚠️ {hoveredPoint.hazards.join(', ')}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Stats Summary -->
  {#if !compact}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-3 text-center" style="background-color: rgba(0, 0, 0, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.08); border-radius: 1rem;">
        <div class="text-xs text-white/70">Total Distance</div>
        <div class="font-bold text-white">{formatDistance(calculatedTotalDistance)}</div>
      </div>
      
      <div class="p-3 text-center" style="background-color: rgba(0, 0, 0, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.08); border-radius: 1rem;">
        <div class="text-xs text-white/70">Elevation Gain</div>
        <div class="font-bold text-green-300">+{formatElevation(calculatedElevationGain)}</div>
      </div>
      
      <div class="p-3 text-center" style="background-color: rgba(0, 0, 0, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.08); border-radius: 1rem;">
        <div class="text-xs text-white/70">Elevation Loss</div>
        <div class="font-bold text-red-300">-{formatElevation(calculatedElevationLoss)}</div>
      </div>
      
      <div class="p-3 text-center" style="background-color: rgba(0, 0, 0, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.08); border-radius: 1rem;">
        <div class="text-xs text-white/70">Max Grade</div>
        <div class="font-bold text-orange-300">
          {formatGradient(Math.max(...data.map(p => Math.abs(p.gradient || 0))))}
        </div>
      </div>
    </div>
  {/if}

  <!-- Legend -->
  {#if !compact && (showGradient || showHazards)}
    <div class="border-t border-white/10 pt-3">
      <div class="flex flex-wrap items-center gap-4 text-xs">
        {#if showGradient}
          <div class="flex items-center space-x-4">
            <span class="text-white/70">Grade:</span>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="text-green-300">&lt;2%</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span class="text-yellow-300">2-4%</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 rounded-full bg-orange-500"></div>
              <span class="text-orange-300">4-6%</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span class="text-red-300">&gt;6%</span>
            </div>
          </div>
        {/if}
        
        {#if showHazards}
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
              <span class="text-white text-xs font-bold">!</span>
            </div>
            <span class="text-red-300">Hazards</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
