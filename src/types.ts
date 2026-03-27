export interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
}

export interface PollutionData {
  main: {
    aqi: number;
  };
  components: {
    pm2_5: number;
    pm10: number;
    no2: number;
    o3: number;
  };
}

export interface LocationData {
  lat: number;
  lon: number;
  name: string;
}

export interface Favorite {
  id?: string;
  uid: string;
  cityName: string;
  lat: number;
  lon: number;
  createdAt: any;
}
