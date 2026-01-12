'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
} from 'firebase/firestore';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Clock,
    MapPin,
    Users,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Event } from '@/types';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    groupId?: string;
    color: string;
}

export function Calendar() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEventModal, setShowEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        startTime: '09:00',
        endTime: '10:00',
        location: '',
    });

    // Fetch events
    useEffect(() => {
        if (!user) return;

        const fetchEvents = async () => {
            try {
                const eventsQuery = query(
                    collection(db, 'events'),
                    where('participants', 'array-contains', user.uid)
                );

                const snapshot = await getDocs(eventsQuery);
                const eventsData = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        startTime: data.startTime.toDate(),
                        endTime: data.endTime.toDate(),
                        location: data.location,
                        groupId: data.groupId,
                        color: data.color || 'primary',
                    };
                });

                setEvents(eventsData);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [user]);

    // Calendar helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const getEventsForDate = (date: Date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.startTime);
            return (
                eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear()
            );
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAddEvent = async () => {
        if (!user || !newEvent.title || !newEvent.date) return;

        try {
            const startDate = new Date(`${newEvent.date}T${newEvent.startTime}`);
            const endDate = new Date(`${newEvent.date}T${newEvent.endTime}`);

            await addDoc(collection(db, 'events'), {
                title: newEvent.title,
                description: newEvent.description || null,
                startTime: Timestamp.fromDate(startDate),
                endTime: Timestamp.fromDate(endDate),
                location: newEvent.location || null,
                participants: [user.uid],
                createdBy: user.uid,
                color: 'primary',
                createdAt: Timestamp.now(),
            });

            // Refresh events
            const eventsQuery = query(
                collection(db, 'events'),
                where('participants', 'array-contains', user.uid)
            );
            const snapshot = await getDocs(eventsQuery);
            const eventsData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    startTime: data.startTime.toDate(),
                    endTime: data.endTime.toDate(),
                    location: data.location,
                    groupId: data.groupId,
                    color: data.color || 'primary',
                };
            });
            setEvents(eventsData);

            setNewEvent({
                title: '',
                description: '',
                date: '',
                startTime: '09:00',
                endTime: '10:00',
                location: '',
            });
            setShowEventModal(false);
        } catch (error) {
            console.error('Error adding event:', error);
        }
    };

    const days = getDaysInMonth(currentDate);
    const todayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    return (
        <div className="card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Lịch</h3>
                <button
                    onClick={() => setShowEventModal(true)}
                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                    <div key={day} className="text-center text-xs text-dark-500 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                    if (!date) {
                        return <div key={index} className="aspect-square" />;
                    }

                    const dayEvents = getEventsForDate(date);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();

                    return (
                        <button
                            key={index}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                                'aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative',
                                isToday(date) && 'bg-primary-500 text-dark-900 font-bold',
                                isSelected && !isToday(date) && 'bg-primary-100 dark:bg-primary-900/30',
                                !isToday(date) && !isSelected && 'hover:bg-dark-100 dark:hover:bg-dark-700'
                            )}
                        >
                            {date.getDate()}
                            {dayEvents.length > 0 && (
                                <div className="absolute bottom-1 flex gap-0.5">
                                    {dayEvents.slice(0, 3).map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'w-1 h-1 rounded-full',
                                                isToday(date) ? 'bg-dark-900' : 'bg-primary-500'
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected date events */}
            {selectedDate && (
                <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
                    <p className="text-sm font-medium mb-2">
                        {selectedDate.toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </p>
                    {todayEvents.length === 0 ? (
                        <p className="text-sm text-dark-500">Không có sự kiện</p>
                    ) : (
                        <div className="space-y-2">
                            {todayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                                >
                                    <p className="font-medium text-sm">{event.title}</p>
                                    <p className="text-xs text-dark-500 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {event.startTime.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {' - '}
                                        {event.endTime.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                    {event.location && (
                                        <p className="text-xs text-dark-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {event.location}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add event modal */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Thêm sự kiện</h3>
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Tiêu đề"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="VD: Học nhóm IELTS"
                            />

                            <Input
                                label="Ngày"
                                type="date"
                                value={newEvent.date}
                                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Bắt đầu"
                                    type="time"
                                    value={newEvent.startTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                />
                                <Input
                                    label="Kết thúc"
                                    type="time"
                                    value={newEvent.endTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                />
                            </div>

                            <Input
                                label="Địa điểm (tùy chọn)"
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                placeholder="VD: Thư viện Quốc gia"
                                leftIcon={<MapPin size={20} />}
                            />

                            <textarea
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                placeholder="Ghi chú (tùy chọn)..."
                                className="input min-h-20 resize-none"
                            />

                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowEventModal(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleAddEvent}
                                    disabled={!newEvent.title || !newEvent.date}
                                >
                                    Thêm
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
