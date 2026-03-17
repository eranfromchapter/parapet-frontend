import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketContextProps {
  description: string;
}

export function MarketContext({ description }: MarketContextProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Context</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-700 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
