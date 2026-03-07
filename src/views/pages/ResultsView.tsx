/**
 * ResultsView — Page 2
 * 
 * Displays after emergency request is submitted:
 * - Ranked donor table (Rank | Donor Name | Blood Group | Distance | Availability)
 * - Algorithm execution logs
 * - Action buttons (Confirm Selection, Cancel, Complete)
 */

'use client';

import type { Donor, BloodType } from '@/models/donor';
import type { SelectionLog, PipelineLog } from '@/models/emergency';
import type { HospitalState } from '@/viewmodels/useEmergencyRequest';
import DonorTable from '@/views/components/DonorTable';
import ExecutionLog from '@/views/components/ExecutionLog';

interface ResultsViewProps {
    hospitalState: HospitalState;
    activeBloodType: BloodType;
    prioritizedDonors: Donor[];
    selectionLog: SelectionLog | null;
    pipelineLogs: PipelineLog;
    selectedDonorIds: string[];
    confirmationMessage: string | null;
    onToggleDonorSelection: (donorId: string) => void;
    onConfirmSelection: () => void;
    onCancelRequest: () => void;
    onCompleteRequest: () => void;
}

export default function ResultsView({
    hospitalState,
    activeBloodType,
    prioritizedDonors,
    selectionLog,
    pipelineLogs,
    selectedDonorIds,
    confirmationMessage,
    onToggleDonorSelection,
    onConfirmSelection,
    onCancelRequest,
    onCompleteRequest,
}: ResultsViewProps) {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-red-500/20 text-red-400 text-lg font-bold">
                        {activeBloodType}
                    </span>
                    <span className="text-zinc-500 text-sm">Emergency Active</span>
                </div>
                <button
                    onClick={onCancelRequest}
                    className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                    Cancel
                </button>
            </div>

            {/* Execution Logs */}
            {selectionLog && (
                <div className="mb-4">
                    <ExecutionLog
                        selectionLog={selectionLog}
                        pipelineLogs={pipelineLogs}
                    />
                </div>
            )}

            {/* Confirmation Message */}
            {confirmationMessage && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center mb-4">
                    <p className="text-green-400 font-semibold">{confirmationMessage}</p>
                </div>
            )}

            {/* Ranked Donor Table */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex-1">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-zinc-300">
                        Ranked Donors ({prioritizedDonors.length})
                    </h3>
                    <div className="flex gap-2">
                        {selectedDonorIds.length > 0 && hospitalState !== 'confirmed' && (
                            <button
                                onClick={onConfirmSelection}
                                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Confirm {selectedDonorIds.length} Donor(s)
                            </button>
                        )}
                        {hospitalState === 'confirmed' && (
                            <button
                                onClick={onCompleteRequest}
                                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Complete & Reset
                            </button>
                        )}
                    </div>
                </div>

                <DonorTable
                    donors={prioritizedDonors}
                    selectedDonorIds={selectedDonorIds}
                    onToggleSelect={onToggleDonorSelection}
                    isConfirmed={hospitalState === 'confirmed'}
                />
            </div>
        </div>
    );
}
