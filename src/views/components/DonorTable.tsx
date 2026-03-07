/**
 * DonorTable View Component
 * 
 * Displays ranked donors in a table format:
 * Rank | Donor Name | Blood Group | Distance | Availability
 * 
 * As specified in the capstone prompt for the Results Page.
 */

'use client';

import type { Donor } from '@/models/donor';

interface DonorTableProps {
    donors: Donor[];
    selectedDonorIds: string[];
    onToggleSelect: (donorId: string) => void;
    isConfirmed: boolean;
}

export default function DonorTable({ donors, selectedDonorIds, onToggleSelect, isConfirmed }: DonorTableProps) {
    if (donors.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                No eligible donors found within search radius.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-2 text-zinc-400 font-medium">Rank</th>
                        <th className="text-left py-3 px-2 text-zinc-400 font-medium">Donor Name</th>
                        <th className="text-left py-3 px-2 text-zinc-400 font-medium">Blood Group</th>
                        <th className="text-left py-3 px-2 text-zinc-400 font-medium">Distance</th>
                        <th className="text-left py-3 px-2 text-zinc-400 font-medium">Availability</th>
                        <th className="text-left py-3 px-2 text-zinc-400 font-medium">Select</th>
                    </tr>
                </thead>
                <tbody>
                    {donors.map((donor, index) => {
                        const isSelected = selectedDonorIds.includes(donor.id);
                        return (
                            <tr
                                key={donor.id}
                                className={`border-b border-zinc-800/50 transition-colors ${isSelected ? 'bg-green-500/10' : 'hover:bg-zinc-800/50'
                                    }`}
                            >
                                <td className="py-3 px-2">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold">
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-white font-medium">
                                    {donor.name}
                                </td>
                                <td className="py-3 px-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-bold">
                                        {donor.bloodType}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-zinc-300 font-mono">
                                    {donor.distance !== undefined
                                        ? `${Math.round(donor.distance * 100) / 100} km`
                                        : '—'}
                                </td>
                                <td className="py-3 px-2">
                                    <span className={`inline-flex items-center gap-1 text-xs ${donor.availability || donor.status === 'active'
                                            ? 'text-green-400'
                                            : 'text-zinc-500'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${donor.availability || donor.status === 'active'
                                                ? 'bg-green-400'
                                                : 'bg-zinc-600'
                                            }`} />
                                        {donor.availability || donor.status === 'active' ? 'Available' : 'Unavailable'}
                                    </span>
                                </td>
                                <td className="py-3 px-2">
                                    <button
                                        onClick={() => onToggleSelect(donor.id)}
                                        disabled={isConfirmed}
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-zinc-600 hover:border-blue-500'
                                            } ${isConfirmed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        {isSelected && (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
