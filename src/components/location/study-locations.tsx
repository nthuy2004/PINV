'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, GeoPoint } from 'firebase/firestore';
import { MapPin, Coffee, BookOpen, Users, Star, Navigation, Filter } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { StudyLocation } from '@/types';
import { cn, calculateDistance } from '@/lib/utils';

// Built-in study locations for demo
const DEMO_LOCATIONS: StudyLocation[] = [
    {
        id: '1',
        name: 'Thư viện Quốc gia Việt Nam',
        address: '31 Tràng Thi, Hoàn Kiếm, Hà Nội',
        coords: new GeoPoint(21.0285, 105.8489),
        type: 'library',
        rating: 4.8,
        createdBy: 'admin',
        createdAt: null as any,
    },
    {
        id: '2',
        name: 'The Coffee House - Láng Hạ',
        address: '54 Láng Hạ, Ba Đình, Hà Nội',
        coords: new GeoPoint(21.0178, 105.8215),
        type: 'cafe',
        rating: 4.5,
        createdBy: 'admin',
        createdAt: null as any,
    },
    {
        id: '3',
        name: 'Tranquil Books & Coffee',
        address: '5 Nguyễn Quang Bích, Hoàn Kiếm, Hà Nội',
        coords: new GeoPoint(21.0315, 105.8502),
        type: 'cafe',
        rating: 4.7,
        createdBy: 'admin',
        createdAt: null as any,
    },
    {
        id: '4',
        name: 'UP Co-working Space',
        address: '1 Lương Yên, Hai Bà Trưng, Hà Nội',
        coords: new GeoPoint(21.0058, 105.8635),
        type: 'coworking',
        rating: 4.6,
        createdBy: 'admin',
        createdAt: null as any,
    },
    {
        id: '5',
        name: 'Thư viện Đại học Bách Khoa',
        address: '1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
        coords: new GeoPoint(21.0054, 105.8433),
        type: 'library',
        rating: 4.4,
        createdBy: 'admin',
        createdAt: null as any,
    },
    {
        id: '6',
        name: 'Highlands Coffee - Trung Hòa',
        address: 'Trung Hòa, Cầu Giấy, Hà Nội',
        coords: new GeoPoint(21.0089, 105.8001),
        type: 'cafe',
        rating: 4.3,
        createdBy: 'admin',
        createdAt: null as any,
    },
    {
        id: '7',
        name: 'Phúc Long - Nguyễn Trãi',
        address: '168 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        coords: new GeoPoint(20.9962, 105.8122),
        type: 'cafe',
        rating: 4.2,
        createdBy: 'admin',
        createdAt: null as any,
    },
    {
        id: '8',
        name: 'Thư viện Tạ Quang Bửu',
        address: 'Đại học Bách Khoa, Hai Bà Trưng, Hà Nội',
        coords: new GeoPoint(21.0048, 105.8450),
        type: 'library',
        rating: 4.5,
        createdBy: 'admin',
        createdAt: null as any,
    },
];

const typeIcons = {
    library: BookOpen,
    cafe: Coffee,
    coworking: Users,
    other: MapPin,
};

const typeLabels = {
    library: 'Thư viện',
    cafe: 'Quán cafe',
    coworking: 'Co-working',
    other: 'Khác',
};

type SortMode = 'solo' | 'duo' | 'group';

interface StudyLocationSuggestionsProps {
    onSelect?: (location: StudyLocation) => void;
    className?: string;
    /**
     * Solo: show all, sorted by distance from user
     * Duo: show nearest to midpoint of two people
     * Group: show nearest to centroid of group members
     */
    memberLocations?: { lat: number; lng: number }[];
    userLocation?: { lat: number; lng: number };
}

/**
 * Calculate average distance from a point to all member locations
 */
function avgDistanceToMembers(
    locationLat: number,
    locationLng: number,
    members: { lat: number; lng: number }[]
): number {
    if (members.length === 0) return Infinity;
    const total = members.reduce((sum, m) => {
        return sum + calculateDistance(locationLat, locationLng, m.lat, m.lng);
    }, 0);
    return total / members.length;
}

/**
 * Calculate centroid of multiple points
 */
