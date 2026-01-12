'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTEREST_OPTIONS, Interest } from '@/types';

interface InterestsPickerProps {
    selected: string[];
    onChange: (interests: string[]) => void;
    min?: number;
    max?: number;
}

const categories = {
    'Học tập': INTEREST_OPTIONS.filter((_, i) => i < 25),
    'Sở thích': INTEREST_OPTIONS.filter((_, i) => i >= 25 && i < 50),
    'Soft skills': INTEREST_OPTIONS.filter((_, i) => i >= 50),
};

export function InterestsPicker({
    selected,
    onChange,
    min = 5,
    max = 15,
}: InterestsPickerProps) {
    const [activeCategory, setActiveCategory] = useState<string>('Học tập');

    const toggleInterest = (interest: string) => {
        if (selected.includes(interest)) {
            onChange(selected.filter((i) => i !== interest));
        } else if (selected.length < max) {
            onChange([...selected, interest]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {Object.keys(categories).map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                            activeCategory === category
                                ? 'bg-primary-500 text-dark-900'
                                : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'
                        )}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Counter */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-dark-500">
                    Đã chọn: <span className="font-medium text-dark-800 dark:text-white">{selected.length}</span> / {max}
                </span>
                {selected.length < min && (
                    <span className="text-accent-300">
                        Cần chọn ít nhất {min} sở thích
                    </span>
                )}
            </div>

            {/* Interest tags */}
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {categories[activeCategory as keyof typeof categories].map((interest) => {
                    const isSelected = selected.includes(interest);
                    return (
                        <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                                'border-2',
                                isSelected
                                    ? 'bg-primary-500 border-primary-500 text-dark-900'
                                    : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:border-primary-300'
                            )}
                        >
                            {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                            {interest}
                        </button>
                    );
                })}
            </div>

            {/* Selected interests */}
            {selected.length > 0 && (
                <div className="pt-4 border-t border-dark-100 dark:border-dark-700">
                    <p className="text-sm text-dark-500 mb-2">Đã chọn:</p>
                    <div className="flex flex-wrap gap-2">
                        {selected.map((interest) => (
                            <span
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className="tag cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-800"
                            >
                                {interest}
                                <span className="ml-1 text-primary-600">×</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
