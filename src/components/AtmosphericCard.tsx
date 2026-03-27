import React from 'react';
import { Wind, Droplets, Thermometer, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { WeatherData, PollutionData } from '../types';

interface Props {
  weather: WeatherData;
  pollution: PollutionData;
}

const getAQIInfo = (aqi: number) => {
  switch (aqi) {
    case 1: return { label: 'Good', color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle, advice: 'Air quality is satisfactory. Perfect for outdoor activities.' };
    case 2: return { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-50', icon: Info, advice: 'Air quality is acceptable. Sensitive groups should limit prolonged outdoor exertion.' };
    case 3: return { label: 'Moderate', color: 'text-orange-500', bg: 'bg-orange-50', icon: AlertTriangle, advice: 'Unhealthy for sensitive groups. Consider reducing outdoor time.' };
    case 4: return { label: 'Poor', color: 'text-red-500', bg: 'bg-red-50', icon: AlertTriangle, advice: 'Unhealthy. Everyone should limit outdoor activities.' };
    case 5: return { label: 'Very Poor', color: 'text-purple-500', bg: 'bg-purple-50', icon: AlertTriangle, advice: 'Health alert. Avoid all outdoor physical activity.' };
    default: return { label: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-50', icon: Info, advice: 'Data unavailable.' };
  }
};

export const AtmosphericCard: React.FC<Props> = ({ weather, pollution }) => {
  const aqi = getAQIInfo(pollution.main.aqi);
  const Icon = aqi.icon;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">{weather.name}</h2>
          <p className="text-gray-500 capitalize text-lg">{weather.weather[0].description}</p>
        </div>
        <div className="text-right">
          <div className="text-6xl font-light text-gray-900">{Math.round(weather.main.temp)}°C</div>
          <p className="text-gray-400">Feels like {Math.round(weather.main.feels_like)}°C</p>
        </div>
      </div>

      <div className={`p-6 rounded-2xl ${aqi.bg} flex items-start gap-4`}>
        <Icon className={`w-8 h-8 ${aqi.color} shrink-0 mt-1`} />
        <div>
          <h3 className={`font-bold text-xl ${aqi.color}`}>Air Quality: {aqi.label}</h3>
          <p className="text-gray-600 mt-1 leading-relaxed">{aqi.advice}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PM2.5 Particles</p>
          <p className="text-2xl font-mono font-medium text-gray-800">{pollution.components.pm2_5} <span className="text-sm font-normal text-gray-400">μg/m³</span></p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PM10 Particles</p>
          <p className="text-2xl font-mono font-medium text-gray-800">{pollution.components.pm10} <span className="text-sm font-normal text-gray-400">μg/m³</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Wind className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-xs text-gray-400 uppercase">Wind</p>
            <p className="font-medium">{weather.wind.speed} m/s</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Droplets className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-xs text-gray-400 uppercase">Humidity</p>
            <p className="font-medium">{weather.main.humidity}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
