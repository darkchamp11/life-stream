'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface NotSelectedMessageProps {
    onDismiss: () => void;
}

export default function NotSelectedMessage({ onDismiss }: NotSelectedMessageProps) {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-950/20 via-zinc-950 to-zinc-950 p-4 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800">
                <CardContent className="pt-8 pb-6 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>

                    {/* Message */}
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Thank You for Responding! 💙
                    </h2>
                    <p className="text-zinc-400 mb-6 leading-relaxed">
                        Another donor nearby was selected for this request. Your willingness to help is truly appreciated!
                    </p>

                    {/* Encouragement */}
                    <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-zinc-300">
                            🌟 You're a hero for being ready to save a life. Stay on standby for the next emergency!
                        </p>
                    </div>

                    {/* Action */}
                    <Button
                        onClick={onDismiss}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white"
                    >
                        Return to Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
