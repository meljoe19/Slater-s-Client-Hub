
import React, { useEffect, useRef } from 'react';
import { Client } from '../types';

interface MapComponentProps {
  clients: Client[];
  onMarkerClick: (client: Client) => void;
  center?: [number, number];
}

declare const L: any;

const MapComponent: React.FC<MapComponentProps> = ({ clients, onMarkerClick, center = [37.7749, -122.4194] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerGroup = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView(center, 12);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(leafletMap.current);

      markerGroup.current = L.layerGroup().addTo(leafletMap.current);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (leafletMap.current && markerGroup.current) {
      markerGroup.current.clearLayers();
      
      clients.forEach(client => {
        const marker = L.circleMarker([client.latitude, client.longitude], {
          radius: 10,
          fillColor: "#d97706", // Amber-600
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        });

        marker.bindPopup(`
          <div class="p-3 bg-[#112240] text-white rounded-lg border border-slate-700 min-w-[200px]">
            <h3 class="font-bold text-amber-500 text-sm mb-1">${client.name}</h3>
            <p class="text-[11px] text-slate-300 font-semibold mb-1 uppercase tracking-widest">${client.industry}</p>
            <p class="text-[10px] text-slate-400 leading-tight">${client.address}</p>
          </div>
        `, {
          className: 'slater-popup'
        });

        marker.on('click', () => onMarkerClick(client));
        marker.addTo(markerGroup.current);
      });

      if (clients.length > 0) {
        const bounds = L.latLngBounds(clients.map(c => [c.latitude, c.longitude]));
        leafletMap.current.fitBounds(bounds, { padding: [100, 100] });
      }
    }
  }, [clients, onMarkerClick]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default MapComponent;
