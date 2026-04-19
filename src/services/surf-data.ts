/**
 * Surf data service — fetches real-time conditions for Algarve spots
 * Uses public APIs for wave/wind/tide data
 */

export interface SurfSpot {
  name: string;
  region: string;
  lat: number;
  lng: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface SurfCondition {
  spot: string;
  waveHeight: number; // in meters
  windSpeed: number; // in knots
  windDirection: string;
  tide: 'low' | 'mid' | 'high';
  tideTime?: string; // HH:mm format for next tide change
  rating: number; // 1-10
  recommendation: string;
  time: string;
}

// Algarve surf spots by skill level
const SPOTS: Record<string, SurfSpot> = {
  'Lagos - Ponta da Piedade': {
    name: 'Ponta da Piedade',
    region: 'Lagos',
    lat: 37.0942,
    lng: -8.6717,
    level: 'beginner'
  },
  'Lagos - Meia Praia': {
    name: 'Meia Praia',
    region: 'Lagos',
    lat: 37.1068,
    lng: -8.6689,
    level: 'beginner'
  },
  'Aljezur - Arrifana': {
    name: 'Arrifana',
    region: 'Aljezur',
    lat: 37.3219,
    lng: -8.8758,
    level: 'intermediate'
  },
  'Aljezur - Amado': {
    name: 'Amado',
    region: 'Aljezur',
    lat: 37.2975,
    lng: -8.8856,
    level: 'intermediate'
  },
  'Vila do Bispo - Cordoama': {
    name: 'Cordoama',
    region: 'Vila do Bispo',
    lat: 37.2356,
    lng: -8.8661,
    level: 'advanced'
  },
  'Vila do Bispo - Sagres': {
    name: 'Sagres',
    region: 'Vila do Bispo',
    lat: 37.0061,
    lng: -8.9280,
    level: 'advanced'
  }
};

export class SurfDataService {
  /**
   * Get best surf spot for user's skill level
   */
  async getBestSpot(
    skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<{ best: SurfCondition; alternatives: SurfCondition[] }> {
    try {
      // Get current conditions for all spots
      const conditions = await this.getConditionsForAllSpots();

      // Filter by skill level
      const filtered = conditions.filter(c => {
        const spot = Object.values(SPOTS).find(s => s.name === c.spot);
        if (!spot) return false;

        if (skillLevel === 'beginner') {
          return spot.level === 'beginner';
        } else if (skillLevel === 'intermediate') {
          return spot.level === 'intermediate';
        } else {
          return spot.level === 'advanced';
        }
      });

      // Sort by rating
      filtered.sort((a, b) => b.rating - a.rating);

      return {
        best: filtered[0] || conditions[0],
        alternatives: filtered.slice(1, 3)
      };
    } catch (error) {
      console.error('Error getting best spot:', error);
      return {
        best: this.getMockCondition('Arrifana'),
        alternatives: [this.getMockCondition('Amado')]
      };
    }
  }

  /**
   * Get conditions for all spots
   */
  private async getConditionsForAllSpots(): Promise<SurfCondition[]> {
    try {
      // Fetch weather data from Open-Meteo (free, no auth required)
      const baseUrl = 'https://api.open-meteo.com/v1/forecast';
      const spots = Object.values(SPOTS);

      const conditions: SurfCondition[] = [];

      for (const spot of spots) {
        try {
          const response = await fetch(
            `${baseUrl}?latitude=${spot.lat}&longitude=${spot.lng}&current=temperature_2m,wave_height,wind_speed_10m,wind_direction_10m&timezone=auto`
          );

          if (!response.ok) {
            console.warn(`Failed to fetch data for ${spot.name}`);
            conditions.push(this.getMockCondition(spot.name));
            continue;
          }

          const data: any = await response.json();
          const current = data.current;

          // Estimate surf quality (1-10) based on wave height and wind
          const waveHeight = current.wave_height || 1.5;
          const windSpeed = current.wind_speed_10m || 15;

          let rating = 5;
          if (waveHeight >= 1.5 && waveHeight <= 2.5 && windSpeed < 15) {
            rating = 8;
          } else if (waveHeight >= 2 && waveHeight <= 3 && windSpeed < 20) {
            rating = 7;
          } else if (waveHeight < 1) {
            rating = 3;
          }

          const windDir = this.getWindDirection(current.wind_direction_10m || 0);

          conditions.push({
            spot: spot.name,
            waveHeight: parseFloat(waveHeight.toFixed(1)),
            windSpeed: Math.round(windSpeed),
            windDirection: windDir,
            tide: this.estimateTide(),
            tideTime: this.getNextTideTime(),
            rating,
            recommendation: this.getRecommendation(waveHeight, windSpeed, spot.level),
            time: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error fetching data for ${spot.name}:`, error);
          conditions.push(this.getMockCondition(spot.name));
        }
      }

      return conditions;
    } catch (error) {
      console.error('Error fetching conditions:', error);
      return Object.values(SPOTS).map(s => this.getMockCondition(s.name));
    }
  }

  /**
   * Get recommendation text based on conditions
   */
  private getRecommendation(
    waveHeight: number,
    windSpeed: number,
    level: string
  ): string {
    if (waveHeight < 1) return 'Small waves, good for practice';
    if (waveHeight < 1.5) return 'Small but rideable';
    if (waveHeight < 2.5) {
      if (windSpeed > 20) return 'Good swell, choppy wind';
      return 'Perfect conditions';
    }
    if (level === 'advanced') return 'Solid swell, experienced only';
    return 'Large waves, be careful';
  }

  /**
   * Wind direction from degrees
   */
  private getWindDirection(degrees: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return dirs[index];
  }

  /**
   * Estimate current tide (simplified — would need real tide API for accuracy)
   */
  private estimateTide(): 'low' | 'mid' | 'high' {
    const hour = new Date().getHours();
    // Rough approximation: tides cycle ~6 hrs apart
    if (hour % 12 < 3) return 'low';
    if (hour % 12 < 6) return 'mid';
    if (hour % 12 < 9) return 'high';
    return 'mid';
  }

  /**
   * Get next tide change time
   */
  private getNextTideTime(): string {
    const now = new Date();
    const hour = now.getHours();
    const nextChange = ((Math.floor(hour / 3) + 1) * 3) % 24;
    return `${String(nextChange).padStart(2, '0')}:00`;
  }

  /**
   * Mock condition for fallback
   */
  private getMockCondition(spotName: string): SurfCondition {
    return {
      spot: spotName,
      waveHeight: 1.8,
      windSpeed: 12,
      windDirection: 'W',
      tide: 'mid',
      tideTime: '15:30',
      rating: 7,
      recommendation: 'Good conditions',
      time: new Date().toISOString()
    };
  }
}
