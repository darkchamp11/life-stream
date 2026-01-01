'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { enableDND, clearDND, getDNDState, formatRemainingTime } from '@/lib/dnd';

interface DNDTimerProps {
    onDNDChange?: (isActive: boolean) => void;
}

export default function DNDTimer({ onDNDChange }: DNDTimerProps) {
    const [isActive, setIsActive] = useState(false);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [timeDisplay, setTimeDisplay] = useState('00:00:00');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedHours, setSelectedHours] = useState(0);
    const [selectedMinutes, setSelectedMinutes] = useState(30);

    // Load DND state on mount
    useEffect(() => {
        const state = getDNDState();
        setIsActive(state.isActive);
        setEndTime(state.endTime);
    }, []);

    // Update countdown timer
    useEffect(() => {
        if (!isActive || !endTime) return;

        const interval = setInterval(() => {
            const remaining = endTime - Date.now();

            if (remaining <= 0) {
                clearDND();
                setIsActive(false);
                setEndTime(null);
                setTimeDisplay('00:00:00');
                onDNDChange?.(false);
            } else {
                setTimeDisplay(formatRemainingTime(endTime));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, endTime, onDNDChange]);

    const handleToggle = useCallback((checked: boolean) => {
        if (checked) {
            setIsDialogOpen(true);
        } else {
            clearDND();
            setIsActive(false);
            setEndTime(null);
            onDNDChange?.(false);
        }
    }, [onDNDChange]);

    const handleSetTimer = useCallback(() => {
        const durationMs = (selectedHours * 60 + selectedMinutes) * 60 * 1000;
        if (durationMs > 0) {
            const state = enableDND(durationMs);
            setIsActive(true);
            setEndTime(state.endTime);
            setTimeDisplay(formatRemainingTime(state.endTime));
            onDNDChange?.(true);
        }
        setIsDialogOpen(false);
    }, [selectedHours, selectedMinutes, onDNDChange]);

    // Quick preset buttons
    const presets = [
        { label: '15m', hours: 0, minutes: 15 },
        { label: '30m', hours: 0, minutes: 30 },
        { label: '1h', hours: 1, minutes: 0 },
        { label: '2h', hours: 2, minutes: 0 },
    ];

    return (
        <>
            <div className="flex items-center gap-2">
                <Switch
                    checked={isActive}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-amber-500"
                />
                {isActive && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono text-xs">
                        {timeDisplay}
                    </Badge>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg">🔕 Do Not Disturb</DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm">
                            You won't receive emergency alerts.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Quick Presets */}
                    <div className="grid grid-cols-4 gap-2 py-4">
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => {
                                    setSelectedHours(preset.hours);
                                    setSelectedMinutes(preset.minutes);
                                }}
                                className={`py-2 rounded-lg font-medium text-sm transition-all ${selectedHours === preset.hours && selectedMinutes === preset.minutes
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Time Picker */}
                    <div className="flex items-center justify-center gap-4 py-4 border-t border-zinc-800">
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                            <label className="text-xs text-zinc-500 mb-1">Hours</label>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setSelectedHours(Math.max(0, selectedHours - 1))}
                                    className="w-8 h-8 rounded bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                    -
                                </button>
                                <span className="text-2xl font-bold w-8 text-center">{selectedHours}</span>
                                <button
                                    onClick={() => setSelectedHours(Math.min(3, selectedHours + 1))}
                                    className="w-8 h-8 rounded bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <span className="text-2xl text-zinc-600">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <label className="text-xs text-zinc-500 mb-1">Minutes</label>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setSelectedMinutes(Math.max(0, selectedMinutes - 5))}
                                    className="w-8 h-8 rounded bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                    -
                                </button>
                                <span className="text-2xl font-bold w-8 text-center">
                                    {selectedMinutes.toString().padStart(2, '0')}
                                </span>
                                <button
                                    onClick={() => setSelectedMinutes(Math.min(59, selectedMinutes + 5))}
                                    className="w-8 h-8 rounded bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-zinc-500">Max: 3 hours</p>

                    <DialogFooter className="flex-row gap-2 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 text-zinc-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSetTimer}
                            disabled={selectedHours === 0 && selectedMinutes === 0}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                        >
                            Start DND
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
