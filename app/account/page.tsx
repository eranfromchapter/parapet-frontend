'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, Pencil, Check,
  Mail, Phone, MapPin,
  KeyRound, Shield, FileText, HelpCircle,
  Bell, MessageSquare, LogOut, DollarSign,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ai-owners-rep-production.up.railway.app";

// ── Types ──

interface Address {
  street: string | null;
  unit: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface Preferences {
  push_notifications: boolean;
  email_updates: boolean;
  sms_alerts: boolean;
}

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: Address | null;
  tier: string;
  tier_display_name: string;
  tier_price: number | null;
  tier_features: string[];
  member_since: string | null;
  next_billing_date: string | null;
  preferences: Preferences;
}

// ── API helpers ──

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/v1/users/profile`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function updateProfile(data: Record<string, any>): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/v1/users/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

async function updatePreferences(data: Partial<Preferences>): Promise<Preferences> {
  const res = await fetch(`${API_URL}/v1/users/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update preferences");
  return res.json();
}

// ── Helpers ──

function getInitials(first: string | null, last: string | null, email: string | null): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return "U";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

function tierBadgeLabel(tier: string): string {
  const map: Record<string, string> = {
    free: "FREE",
    bidding_pro: "PRO",
    design_manager: "DESIGN",
    full_rep: "FULL REP",
  };
  return map[tier] || tier.toUpperCase();
}

