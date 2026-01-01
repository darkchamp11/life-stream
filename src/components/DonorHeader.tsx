'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DNDTimer from '@/components/DNDTimer';
import type { DonorIdentity } from '@/lib/donor-identity';
import { getAvatarUrl } from '@/lib/donor-identity';
import Link from 'next/link';

interface DonorHeaderProps {
    identity: DonorIdentity;
    status: 'standby' | 'dnd' | 'responding' | 'accepted' | 'confirmed' | 'not-selected';
    onDNDChange?: (isActive: boolean) => void;
}

export default function DonorHeader({ identity, status, onDNDChange }: DonorHeaderProps) {
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

    return (
        <header className="bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-3 py-2 sticky top-0 z-50 safe-area-pt">
            <div className="flex items-center justify-between gap-2">
                {/* Left: Logo and Identity */}
                <Link href="/" className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar className="h-9 w-9 border-2 border-red-500/30 flex-shrink-0">
                        <AvatarImage src={getAvatarUrl(identity.avatarSeed)} alt={identity.realName} />
                        <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                            {identity.realName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold text-white truncate">{identity.realName}</h1>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] py-0 px-1">
                                {identity.bloodType}
                            </Badge>
                            <span className="text-[10px] text-zinc-500 truncate">@{identity.username}</span>
                        </div>
                    </div>
                </Link>

                {/* Right: Status and DND */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge()}
                    {(status === 'standby' || status === 'dnd') && onDNDChange && (
                        <DNDTimer onDNDChange={onDNDChange} />
                    )}
                </div>
            </div>
        </header>
    );
}
