'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DonorIdentity, DonationRecord } from '@/lib/donor-identity';

interface DonationHistoryProps {
    identity: DonorIdentity;
}

export default function DonationHistory({ identity }: DonationHistoryProps) {
    const { donationHistory, donationCount } = identity;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-white flex items-center justify-between">
                    <span>Donation History</span>
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                        {donationCount} {donationCount === 1 ? 'donation' : 'donations'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {donationHistory.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <p className="text-zinc-500 text-sm">No donations yet</p>
                        <p className="text-zinc-600 text-xs mt-1">Your first donation could save a life!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {donationHistory.slice(0, 5).map((record, index) => (
                            <div key={record.id}>
                                {index > 0 && <Separator className="bg-zinc-800 mb-3" />}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-white font-medium">{record.hospitalName}</p>
                                        <p className="text-xs text-zinc-500">{formatDate(record.date)}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
                                        {record.bloodType}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {donationHistory.length > 5 && (
                            <p className="text-xs text-zinc-500 text-center pt-2">
                                +{donationHistory.length - 5} more donations
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
