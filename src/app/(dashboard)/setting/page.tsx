"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

interface KycForm {
  firstName: string;
  lastName: string;
  bvn: string;
  nin: string;
  phone: string;
  groupName: string;
}

export default function SettingPage() {
  const { user, isLoaded } = useUser();
  const metadata = user?.publicMetadata;
  const role = metadata?.role; // "admin" or "member"

  // -------- Group Settings (Admin only) --------
  const [groupName, setGroupName] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // -------- KYC Data (All users) --------
  const [kycData, setKycData] = useState<KycForm>({
    firstName: "",
    lastName: "",
    bvn: "",
    nin: "",
    phone: "",
    groupName: "",
  });
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [savingKyc, setSavingKyc] = useState(false);

  // Load Group Settings
  useEffect(() => {
    if (!isLoaded || !user) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/settings?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setGroupName(data.groupName ?? "");
        }
      } catch (err) {
        console.error("❌ Failed to load settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [isLoaded, user]);

  // Load KYC Info — falls back to Clerk profile data if not yet saved
  useEffect(() => {
    if (!isLoaded || !user) return;
    const fetchKyc = async () => {
      try {
        const res = await fetch(`/api/kyc?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();

          // Clerk profile values used as fallbacks
          const clerkPhone = user.phoneNumbers?.[0]?.phoneNumber ?? "";

          setKycData({
            firstName: data.firstName || user.firstName || "",
            lastName: data.lastName || user.lastName || "",
            bvn: data.bvn ?? "",
            nin: data.nin ?? "",
            phone: data.phone || clerkPhone,
            groupName: data.groupName ?? "",
          });
        }
      } catch (err) {
        console.error("❌ Failed to load KYC:", err);
        // Still populate from Clerk on network/API error
        setKycData((prev) => ({
          ...prev,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          phone: user.phoneNumbers?.[0]?.phoneNumber ?? "",
        }));
      } finally {
        setLoadingKyc(false);
      }
    };
    fetchKyc();
  }, [isLoaded, user]);

  // Save Group Settings (admin only)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== "admin") return;

    setSavingSettings(true);
    try {
      const res = await fetch(`/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          groupName,
        }),
      });
      if (res.ok) {
        alert("✅ Settings updated");
      } else {
        alert("❌ Failed to save settings");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  // Save KYC Info
  const handleSaveKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingKyc(true);
    try {
      const res = await fetch(`/api/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...kycData, userId: user.id }),
      });
      if (res.ok) {
        alert("✅ KYC saved");
      } else {
        alert("❌ Failed to save KYC");
      }
    } finally {
      setSavingKyc(false);
    }
  };

  if (loadingSettings || loadingKyc) {
    return <p className="p-4">Loading settings...</p>;
  }

  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-10">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* -------- Group Settings -------- */}
      {role === "admin" && (
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Group Settings</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>

            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </div>
      )}

      {/* -------- KYC Info -------- */}
      <div className="border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">KYC Information</h2>
        <form onSubmit={handleSaveKyc} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={kycData.firstName}
              onChange={(e) =>
                setKycData({ ...kycData, firstName: e.target.value })
              }
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={kycData.lastName}
              onChange={(e) =>
                setKycData({ ...kycData, lastName: e.target.value })
              }
              placeholder="Enter your last name"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={kycData.phone}
              onChange={(e) =>
                setKycData({ ...kycData, phone: e.target.value })
              }
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <Label htmlFor="bvn">BVN</Label>
            <Input
              id="bvn"
              value={kycData.bvn}
              onChange={(e) =>
                setKycData({ ...kycData, bvn: e.target.value })
              }
              placeholder="Enter your BVN"
            />
          </div>

          <div>
            <Label htmlFor="nin">NIN</Label>
            <Input
              id="nin"
              value={kycData.nin}
              onChange={(e) =>
                setKycData({ ...kycData, nin: e.target.value })
              }
              placeholder="Enter your NIN"
            />
          </div>

          <Button type="submit" disabled={savingKyc}>
            {savingKyc ? "Saving..." : "Save KYC"}
          </Button>
        </form>
      </div>
    </div>
  );
}