import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { LayersControl, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AddressMapPickerProps {
  position: Coordinates;
  onPositionChange: (next: Coordinates) => void;
}

// Ensure marker icons resolve correctly in Vite builds.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    const targetZoom = Math.max(map.getZoom(), 18);
    map.setView(center, targetZoom, { animate: true });
  }, [center, map]);

  return null;
};

const SelectableMarker: React.FC<{
  position: [number, number];
  onPositionChange: (next: Coordinates) => void;
}> = ({ position, onPositionChange }) => {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(event) {
      onPositionChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend: () => {
          const marker = markerRef.current;
          if (!marker) return;
          const next = marker.getLatLng();
          onPositionChange({ latitude: next.lat, longitude: next.lng });
        },
      }}
    />
  );
};

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({ position, onPositionChange }) => {
  const markerPosition = useMemo<[number, number]>(
    () => [position.latitude, position.longitude],
    [position.latitude, position.longitude]
  );

  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border border-gray-200">
      <MapContainer
        center={markerPosition}
        zoom={18}
        className="h-full w-full"
        minZoom={16}
        maxZoom={20}
        scrollWheelZoom
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Chi tiết nhà (OSM)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxNativeZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Nhà nổi bật (HOT)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Humanitarian style'
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              maxNativeZoom={20}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <RecenterMap center={markerPosition} />
        <SelectableMarker position={markerPosition} onPositionChange={onPositionChange} />
      </MapContainer>
    </div>
  );
};

export default AddressMapPicker;
