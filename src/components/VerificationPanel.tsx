'use client';

/**
 * Algorithm Verification Panel (Demo Mode)
 * 
 * Displays real-time execution status and logs of each algorithmic step
 * in the donor selection pipeline for review demonstration.
 * 
 * Steps verified:
 * 1. H3 / Geohash index computed
 * 2. Candidate donors filtered
 * 3. Haversine distance calculated
 * 4. Blood group compatibility checked
 * 5. Availability verified
 * 6. Donors ranked by distance
 */

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useRef } from 'react';

export type StepStatus = 'pending' | 'running' | 'complete';

export interface ExecutionLog {
    step: string;
    message: string;
    data?: string;
    timestamp: Date;
}

export interface VerificationState {
    h3IndexComputed: StepStatus;
    donorsFiltered: StepStatus;
    distanceCalculated: StepStatus;
    bloodGroupChecked: StepStatus;
    availabilityVerified: StepStatus;
    donorsRanked: StepStatus;
}

interface VerificationPanelProps {
    state: VerificationState;
    isScanning?: boolean;
    logs?: ExecutionLog[];
}

const VERIFICATION_STEPS = [
    { key: 'h3IndexComputed', label: 'H3 / Geohash index computed', icon: '🗺️' },
    { key: 'donorsFiltered', label: 'Candidate donors filtered', icon: '🔍' },
    { key: 'distanceCalculated', label: 'Haversine distance calculated', icon: '📏' },
    { key: 'bloodGroupChecked', label: 'Blood group compatibility checked', icon: '🩸' },
    { key: 'availabilityVerified', label: 'Availability verified', icon: '✅' },
    { key: 'donorsRanked', label: 'Donors ranked by distance', icon: '📊' },
] as const;

// Spinner component for running state
function Spinner() {
    return (
        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    );
}

export default function VerificationPanel({ state, isScanning = false, logs = [] }: VerificationPanelProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const completedCount = Object.values(state).filter(s => s === 'complete').length;
    const runningCount = Object.values(state).filter(s => s === 'running').length;
    const allComplete = completedCount === VERIFICATION_STEPS.length;
    const isProcessing = runningCount > 0 || isScanning;

    // Auto-expand when scanning starts so evaluator can see progress
    useEffect(() => {
        if (isProcessing && detailsRef.current) {
            detailsRef.current.open = true;
        }
    }, [isProcessing]);

    // Auto-scroll logs to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const getStatusIcon = (status: StepStatus) => {
        switch (status) {
            case 'running':
                return <Spinner />;
            case 'complete':
                return <span className="text-green-500">✔</span>;
            default:
                return <span className="text-zinc-600">○</span>;
        }
    };

    const getStatusStyle = (status: StepStatus) => {
        switch (status) {
            case 'running':
                return 'bg-amber-500/10 border border-amber-500/30';
            case 'complete':
                return 'bg-green-500/10';
            default:
                return 'bg-zinc-800/50';
        }
    };

    const getTextStyle = (status: StepStatus) => {
        switch (status) {
            case 'running':
                return 'text-amber-400';
            case 'complete':
                return 'text-green-400';
            default:
                return 'text-zinc-500';
        }
    };

    // Get logs for a specific step
    const getLogsForStep = (stepKey: string) => {
        return logs.filter(log => log.step === stepKey);
    };

    return (
        <details ref={detailsRef} className="group mb-4" open={isProcessing}>
            <summary className="flex items-center justify-between cursor-pointer text-zinc-300 text-sm p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔬</span>
                    <span className="font-medium">Algorithm Verification Panel (Execution Trace)</span>
                </div>
                <div className="flex items-center gap-2">
                    {isProcessing && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                            Processing...
                        </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${allComplete ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
                        {completedCount}/{VERIFICATION_STEPS.length}
                    </span>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </summary>

            <Card className="mt-2 bg-zinc-900/80 border-zinc-700/50">
                <CardContent className="p-4">
                    <div className="grid gap-2">
                        {VERIFICATION_STEPS.map(({ key, label, icon }) => {
                            const status = state[key as keyof VerificationState];
                            const stepLogs = getLogsForStep(key);
                            return (
                                <div key={key} className="space-y-1">
                                    <div
                                        className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${getStatusStyle(status)}`}
                                    >
                                        <span className="text-lg w-6 text-center">{icon}</span>
                                        <span className={`flex-1 text-sm transition-colors duration-300 ${getTextStyle(status)}`}>
                                            {label}
                                            {status === 'running' && (
                                                <span className="ml-2 text-xs text-amber-400/70">executing...</span>
                                            )}
                                        </span>
                                        <span className="text-lg w-6 flex justify-center">
                                            {getStatusIcon(status)}
                                        </span>
                                    </div>

                                    {/* Execution logs for this step */}
                                    {stepLogs.length > 0 && (
                                        <div className="ml-8 space-y-1">
                                            {stepLogs.map((log, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-xs bg-zinc-950/50 rounded px-2 py-1 font-mono border-l-2 border-zinc-700"
                                                >
                                                    <span className="text-zinc-500">
                                                        {log.timestamp.toLocaleTimeString('en-US', {
                                                            hour12: false,
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            fractionalSecondDigits: 3
                                                        })}
                                                    </span>
                                                    <span className="text-zinc-400 ml-2">{log.message}</span>
                                                    {log.data && (
                                                        <span className="text-green-400 ml-1">{log.data}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div ref={logsEndRef} />

                    {allComplete && (
                        <div className="mt-3 pt-3 border-t border-zinc-700/50 text-center">
                            <span className="text-green-400 text-sm font-medium">
                                ✅ All verification steps completed successfully
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </details>
    );
}
