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
  profitShare: number;
}

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: { owners: Owner[] };
}) {
  const [owners, setOwners] = useState<Owner[]>(initialSettings.owners || []);

  const handleAddOwner = () => {
    setOwners([...owners, { name: "New Owner", profitShare: 50 }]);
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
    };
    setOwners(newOwners);
  };

  const handleSave = async () => {
    try {
      const totalProfitShare = owners.reduce(
        (sum, owner) => sum + owner.profitShare,
        0,
      );
      if (totalProfitShare !== 100) {
        toast.error(
          `Total profit share must be 100%. Currently at ${totalProfitShare}%`,
        );
        return;
      }

      await updateSettings({ owners });
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const totalProfitShare = owners.reduce(
    (sum, owner) => sum + owner.profitShare,
    0,
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Owner Profit Shares</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {owners.map((owner, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Owner Name</Label>
                  <Input
                    value={owner.name}
                    onChange={(e) =>
                      handleUpdateOwner(index, "name", e.target.value)
                    }
                  />
                </div>
                <div className="w-48">
                  <Label>Profit Share (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={owner.profitShare}
                    onChange={(e) =>
                      handleUpdateOwner(
                        index,
                        "profitShare",
                        Number(e.target.value),
                      )
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
          <Button variant="secondary" onClick={handleAddOwner}>
            <Plus className="mr-2 h-4 w-4" /> Add Owner
          </Button>
          <div
            className={`font-semibold ${totalProfitShare !== 100 ? "text-red-500" : "text-green-500"}`}
          >
            Total Profit Share: {totalProfitShare}%{" "}
            {totalProfitShare !== 100 && "(must be 100%)"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