// ── Component ──

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editPhone, setEditPhone] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editZip, setEditZip] = useState("");

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Populate edit fields when entering edit mode
  const startEditing = () => {
    if (!profile) return;
    setEditPhone(profile.phone || "");
    setEditStreet(profile.address?.street || "");
    setEditUnit(profile.address?.unit || "");
    setEditCity(profile.address?.city || "");
    setEditState(profile.address?.state || "");
    setEditZip(profile.address?.zip || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const data = await updateProfile({
        phone: editPhone || null,
        address: {
          street: editStreet || null,
          unit: editUnit || null,
          city: editCity || null,
          state: editState || null,
          zip: editZip || null,
        },
      });
      setProfile(data);
      setEditing(false);
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = async (key: keyof Preferences) => {
    if (!profile) return;
    const prev = profile.preferences[key];
    // Optimistic update
    setProfile({
      ...profile,
      preferences: { ...profile.preferences, [key]: !prev },
    });
    try {
      await updatePreferences({ [key]: !prev });
    } catch {
      // Revert
      setProfile({
        ...profile,
        preferences: { ...profile.preferences, [key]: prev },
      });
      toast({ title: "Error", description: "Failed to update preference", variant: "destructive" });
    }
  };

  const handleSignOut = () => {
    toast({ title: "Signed out successfully" });
    router.push("/");
  };

  const comingSoon = (label: string) => {
    toast({ title: label, description: "Coming soon" });
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
            <div className="h-5 w-28 rounded bg-gray-200 animate-pulse" />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) return null;

  const initials = getInitials(profile.first_name, profile.last_name, profile.email);
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={22} className="text-[#1E3A5F]" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1E3A5F] leading-tight">My Account</h1>
            <p className="text-[13px] text-[#64748B]">Manage your profile &amp; settings</p>
          </div>
        </div>
      </header>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 safe-bottom overflow-y-auto px-4 py-6 space-y-6">

        {/* ── Profile Card ── */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
            <span className="text-[18px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-[#1E3A5F] truncate">{fullName}</p>
              <span className="bg-[#1E3A5F] text-white text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0">
                {tierBadgeLabel(profile.tier)}
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] truncate">{profile.email || "—"}</p>
            <p className="text-[12px] text-[#64748B]">Member since {formatDate(profile.member_since)}</p>
          </div>
        </div>

        {/* ── Personal Information ── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Personal Information
            </h2>
            {!editing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-1 text-[12px] font-medium text-[#1E3A5F]"
              >
                <Pencil size={12} /> Edit
              </button>
            ) : (
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-1 text-[12px] font-medium text-[#1E3A5F]"
              >
                <Check size={12} /> {saving ? "Saving..." : "Save"}
              </button>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            {/* First Name */}
            <div className="py-2">
              <p className="text-[11px] text-[#64748B] uppercase mb-0.5">First Name</p>
              <p className="text-[14px] text-[#1E3A5F] font-medium">{profile.first_name || "—"}</p>
            </div>
            <div className="border-b border-[#F1F5F9]" />

            {/* Last Name */}
            <div className="py-2">
              <p className="text-[11px] text-[#64748B] uppercase mb-0.5">Last Name</p>
              <p className="text-[14px] text-[#1E3A5F] font-medium">{profile.last_name || "—"}</p>
            </div>
            <div className="border-b border-[#F1F5F9]" />

            {/* Email */}
            <div className="flex items-center gap-3 py-2">
              <Mail size={16} className="text-[#64748B] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#64748B] uppercase mb-0.5">Email</p>
                <p className="text-[14px] text-[#1E3A5F] font-medium truncate">{profile.email || "—"}</p>
              </div>
            </div>
            <div className="border-b border-[#F1F5F9]" />

            {/* Phone */}
            <div className="flex items-center gap-3 py-2">
              <Phone size={16} className="text-[#64748B] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#64748B] uppercase mb-0.5">Phone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full text-[14px] text-[#1E3A5F] font-medium bg-transparent border-b border-[#1E3A5F]/30 outline-none focus:border-[#1E3A5F] pb-0.5"
                  />
                ) : (
                  <p className="text-[14px] text-[#1E3A5F] font-medium">{profile.phone || "—"}</p>
                )}
              </div>
            </div>
            <div className="border-b border-[#F1F5F9]" />

            {/* Address */}
            <div className="flex items-start gap-3 py-2">
              <MapPin size={16} className="text-[#64748B] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#64748B] uppercase mb-0.5">Address</p>
                {editing ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      placeholder="Street address"
                      className="w-full text-[14px] text-[#1E3A5F] font-medium bg-transparent border-b border-[#1E3A5F]/30 outline-none focus:border-[#1E3A5F] pb-0.5"
                    />
                    <input
                      type="text"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      placeholder="Apt / Unit (optional)"
                      className="w-full text-[14px] text-[#1E3A5F] font-medium bg-transparent border-b border-[#1E3A5F]/30 outline-none focus:border-[#1E3A5F] pb-0.5"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="City"
                        className="flex-1 text-[14px] text-[#1E3A5F] font-medium bg-transparent border-b border-[#1E3A5F]/30 outline-none focus:border-[#1E3A5F] pb-0.5"
                      />
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        placeholder="ST"
                        className="w-12 text-[14px] text-[#1E3A5F] font-medium bg-transparent border-b border-[#1E3A5F]/30 outline-none focus:border-[#1E3A5F] pb-0.5"
                      />
                      <input
                        type="text"
                        value={editZip}
                        onChange={(e) => setEditZip(e.target.value)}
                        placeholder="ZIP"
                        className="w-16 text-[14px] text-[#1E3A5F] font-medium bg-transparent border-b border-[#1E3A5F]/30 outline-none focus:border-[#1E3A5F] pb-0.5"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {profile.address?.street ? (
                      <>
                        <p className="text-[14px] text-[#1E3A5F] font-medium">
                          {profile.address.street}{profile.address.unit ? `, ${profile.address.unit}` : ""}
                        </p>
                        <p className="text-[14px] text-[#1E3A5F] font-medium">
                          {[profile.address.city, profile.address.state].filter(Boolean).join(", ")}{profile.address.zip ? ` ${profile.address.zip}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-[14px] text-[#1E3A5F] font-medium">—</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Payment Methods ── */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
            Payment Methods
          </h2>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col items-center justify-center text-center py-8">
            <DollarSign size={24} className="text-[#64748B] mb-2" />
            <p className="text-[14px] font-medium text-[#1E3A5F]">Payment methods coming soon</p>
            <p className="text-[12px] text-[#64748B] mt-1">We&apos;ll notify you when payment processing is available.</p>
          </div>
        </section>

        {/* ── Subscription ── */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
            Subscription
          </h2>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[16px] font-bold text-[#1E3A5F]">
                  {profile.tier_display_name || "Free"}
                </p>
              </div>
              <span className="bg-[#1E3A5F] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>

            {profile.tier_price && (
              <p className="text-[20px] font-bold text-[#1E3A5F] mb-1">
                ${profile.tier_price}<span className="text-[13px] text-[#64748B] font-normal">/mo</span>
              </p>
            )}

            {profile.tier_features.length > 0 && (
              <ul className="space-y-1.5 mt-3 mb-4">
                {profile.tier_features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-[13px] text-[#64748B]">
                    <Check size={14} className="text-[#10B981] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {profile.next_billing_date && (
              <p className="text-[12px] text-[#64748B] mt-2">
                Next billing date: {formatDate(profile.next_billing_date)}
              </p>
            )}

            <button
              onClick={() => comingSoon("Manage Plan")}
              className="w-full mt-3 py-2.5 text-[13px] font-semibold text-[#1E3A5F] border border-[#E2E8F0] rounded-xl hover:bg-gray-50 transition-colors"
            >
              Manage Plan
            </button>
          </div>
        </section>

        {/* ── Preferences ── */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
            Preferences
          </h2>
          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {([
              { key: "push_notifications" as const, label: "Push Notifications", icon: Bell },
              { key: "email_updates" as const, label: "Email Updates", icon: Mail },
              { key: "sms_alerts" as const, label: "SMS Alerts", icon: MessageSquare },
            ]).map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                <Icon size={18} className="text-[#64748B] flex-shrink-0" />
                <span className="flex-1 text-[14px] text-[#1E3A5F] font-medium">{label}</span>
                <button
                  onClick={() => togglePreference(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    profile.preferences[key] ? "bg-[#1E3A5F]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      profile.preferences[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Account Actions ── */}
        <section>
          <h2 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
            Account
          </h2>
          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
            {([
              { label: "Change Password", icon: KeyRound },
              { label: "Security & Privacy", icon: Shield },
              { label: "Terms of Service", icon: FileText },
              { label: "Help & Support", icon: HelpCircle },
            ]).map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => comingSoon(label)}
                className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-gray-50 transition-colors"
              >
                <Icon size={18} className="text-[#64748B] flex-shrink-0" />
                <span className="flex-1 text-[14px] text-[#1E3A5F] font-medium">{label}</span>
                <ChevronRight size={16} className="text-[#64748B]" />
              </button>
            ))}
          </div>
        </section>

        {/* ── Sign Out ── */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 border border-[#E2E8F0] rounded-xl text-[#EF4444] font-semibold text-[14px] bg-white hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        {/* ── Delete Account ── */}
        <div className="text-center pb-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[13px] text-[#64748B] hover:text-[#EF4444] transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full shadow-xl">
            <h3 className="text-[16px] font-bold text-[#1E3A5F] mb-2">Delete Account</h3>
            <p className="text-[13px] text-[#64748B] mb-6">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 text-[13px] font-semibold text-[#1E3A5F] border border-[#E2E8F0] rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  toast({ title: "Account deletion", description: "Account deletion will be available soon." });
                }}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-[#EF4444] rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
