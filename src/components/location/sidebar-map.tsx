'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { User, StudyLocation } from '@/types';
import { GeoPoint } from 'firebase/firestore';
import { MapPin } from 'lucide-react';

// Require Leaflet dynamically because it uses `window`
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });

interface SidebarMapProps {
    matchedUsers?: User[];
}

export function SidebarMap({ matchedUsers = [] }: SidebarMapProps) {
    const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
        if (typeof navigator === 'undefined') return;

        // Dynamically import Leaflet on the client side
        import('leaflet').then((leaflet) => {
            const Leaflet = leaflet.default;
            setL(Leaflet);

            // Fix leaflet default icons
            delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
            Leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        });

        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {
                // Default to Hanoi
                setMyLocation({ lat: 21.0285, lng: 105.8542 });
            }
        );
    }, []);

    // User Icon Generator
    const createUserIcon = (avatarUrl?: string, isMe: boolean = false) => {
        if (!L) return null;

        const borderColor = isMe ? 'var(--primary-500)' : 'white';

        if (!avatarUrl) {
            return L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: var(--primary-500); width: 36px; height: 36px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">?</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18]
            });
        }

        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-image: url('${avatarUrl}'); background-size: cover; background-position: center; width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    };

    const DEMO_LOCATIONS: Partial<StudyLocation>[] = [
        {
            id: '1',
            name: 'Thư viện Quốc gia Việt Nam',
            address: '31 Tràng Thi, Hoàn Kiếm, Hà Nội',
            coords: new GeoPoint(21.0285, 105.8489),
            type: 'library',
        },
        {
            id: '2',
            name: 'UP Co-working Space',
            address: '1 Lương Yên, Hai Bà Trưng, Hà Nội',
            coords: new GeoPoint(21.0058, 105.8635),
            type: 'coworking',
        },
        {
            id: '3',
            name: 'The Coffee House - Láng Hạ',
            address: '54 Láng Hạ, Ba Đình, Hà Nội',
            coords: new GeoPoint(21.0178, 105.8215),
            type: 'cafe',
        },
        {
            id: '4',
            name: 'Thư viện KHTN',
            address: '227 Nguyễn Văn Cừ, Quận 5, TP HCM',
            coords: new GeoPoint(10.7628, 106.6825),
            type: 'library',
        },
        {
            id: '5',
            name: 'Sách & Cafe Cáo',
            address: 'Quận 3, TP HCM',
            coords: new GeoPoint(10.7766, 106.6853),
            type: 'cafe',
        }
    ];

    interface SidebarMapProps {
        matchedUsers?: User[];
    }


    const openInMaps = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    };

    if (!isMounted || !L) return (
        <div className="card w-full overflow-hidden p-0 border border-dark-100 dark:border-dark-800">
            <div className="h-64 bg-dark-100 dark:bg-dark-800 animate-pulse"></div>
        </div>
    );

    const centerLat = myLocation?.lat || 21.0285;
    const centerLng = myLocation?.lng || 105.8542;

    return (
        <div className="card p-0 w-full overflow-hidden border border-dark-100 dark:border-dark-800 flex flex-col">
            <div className="p-4 border-b border-dark-100 dark:border-dark-800 flex items-center gap-2 bg-white dark:bg-dark-900 z-10">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-500">
                    <MapPin className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="font-semibold leading-tight">Bản đồ bạn học</h3>
                    <p className="text-xs text-dark-500 mt-0.5">Vị trí của bạn & bè bạn</p>
                </div>
            </div>

            <div className="h-64 w-full relative z-0">
                <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    {/* My Location */}
                    {myLocation && createUserIcon(undefined, true) && (
                        <Marker
                            position={[myLocation.lat, myLocation.lng]}
                            icon={createUserIcon(undefined, true)}
                        >
                            <Popup>
                                <div className="text-center font-medium">
                                    Vị trí của bạn
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Matched Users Locations */}
                    {matchedUsers.map((user: User) => {
                        // Demo: mock coordinates near the center
                        // In production, user.location would be actual GeoPoint
                        const lat = centerLat + (Math.random() - 0.5) * 0.05;
                        const lng = centerLng + (Math.random() - 0.5) * 0.05;

                        const icon = createUserIcon(user.avatar);
                        if (!icon) return null;

                        return (
                            <Marker
                                key={user.uid}
                                position={[lat, lng]}
                                icon={icon}
                            >
                                <Tooltip direction="top">{user.displayName}</Tooltip>
                                <Popup>
                                    <div className="text-center p-1">
                                        <p className="font-semibold text-sm mb-2">{user.displayName}</p>
                                        <button
                                            onClick={() => openInMaps(lat, lng)}
                                            className="px-3 py-1.5 bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-lg text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors w-full"
                                        >
                                            Chỉ đường
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* POIs */}
                    {DEMO_LOCATIONS.map(loc => (
                        <Marker
                            key={loc.id}
                            position={[loc.coords!.latitude, loc.coords!.longitude]}
                        >
                            <Tooltip direction="top">{loc.name}</Tooltip>
                            <Popup>
                                <div className="max-w-[200px] p-1">
                                    <p className="font-semibold text-sm">{loc.name}</p>
                                    <p className="text-xs text-dark-500 mt-1 mb-2 line-clamp-2">{loc.address}</p>
                                    <button
                                        onClick={() => openInMaps(loc.coords!.latitude, loc.coords!.longitude)}
                                        className="px-3 py-1.5 bg-dark-50 text-dark-600 dark:bg-dark-800 dark:text-dark-300 rounded-lg text-xs font-medium hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors w-full"
                                    >
                                        Mở Google Maps
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <div className="p-2.5 text-xs text-dark-500 text-center bg-dark-50 dark:bg-dark-900/50 border-t border-dark-100 dark:border-dark-800">
                Nhấn vào avatar/điểm đánh dấu để xem chi tiết
            </div>
        </div>
    );
}