function calculateCentroid(points: { lat: number; lng: number }[]): { lat: number; lng: number } {
    if (points.length === 0) return { lat: 0, lng: 0 };
    const sum = points.reduce(
        (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
        { lat: 0, lng: 0 }
    );
    return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

export function StudyLocationSuggestions({
    onSelect,
    className,
    memberLocations,
    userLocation,
}: StudyLocationSuggestionsProps) {
    const [locations, setLocations] = useState<StudyLocation[]>(DEMO_LOCATIONS);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [sortMode, setSortMode] = useState<SortMode>('solo');
    const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(userLocation || null);

    // Detect mode based on props
    useEffect(() => {
        if (memberLocations && memberLocations.length > 2) {
            setSortMode('group');
        } else if (memberLocations && memberLocations.length === 2) {
            setSortMode('duo');
        } else {
            setSortMode('solo');
        }
    }, [memberLocations]);

    // Get user's location
    useEffect(() => {
        if (myLocation) return;
        if (typeof navigator === 'undefined') return;

        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {
                // Default to Hanoi if geolocation fails
                setMyLocation({ lat: 21.0285, lng: 105.8542 });
            }
        );
    }, []);

    // Try to fetch from Firestore, fallback to demo data
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const locationsQuery = query(
                    collection(db, 'studyLocations'),
                    orderBy('rating', 'desc'),
                    limit(30)
                );
                const snapshot = await getDocs(locationsQuery);
                if (!snapshot.empty) {
                    const data = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as StudyLocation[];
                    setLocations(data);
                }
            } catch (error) {
                // Use demo data
                console.log('Using demo locations');
            }
        };

        fetchLocations();
    }, []);

    // Sort and filter locations
    const getSortedLocations = () => {
        let filtered = selectedType
            ? locations.filter((l) => l.type === selectedType)
            : locations;

        // Sort by distance based on mode
        const allMembers = memberLocations || (myLocation ? [myLocation] : []);

        if (allMembers.length > 0) {
            filtered = [...filtered].sort((a, b) => {
                const aCoords = getCoords(a);
                const bCoords = getCoords(b);
                if (!aCoords || !bCoords) return 0;

                if (sortMode === 'solo' && myLocation) {
                    // Solo: sort by distance from user
                    const distA = calculateDistance(myLocation.lat, myLocation.lng, aCoords.lat, aCoords.lng);
                    const distB = calculateDistance(myLocation.lat, myLocation.lng, bCoords.lat, bCoords.lng);
                    return distA - distB;
                } else if (sortMode === 'duo') {
                    // Duo: sort by average distance to both people
                    const avgA = avgDistanceToMembers(aCoords.lat, aCoords.lng, allMembers);
                    const avgB = avgDistanceToMembers(bCoords.lat, bCoords.lng, allMembers);
                    return avgA - avgB;
                } else if (sortMode === 'group') {
                    // Group: sort by distance to centroid, weighted by proximity to most members
                    const avgA = avgDistanceToMembers(aCoords.lat, aCoords.lng, allMembers);
                    const avgB = avgDistanceToMembers(bCoords.lat, bCoords.lng, allMembers);
                    return avgA - avgB;
                }

                return 0;
            });
        }

        return filtered;
    };

    const getCoords = (location: StudyLocation) => {
        const lat = location.coords?.latitude || (location.coords as any)?._lat;
        const lng = location.coords?.longitude || (location.coords as any)?._long;
        if (lat && lng) return { lat, lng };
        return null;
    };

    const getDistanceText = (location: StudyLocation) => {
        const coords = getCoords(location);
        if (!coords) return null;

        if (sortMode === 'solo' && myLocation) {
            const dist = calculateDistance(myLocation.lat, myLocation.lng, coords.lat, coords.lng);
            return `${dist.toFixed(1)} km`;
        } else if ((sortMode === 'duo' || sortMode === 'group') && memberLocations && memberLocations.length > 0) {
            const avg = avgDistanceToMembers(coords.lat, coords.lng, memberLocations);
            return `~${avg.toFixed(1)} km TB`;
        }
        return null;
    };

    const openInMaps = (location: StudyLocation) => {
        const coords = getCoords(location);
        if (coords) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank');
        }
    };

    const sortedLocations = getSortedLocations();

    const modeLabels: Record<SortMode, string> = {
        solo: '📍 Tất cả (gần tôi)',
        duo: '👥 Gần 2 người',
        group: '👥 Gần cả nhóm',
    };

    return (
        <div className={cn('card p-5', className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Địa điểm học gợi ý</h3>
                {memberLocations && memberLocations.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                        {modeLabels[sortMode]}
                    </span>
                )}
            </div>

            {/* Type filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setSelectedType(null)}
                    className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors',
                        selectedType === null
                            ? 'bg-primary-500 text-dark-900'
                            : 'bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600'
                    )}
                >
                    Tất cả
                </button>
                {Object.entries(typeLabels).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedType(key === selectedType ? null : key)}
                        className={cn(
                            'px-3 py-1.5 text-sm rounded-lg transition-colors',
                            selectedType === key
                                ? 'bg-primary-500 text-dark-900'
                                : 'bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Locations list */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedLocations.map((location) => {
                    const Icon = typeIcons[location.type] || MapPin;
                    const distanceText = getDistanceText(location);

                    return (
                        <div
                            key={location.id}
                            className="flex items-start gap-3 p-3 bg-dark-50 dark:bg-dark-700/50 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors cursor-pointer group"
                            onClick={() => onSelect?.(location)}
                        >
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-primary-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{location.name}</p>
                                    {location.rating && (
                                        <div className="flex items-center gap-1 text-sm text-primary-500 shrink-0">
                                            <Star className="w-3 h-3 fill-primary-500" />
                                            {location.rating}
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-dark-500 truncate">{location.address}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-block px-2 py-0.5 bg-dark-200 dark:bg-dark-600 rounded text-xs">
                                        {typeLabels[location.type]}
                                    </span>
                                    {distanceText && (
                                        <span className="text-xs text-primary-500 font-medium">
                                            {distanceText}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openInMaps(location);
                                }}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-all"
                                title="Mở trong Google Maps"
                            >
                                <Navigation className="w-4 h-4 text-primary-500" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {sortedLocations.length === 0 && (
                <div className="text-center py-8 text-dark-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Không tìm thấy địa điểm</p>
                </div>
            )}
        </div>
    );
}
