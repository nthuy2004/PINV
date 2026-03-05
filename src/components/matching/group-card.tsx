'use client';

import { motion } from 'framer-motion';
import { Users, MapPin, Check, X } from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { User as UserType } from '@/types';
import { cn } from '@/lib/utils';

interface GroupCardProps {
    group: {
        id: string;
        name: string;
        description: string;
        members: string[];
        maxMembers: number;
        memberProfiles: UserType[];
    };
    onAccept: (groupId: string) => void;
    onDecline: (groupId: string) => void;
    disabled?: boolean;
}

export function GroupCard({ group, onAccept, onDecline, disabled }: GroupCardProps) {
    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="card overflow-hidden shadow-card-hover">
                {/* Header gradient */}
                <div className="h-32 bg-gradient-to-br from-primary-500 via-primary-400 to-accent-100 relative">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute bottom-4 left-5 right-5">
                        <div className="flex items-center gap-2 text-white">
                            <Users className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {group.members.length}/{group.maxMembers} thành viên
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                    <p className="text-dark-500 text-sm mb-4 line-clamp-3">{group.description}</p>

                    {/* Members */}
                    <div className="mb-5">
                        <p className="text-sm font-medium text-dark-600 dark:text-dark-300 mb-3">
                            Thành viên nhóm
                        </p>
                        <div className="space-y-2">
                            {group.memberProfiles.map((member) => (
                                <div key={member.uid} className="flex items-center gap-3 p-2 bg-dark-50 dark:bg-dark-700/50 rounded-xl">
                                    <Avatar
                                        src={member.avatar}
                                        name={member.displayName}
                                        size="sm"
                                        verified={member.isVerified}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{member.displayName}</p>
                                        <p className="text-xs text-dark-500 truncate">{member.school}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Common interests from members */}
                    {group.memberProfiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                            {Array.from(
                                new Set(group.memberProfiles.flatMap(m => m.interests || []))
                            ).slice(0, 6).map((interest, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full"
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => onDecline(group.id)}
                            disabled={disabled}
                            className="w-14 h-14 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center hover:bg-accent-100 dark:hover:bg-accent-900/30 transition-colors disabled:opacity-50"
                        >
                            <X className="w-7 h-7 text-accent-300" />
                        </button>
                        <button
                            onClick={() => onAccept(group.id)}
                            disabled={disabled}
                            className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-400 transition-colors disabled:opacity-50 shadow-lg"
                        >
                            <Check className="w-7 h-7 text-dark-900" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
