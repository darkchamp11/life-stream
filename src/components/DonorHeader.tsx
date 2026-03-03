'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DNDTimer from '@/components/DNDTimer';
import type { DonorIdentity } from '@/lib/donor-identity';
import { getAvatarUrl, clearDonorIdentity, updateDonorBloodType } from '@/lib/donor-identity';
import type { BloodType } from '@/types';
import Link from 'next/link';

interface DonorHeaderProps {
    identity: DonorIdentity;
    status: 'standby' | 'dnd' | 'responding' | 'accepted' | 'confirmed' | 'not-selected';
    onDNDChange?: (isActive: boolean) => void;
    onIdentityChange?: (identity: DonorIdentity) => void;
}

export default function DonorHeader({ identity, status, onDNDChange, onIdentityChange }: DonorHeaderProps) {
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);
    const [selectedBloodType, setSelectedBloodType] = useState<BloodType>(identity.bloodType);

    const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const getStatusBadge = () => {
        switch (status) {
            case 'dnd':
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">DND</Badge>;
            case 'responding':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs animate-pulse">...</Badge>;
            case 'accepted':
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Accepted</Badge>;
            case 'confirmed':
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">📍 Route</Badge>;
            case 'not-selected':
                return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 text-xs">Standby</Badge>;
            default:
                return <Badge className="bg-zinc-700/50 text-zinc-400 border-zinc-600/30 text-xs">Standby</Badge>;
        }
    };

    const handleLogout = () => {
        clearDonorIdentity();
        sessionStorage.clear();
        router.push('/');
    };

    const handleBloodTypeChange = (type: BloodType) => {
        setSelectedBloodType(type);
        const updatedIdentity = updateDonorBloodType(type);
        onIdentityChange?.(updatedIdentity);
    };

    return (
        <>
            <header className="bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-3 py-2 sticky top-0 z-50 safe-area-pt">
                <div className="flex items-center justify-between gap-2">
                    {/* Left: Logo and Identity */}
                    <Link href="/" className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 border-2 border-red-500/30 flex-shrink-0">
                            <AvatarImage src={getAvatarUrl(identity.avatarSeed)} alt={identity.realName || identity.username} />
                            <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                                {identity.realName
                                    ? identity.realName.split(' ').map(n => n[0]).join('')
                                    : identity.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h1 className="text-sm font-semibold text-white truncate">
                                {identity.realName || identity.username}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] py-0 px-1">
                                    {identity.bloodType}
                                </Badge>
                                <span className="text-[10px] text-zinc-500 truncate">@{identity.username}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Right: Status, DND, and Settings */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge()}
                        {(status === 'standby' || status === 'dnd') && onDNDChange && (
                            <DNDTimer onDNDChange={onDNDChange} />
                        )}
                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                            aria-label="Settings"
                        >
                            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Settings</DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm">
                            Manage your blood type and account settings.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        {/* Blood Type Selector */}
                        <div>
                            <label className="text-sm text-zinc-400 block mb-2">Change Blood Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {bloodTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleBloodTypeChange(type)}
                                        className={`py-2.5 rounded-lg font-bold transition-all ${selectedBloodType === type
                                            ? 'bg-red-500 text-white ring-2 ring-red-400'
                                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-zinc-800" />

                        {/* Logout Button */}
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
