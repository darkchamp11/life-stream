/**
 * BloodTypeSelector View Component
 * 
 * Grid of 8 blood type buttons for selection.
 * Pure presentation — receives selection state and callback from parent.
 */

'use client';

import type { BloodType } from '@/models/donor';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface BloodTypeSelectorProps {
    selectedType: BloodType;
    onSelect: (type: BloodType) => void;
    disabled?: boolean;
}

export default function BloodTypeSelector({ selectedType, onSelect, disabled }: BloodTypeSelectorProps) {
    return (
        <div>
            <label className="block text-sm text-zinc-400 mb-3">Select Blood Type</label>
            <div className="grid grid-cols-4 gap-2">
                {BLOOD_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => onSelect(type)}
                        disabled={disabled}
                        className={`py-3 rounded-lg font-bold transition-all ${selectedType === type
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
    );
}
