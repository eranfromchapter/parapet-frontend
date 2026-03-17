'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { useIntakeStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function StepLocation() {
  const { propertyAddress, setPropertyAddress, zipCode, setZipCode } = useIntakeStore();

  const handleGeolocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            if (data.postcode) {
              setZipCode(data.postcode);
            }
          } catch {
            // Silently fail
          }
        },
        () => {
          // Geolocation denied
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Where is your property?</h2>
        <p className="mt-1 text-sm text-slate-500">We use this to determine permit requirements and local pricing.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Property address</Label>
          <Input
            id="address"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            placeholder="123 Main St, Apt 4B, New York, NY"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip">ZIP code</Label>
          <Input
            id="zip"
            value={zipCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 5);
              setZipCode(val);
            }}
            placeholder="10001"
            maxLength={5}
            inputMode="numeric"
          />
        </div>

        <button
          type="button"
          onClick={handleGeolocate}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Use my current location
        </button>
      </div>
    </div>
  );
}
