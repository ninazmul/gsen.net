"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Code,
  ShieldCheck,
  Info,
} from "lucide-react";

import { updateSettings } from "@/lib/actions/settings.actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Owner {
  name: string;
  email: string;
}

interface SettingsClientProps {
  initialSettings: {
    owners: Owner[];
    apiOwner?: string;
    apiSecretKey?: string;
  };
  isSuperAdmin?: boolean;
}

export default function SettingsClient({
  initialSettings,
  isSuperAdmin = false,
}: SettingsClientProps) {
  const [owners, setOwners] = useState<Owner[]>(initialSettings.owners || []);
  const [apiOwner, setApiOwner] = useState<string>(initialSettings.apiOwner || "");
  const [apiSecretKey, setApiSecretKey] = useState<string>(
    initialSettings.apiSecretKey || ""
  );
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);

  const handleAddOwner = () => {
    setOwners((prev) => [
      ...prev,
      {
        name: "",
        email: "",
      },
    ]);
  };

  const handleRemoveOwner = (index: number) => {
    setOwners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateOwner = (
    index: number,
    field: keyof Owner,
    value: string,
  ) => {
    setOwners((prev) =>
      prev.map((owner, i) =>
        i === index ? { ...owner, [field]: value } : owner,
      ),
    );
  };

  const handleGenerateSecretKey = () => {
    try {
      const array = new Uint8Array(24);
      window.crypto.getRandomValues(array);
      const hex = Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const generated = `gsen_live_${hex}`;
      setApiSecretKey(generated);
      setShowSecretKey(true);
      toast.success(
        "Generated new API Secret Key! Remember to click 'Save Changes' to activate it.",
      );
    } catch {
      toast.error("Failed to generate secret key");
    }
  };

  const handleCopySecretKey = async () => {
    if (!apiSecretKey) {
      toast.error("No API secret key to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(apiSecretKey);
      setCopiedKey(true);
      toast.success("API Secret Key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const owner of owners) {
        if (!owner.name.trim()) {
          toast.error("Owner name is required");
          setIsSaving(false);
          return;
        }

        if (!owner.email.trim()) {
          toast.error(`Email is required for ${owner.name}`);
          setIsSaving(false);
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) {
          toast.error(`Invalid email for ${owner.name}`);
          setIsSaving(false);
          return;
        }
      }

      const payload: {
        owners: Owner[];
        apiOwner?: string;
        apiSecretKey?: string;
      } = { owners };

      if (isSuperAdmin) {
        payload.apiOwner = apiOwner.trim();
        payload.apiSecretKey = apiSecretKey.trim();
      }

      await updateSettings(payload);

      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system configurations, owners, and external API report integrations.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* API Configuration Card */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Reports API Access</CardTitle>
              {isSuperAdmin ? (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Super Admin
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Read Only
                </Badge>
              )}
            </div>
            <CardDescription>
              Configure API credentials to allow other websites to securely fetch real-time reports data.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="text-xs gap-1.5"
          >
            <Code className="h-3.5 w-3.5" />
            {showApiDocs ? "Hide API Docs" : "View API Docs"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isSuperAdmin && (
            <div className="flex items-center gap-2 p-3 text-sm bg-muted/60 rounded-md border text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" />
              <span>Only Super Administrators can configure or rotate API credentials.</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* API Owner Input */}
            <div className="space-y-2">
              <Label htmlFor="api-owner" className="flex items-center justify-between">
                <span>API Owner Identifier</span>
                {owners.length > 0 && isSuperAdmin && (
                  <span className="text-xs text-muted-foreground">
                    Quick fill:{" "}
                    {owners.map((o, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setApiOwner(o.name)}
                        className="text-primary hover:underline ml-1"
                      >
                        {o.name}
                        {idx < owners.length - 1 ? "," : ""}
                      </button>
                    ))}
                  </span>
                )}
              </Label>
              <Input
                id="api-owner"
                placeholder="e.g. GESN-Main or Owner Name"
                value={apiOwner}
                disabled={!isSuperAdmin}
                onChange={(e) => setApiOwner(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Provided via the <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">x-api-owner</code> header.
              </p>
            </div>

            {/* API Secret Key Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="api-secret-key">API Secret Key</Label>
                {isSuperAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSecretKey}
                    className="h-6 px-2 text-xs text-primary hover:text-primary gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Generate Key
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-secret-key"
                    type={showSecretKey ? "text" : "password"}
                    placeholder="Set secret key or click Generate"
                    value={apiSecretKey}
                    disabled={!isSuperAdmin}
                    onChange={(e) => setApiSecretKey(e.target.value)}
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showSecretKey ? "Hide key" : "Reveal key"}
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecretKey}
                  disabled={!apiSecretKey}
                  title="Copy secret key"
                >
                  {copiedKey ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Provided via the <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">x-api-secret-key</code> header or Bearer token.
              </p>
            </div>
          </div>

          {/* API Documentation Preview */}
          {showApiDocs && (
            <div className="mt-4 rounded-lg border bg-muted/40 p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Globe className="h-4 w-4 text-primary" />
                <span>API Endpoint Usage & Reference</span>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground">
                  External applications can query this endpoint with real-time updates:
                </p>
                <div className="bg-background border rounded p-2 font-mono text-[11px] select-all overflow-x-auto">
                  GET /api/reports?period=thisMonth
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Required Headers:</span>
                <div className="bg-background border rounded p-2 font-mono text-[11px] space-y-1 overflow-x-auto">
                  <div>x-api-owner: {apiOwner || "YOUR_API_OWNER"}</div>
                  <div>x-api-secret-key: {apiSecretKey ? (showSecretKey ? apiSecretKey : "••••••••••••••••") : "YOUR_SECRET_KEY"}</div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Example cURL Request:</span>
                <pre className="bg-slate-950 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
{`curl -X GET "http${typeof window !== "undefined" && window.location.protocol === "https:" ? "s" : ""}://${typeof window !== "undefined" ? window.location.host : "localhost:3000"}/api/reports?period=thisMonth" \\
  -H "x-api-owner: ${apiOwner || "YOUR_API_OWNER"}" \\
  -H "x-api-secret-key: ${apiSecretKey || "YOUR_SECRET_KEY"}"`}
                </pre>
              </div>

              <div className="space-y-1 pt-1">
                <span className="font-semibold text-muted-foreground">Supported Query Parameters:</span>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li><code className="font-mono text-foreground">period</code>: today, yesterday, last7days, last30days, thisMonth, lastMonth, thisYear, all</li>
                  <li><code className="font-mono text-foreground">startDate</code> &amp; <code className="font-mono text-foreground">endDate</code>: Custom ISO date filters (e.g. 2026-01-01)</li>
                  <li><code className="font-mono text-foreground">type</code>: all (default), summary, income, expense, profit, category, monthly</li>
                  <li><code className="font-mono text-foreground">year</code>: Year number for monthly performance report (e.g. 2026)</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owners Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Management</CardTitle>
          <CardDescription>
            Manage company owners associated with financial accounts and reports.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {owners.map((owner, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <Label htmlFor={`owner-name-${index}`}>Owner Name</Label>

                <Input
                  id={`owner-name-${index}`}
                  placeholder="Enter owner name"
                  value={owner.name}
                  onChange={(e) =>
                    handleUpdateOwner(index, "name", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor={`owner-email-${index}`}>Owner Email</Label>

                <Input
                  id={`owner-email-${index}`}
                  type="email"
                  placeholder="owner@example.com"
                  value={owner.email}
                  onChange={(e) =>
                    handleUpdateOwner(index, "email", e.target.value)
                  }
                />
              </div>

              <div className="flex items-end justify-end">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveOwner(index)}
                  disabled={owners.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              onClick={handleAddOwner}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Owner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
