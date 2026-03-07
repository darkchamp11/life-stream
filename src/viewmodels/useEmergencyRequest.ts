/**
 * useEmergencyRequest ViewModel
 * 
 * Manages the full emergency request lifecycle:
 * - Create request with donor selection pipeline
 * - Broadcast via Firebase
 * - Track state (idle/active/confirmed)
 * - Cancel/complete request
 */

'use client';

import { useState, useCallback } from 'react';
import type { Donor, BloodType, Location } from '@/models/donor';
import type { EmergencyRequest, SelectionLog, PipelineLog } from '@/models/emergency';
import { getPrioritizedDonors, generateFakeDonors } from '@/services/geo';
import { broadcastRequest, clearRequest, clearSelection, confirmDonorSelection } from '@/services/realtime';

export type HospitalState = 'idle' | 'active' | 'confirmed';

export function useEmergencyRequest(hospitalLocation: Location | null) {
    const [hospitalState, setHospitalState] = useState<HospitalState>('idle');
    const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
    const [allDonors, setAllDonors] = useState<Donor[]>([]);
    const [prioritizedDonors, setPrioritizedDonors] = useState<Donor[]>([]);
    const [selectionLog, setSelectionLog] = useState<SelectionLog | null>(null);
    const [pipelineLogs, setPipelineLogs] = useState<PipelineLog>([]);
    const [selectedDonorIds, setSelectedDonorIds] = useState<string[]>([]);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

    // Initialize donors when location is available
    const initializeDonors = useCallback((location: Location) => {
        const fakeDonors = generateFakeDonors(location);
        setAllDonors(fakeDonors);
    }, []);

    // Create emergency blood request
    const requestBlood = useCallback((selectedBloodType: BloodType, searchRadius: number, apiKey: string, hospitalName: string) => {
        if (!hospitalLocation) return;

        setConfirmationMessage(null);

        // Run donor selection engine
        const { prioritized, log, pipelineLogs: logs } = getPrioritizedDonors(
            allDonors, hospitalLocation, selectedBloodType, searchRadius
        );

        setPrioritizedDonors(prioritized);
        setSelectionLog(log);
        setPipelineLogs(logs);
        setSelectedDonorIds([]);

        // Build and broadcast request
        const request: EmergencyRequest = {
            id: `req-${Date.now()}`,
            hospitalId: apiKey,
            hospitalName: hospitalName,
            hospitalLocation,
            bloodType: selectedBloodType,
            searchRadius,
            urgency: 'critical',
            status: 'active',
            createdAt: new Date(),
            respondingDonors: [],
        };

        setHospitalState('active');
        setActiveRequest(request);
        broadcastRequest(request);

        // Console logging for technical demonstration
        console.group('[LifeStream] Donor Selection Engine');
        logs.forEach(log => console.log(`  → ${log}`));
        console.groupEnd();

    }, [hospitalLocation, allDonors]);

    // Cancel active request
    const cancelRequest = useCallback(() => {
        setActiveRequest(null);
        setHospitalState('idle');
        setPrioritizedDonors([]);
        setSelectedDonorIds([]);
        setConfirmationMessage(null);
        setSelectionLog(null);
        setPipelineLogs([]);
        setAllDonors(prev => prev.map(d => ({ ...d, status: 'active' as const })));
        clearRequest();
        clearSelection();
    }, []);

    // Toggle donor selection
    const toggleDonorSelection = useCallback((donorId: string) => {
        setSelectedDonorIds(prev =>
            prev.includes(donorId)
                ? prev.filter(id => id !== donorId)
                : [...prev, donorId]
        );
    }, []);

    // Confirm selected donors
    const confirmSelection = useCallback(() => {
        if (!activeRequest || selectedDonorIds.length === 0) return;

        confirmDonorSelection(activeRequest.id, selectedDonorIds);
        setHospitalState('confirmed');
        setConfirmationMessage(`✅ ${selectedDonorIds.length} donor(s) confirmed! They are on their way.`);
    }, [activeRequest, selectedDonorIds]);

    // Complete and reset
    const completeRequest = useCallback(() => {
        setActiveRequest(null);
        setHospitalState('idle');
        setPrioritizedDonors([]);
        setAllDonors(prev => prev.map(d => ({ ...d, status: 'active' as const })));
        setSelectedDonorIds([]);
        setConfirmationMessage(null);
        setSelectionLog(null);
        setPipelineLogs([]);
        clearRequest();
        clearSelection();
    }, []);

    // Add/remove demo donors
    const addDonor = useCallback((donor: Donor) => {
        setAllDonors(prev => [...prev, donor]);
    }, []);

    const removeDonor = useCallback((donorId: string) => {
        setAllDonors(prev => prev.filter(d => d.id !== donorId));
    }, []);

    return {
        hospitalState,
        activeRequest,
        allDonors,
        prioritizedDonors,
        setPrioritizedDonors,
        selectionLog,
        pipelineLogs,
        selectedDonorIds,
        confirmationMessage,
        initializeDonors,
        requestBlood,
        cancelRequest,
        toggleDonorSelection,
        confirmSelection,
        completeRequest,
        addDonor,
        removeDonor,
    };
}
