'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, GeoPoint } from 'firebase/firestore';
import { MapPin, Coffee, BookOpen, Users, Star, Navigation } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { StudyLocation } from '@/types';
import { cn } from '@/lib/utils';

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

interface StudyLocationSuggestionsProps {
    onSelect?: (location: StudyLocation) => void;
    className?: string;
}

export function StudyLocationSuggestions({
    onSelect,
    className,
}: StudyLocationSuggestionsProps) {
    const [locations, setLocations] = useState<StudyLocation[]>(DEMO_LOCATIONS);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Try to fetch from Firestore, fallback to demo data
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const locationsQuery = query(
                    collection(db, 'studyLocations'),
                    orderBy('rating', 'desc'),
                    limit(20)
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

    const filteredLocations = selectedType
        ? locations.filter((l) => l.type === selectedType)
        : locations;

    const openInMaps = (location: StudyLocation) => {
        const lat = location.coords?.latitude || location.coords?._lat;
        const lng = location.coords?.longitude || location.coords?._long;
        if (lat && lng) {
            window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        }
    };

    return (
        <div className={cn('card p-5', className)}>
            <h3 className="font-semibold text-lg mb-4">Địa điểm học gợi ý</h3>

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
                {filteredLocations.map((location) => {
                    const Icon = typeIcons[location.type] || MapPin;

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
                                        <div className="flex items-center gap-1 text-sm text-primary-500">
                                            <Star className="w-3 h-3 fill-primary-500" />
                                            {location.rating}
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-dark-500 truncate">{location.address}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-dark-200 dark:bg-dark-600 rounded text-xs">
                                    {typeLabels[location.type]}
                                </span>
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

            {filteredLocations.length === 0 && (
                <div className="text-center py-8 text-dark-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Không tìm thấy địa điểm</p>
                </div>
            )}
        </div>
    );
}
