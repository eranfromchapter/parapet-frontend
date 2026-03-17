'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './api-client';
import type { IntakeFormData } from './types';

export function useReadinessReport(id: string) {
  return useQuery({
    queryKey: ['readiness-report', id],
    queryFn: () => api.getReadinessReport(id),
    enabled: !!id,
  });
}

export function useReadinessReports() {
  return useQuery({
    queryKey: ['readiness-reports'],
    queryFn: () => api.listReadinessReports(),
  });
}

export function useCreateReadinessReport() {
  return useMutation({
    mutationFn: (data: IntakeFormData) => api.createReadinessReport(data as unknown as Record<string, unknown>),
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ['estimate', id],
    queryFn: () => api.getEstimate(id),
    enabled: !!id,
  });
}

export function useCreateEstimate() {
  return useMutation({
    mutationFn: (reportId: string) => api.createEstimate(reportId),
  });
}

export function useVerifyContractor() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.verifyContractor(data),
  });
}

export function useSubmitUpgrade() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.submitUpgrade(data),
  });
}

export function useJoinWaitlist() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.joinWaitlist(data),
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
  });
}
