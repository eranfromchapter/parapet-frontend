'use client';

import { useState } from 'react';

// The backend serves /v1/spatial/{spatialId}/floor-plan as either a PNG
// or a PDF depending on what the Polycam upload produced. Try the image
// path first; on error, fall through to a PDF embed; on PDF error, hide.
export function FloorPlanPreview({
  spatialId,
  className,
  pdfHeight = 300,
}: {
  spatialId: string;
  className?: string;
  pdfHeight?: number;
}) {
  const [floorPlanType, setFloorPlanType] = useState<'image' | 'pdf' | 'none'>('image');
  const floorPlanUrl = `/api/backend/v1/spatial/${spatialId}/floor-plan`;

  if (floorPlanType === 'none') return null;

  return (
    <div className={`mb-4 rounded-lg overflow-hidden border bg-white ${className ?? ''}`}>
      {floorPlanType === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={floorPlanUrl}
          alt="Floor plan"
          className="w-full h-auto block"
          onError={() => setFloorPlanType('pdf')}
        />
      )}
      {floorPlanType === 'pdf' && (
        <embed
          src={floorPlanUrl}
          type="application/pdf"
          className="w-full block"
          style={{ height: pdfHeight }}
          onError={() => setFloorPlanType('none')}
        />
      )}
    </div>
  );
}
