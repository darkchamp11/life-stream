/**
 * ExecutionLog View Component
 * 
 * Displays the donor selection pipeline execution logs.
 * Shows both:
 * - String array pipeline logs (as required by capstone prompt)
 * - Structured selection statistics
 */

'use client';

import type { SelectionLog, PipelineLog } from '@/models/emergency';

interface ExecutionLogProps {
    selectionLog: SelectionLog;
    pipelineLogs: PipelineLog;
}

export default function ExecutionLog({ selectionLog, pipelineLogs }: ExecutionLogProps) {
    return (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Algorithm Execution Log
            </h3>

            {/* Pipeline Logs — String Array (Prompt Requirement) */}
            <div className="mb-4 space-y-1">
                {pipelineLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 font-mono shrink-0">
                            [{i + 1}]
                        </span>
                        <span className="text-zinc-300">{log}</span>
                    </div>
                ))}
            </div>

            {/* Structured Stats */}
            <div className="border-t border-zinc-800 pt-3">
                <h4 className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
                    Selection Metrics
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Total Donors</span>
                        <span className="text-white font-mono">{selectionLog.totalDonors}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Spatial Filtered</span>
                        <span className="text-white font-mono">{selectionLog.spatialFiltered}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Within Radius</span>
                        <span className="text-white font-mono">{selectionLog.withinRadius}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Compatible</span>
                        <span className="text-emerald-400 font-mono">{selectionLog.compatible}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Nearest</span>
                        <span className="text-white font-mono">
                            {selectionLog.nearestDistanceKm !== null ? `${selectionLog.nearestDistanceKm} km` : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Farthest</span>
                        <span className="text-white font-mono">
                            {selectionLog.farthestDistanceKm !== null ? `${selectionLog.farthestDistanceKm} km` : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                        <span className="text-zinc-500">Avg Distance</span>
                        <span className="text-white font-mono">
                            {selectionLog.averageDistanceKm !== null ? `${selectionLog.averageDistanceKm} km` : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                        <span className="text-zinc-500">Sorted</span>
                        <span className="text-emerald-400 font-mono">{selectionLog.sorted ? '✓ Yes' : '✗ No'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
