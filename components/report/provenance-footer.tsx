import React from 'react';

interface ProvenanceFooterProps {
  pipeline_version: string;
  generated_at: string;
  models_used: string;
}

export function ProvenanceFooter({ pipeline_version, generated_at, models_used }: ProvenanceFooterProps) {
  return (
    <div className="bg-slate-50 border-t border-slate-200 rounded-b-xl px-6 py-4">
      <div className="flex flex-wrap gap-6 text-xs text-slate-400">
        <span>Pipeline: {pipeline_version}</span>
        <span>Generated: {new Date(generated_at).toLocaleDateString()}</span>
        <span>Models: {models_used}</span>
      </div>
    </div>
  );
}
