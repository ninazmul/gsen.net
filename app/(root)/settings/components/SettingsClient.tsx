"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

import { updateSettings } from "@/lib/actions/settings.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Owner {
  name: string;
  email: string;
}

interface SettingsClientProps {
  initialSettings: {
    owners: Owner[];
  };
}

export default function SettingsClient({
  initialSettings,
}: SettingsClientProps) {
  const [owners, setOwners] = useState<Owner[]>(initialSettings.owners || []);

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

  const handleSave = async () => {
    try {
      for (const owner of owners) {
        if (!owner.name.trim()) {
          toast.error("Owner name is required");
          return;
        }

        if (!owner.email.trim()) {
          toast.error(`Email is required for ${owner.name}`);
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) {
          toast.error(`Invalid email for ${owner.name}`);
          return;
        }
      }

      await updateSettings({ owners });

      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>

        <Button onClick={handleSave} className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>

      {/* Owners */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Management</CardTitle>
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
