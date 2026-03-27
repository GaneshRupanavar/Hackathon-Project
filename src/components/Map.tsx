import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  lat: number;
  lon: number;
  cityName: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 10);
  }, [center, map]);
  return null;
}

export const AtmosphericMap: React.FC<Props> = ({ lat, lon, cityName }) => {
  const position: [number, number] = [lat, lon];

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer center={position} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={position} />
        <Marker position={position}>
          <Popup>
            <div className="font-bold">{cityName}</div>
            <div className="text-xs text-gray-500">Atmospheric Monitoring Point</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
