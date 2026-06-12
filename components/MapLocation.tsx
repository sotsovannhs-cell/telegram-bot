'use client';

import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix typical Next.js / Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function FitBounds({ officeLat, officeLng, userLat, userLng }: any) {
  const map = useMap();
  useEffect(() => {
    if (userLat && userLng) {
      // Fit both office and user
      const bounds = L.latLngBounds(
        [officeLat, officeLng],
        [userLat, userLng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Fit just the office
      map.setView([officeLat, officeLng], 17);
    }
  }, [officeLat, officeLng, userLat, userLng, map]);
  return null;
}

export default function MapLocation({ officeLat, officeLng, userLat, userLng, radius }: any) {
  return (
    <MapContainer 
      center={[officeLat, officeLng]} 
      zoom={17} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Circle 
        center={[officeLat, officeLng]} 
        radius={radius} 
        pathOptions={{ color: 'indigo', fillColor: 'indigo', fillOpacity: 0.15, weight: 2 }} 
      />
      <Marker position={[officeLat, officeLng]} />
      {userLat && userLng && (
        <Circle 
          center={[userLat, userLng]} 
          radius={5} 
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }} 
        />
      )}
      <FitBounds officeLat={officeLat} officeLng={officeLng} userLat={userLat} userLng={userLng} />
    </MapContainer>
  );
}
