'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const useMapEvents = dynamic(
    () => import('react-leaflet').then((mod) => mod.useMapEvents),
    { ssr: false }
) as any;

interface LocationPickerProps {
    value?: { lat: number; lng: number; address?: string };
    onChange: (location: { lat: number; lng: number; address: string }) => void;
    placeholder?: string;
    className?: string;
}

interface SearchResult {
    lat: string;
    lon: string;
    display_name: string;
}

export function LocationPicker({
    value,
    onChange,
    placeholder = 'Tìm địa điểm...',
    className,
}: LocationPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
        address: string;
    } | null>(value ? { ...value, address: value.address || '' } : null);
    const [mapReady, setMapReady] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout>();

    // Default center (Hanoi)
    const defaultCenter: [number, number] = [21.0285, 105.8542];
    const center: [number, number] = selectedLocation
        ? [selectedLocation.lat, selectedLocation.lng]
        : defaultCenter;

    useEffect(() => {
        // Load Leaflet CSS
        if (typeof window !== 'undefined') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            setMapReady(true);
        }
    }, []);

    // Search using Nominatim API
    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    query
                )}&countrycodes=vn&limit=5`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    };

    // Debounced search
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            handleSearch(value);
        }, 500);
    };

    // Select from search results
    const handleSelectResult = (result: SearchResult) => {
        const location = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name,
        };
        setSelectedLocation(location);
        setSearchQuery(result.display_name);
        setSearchResults([]);
    };

    // Confirm selection
    const handleConfirm = () => {
        if (selectedLocation) {
            onChange(selectedLocation);
            setIsOpen(false);
        }
    };

    // Reverse geocode
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    };

    return (
        <div className={cn('relative', className)}>
            {/* Input trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="input w-full text-left flex items-center gap-2"
            >
                <MapPin className="w-5 h-5 text-dark-400 shrink-0" />
                <span className={cn(!value?.address && 'text-dark-400')}>
                    {value?.address || placeholder}
                </span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-700">
                            <h3 className="text-lg font-bold">Chọn địa điểm</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-dark-100 dark:border-dark-700">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchInput(e.target.value)}
                                    placeholder="Tìm địa điểm, đường, thành phố..."
                                    className="input pl-12 pr-10"
                                />
                                {searching && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 animate-spin" />
                                )}
                            </div>

                            {/* Search results */}
                            {searchResults.length > 0 && (
                                <div className="mt-2 border border-dark-100 dark:border-dark-700 rounded-xl overflow-hidden">
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectResult(result)}
                                            className="w-full px-4 py-3 text-left hover:bg-dark-50 dark:hover:bg-dark-700 flex items-start gap-3 border-b last:border-b-0 border-dark-100 dark:border-dark-700"
                                        >
                                            <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                                            <span className="text-sm line-clamp-2">{result.display_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Map */}
                        <div className="flex-1 min-h-[300px] relative">
                            {mapReady && (
                                <MapContainer
                                    center={center}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    // @ts-ignore
                                    whenReady={() => { }}
                                >
                                    <TileLayer
                                        // @ts-ignore
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {selectedLocation && (
                                        // @ts-ignore
                                        <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                                    )}
                                    <MapClickHandler
                                        onMapClick={async (lat: number, lng: number) => {
                                            const address = await reverseGeocode(lat, lng);
                                            setSelectedLocation({ lat, lng, address });
                                            setSearchQuery(address);
                                        }}
                                    />
                                </MapContainer>
                            )}
                        </div>

                        {/* Selected location info */}
                        {selectedLocation && (
                            <div className="p-4 border-t border-dark-100 dark:border-dark-700 bg-primary-50 dark:bg-primary-900/20">
                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
                                    Địa điểm đã chọn:
                                </p>
                                <p className="text-sm line-clamp-2">{selectedLocation.address}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t border-dark-100 dark:border-dark-700">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsOpen(false)}>
                                Hủy
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleConfirm}
                                disabled={!selectedLocation}
                            >
                                Xác nhận
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Map click handler component
function MapClickHandler({
    onMapClick,
}: {
    onMapClick: (lat: number, lng: number) => void;
}) {
    // This will be handled client-side only
    useEffect(() => {
        // Import and use map events on client side
        import('react-leaflet').then(({ useMapEvents }) => {
            // Note: This component needs to be properly integrated with react-leaflet
        });
    }, []);

    return null;
}

// Export a simple text-based location input as fallback
export function LocationInput({
    value,
    onChange,
    placeholder = 'Nhập địa điểm...',
    className,
}: {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={cn('relative', className)}>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="input pl-12"
            />
        </div>
    );
}
