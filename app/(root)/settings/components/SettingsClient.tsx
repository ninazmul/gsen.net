"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateSettings } from "@/lib/actions/settings.actions";

interface Owner {
  name: string;
  email: string;
}

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: { owners: Owner[] };
}) {
  const [owners, setOwners] = useState<Owner[]>(initialSettings.owners || []);

  const handleAddOwner = () => {
    setOwners([...owners, { name: "New Owner", email: "" }]);
  };

  const handleRemoveOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index));
  };

  const handleUpdateOwner = (
    index: number,
    field: keyof Owner,
    value: string | number,
  ) => {
    const newOwners = [...owners];
    newOwners[index] = {
      ...newOwners[index],
      [field]: value,
    } as Owner;
    setOwners(newOwners);
  };

  const handleSave = async () => {
    try {
      // Validate emails
      for (const owner of owners) {
        if (!owner.email || !owner.email.trim()) {
          toast.error(`Email is required for owner: ${owner.name || "Unnamed"}`);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) {
          toast.error(`Invalid email format for owner: ${owner.name}`);
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
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Owner Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {owners.map((owner, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-[2]">
                  <Label>Owner Name</Label>
                  <Input
                    value={owner.name}
                    onChange={(e) =>
                      handleUpdateOwner(index, "name", e.target.value)
                    }
                  />
                </div>
                <div className="flex-[2]">
                  <Label>Owner Email</Label>
                  <Input
                    type="email"
                    placeholder="owner@example.com"
                    value={owner.email || ""}
                    onChange={(e) =>
                      handleUpdateOwner(index, "email", e.target.value)
                    }
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveOwner(index)}
                  disabled={owners.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button variant="secondary" onClick={handleAddOwner}>
              <Plus className="mr-2 h-4 w-4" /> Add Owner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
