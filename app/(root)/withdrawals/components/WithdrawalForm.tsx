"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createWithdrawal,
  updateWithdrawal,
  getOwnerBalance,
} from "@/lib/actions/withdrawal.actions";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/actions/settings.actions";
import { toast } from "react-hot-toast";

interface Withdrawal {
  _id: string;
  owner: string;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WithdrawalFormProps {
  withdrawal?: Withdrawal;
  onSuccess: () => void;
}

interface WithdrawalFormData {
  owner: string;
  amount: number;
  date: string;
  description: string;
}

interface Owner {
  name: string;
  profitShare: number;
}

export default function WithdrawalForm({
  withdrawal,
  onSuccess,
}: WithdrawalFormProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  useEffect(() => {
    async function loadSettings() {
      const settings = await getSettings();
      setOwners(settings.owners || []);
    }
    loadSettings();
  }, []);

  const form = useForm<WithdrawalFormData>({
    defaultValues: withdrawal
      ? {
          owner: withdrawal.owner,
          amount: withdrawal.amount,
          date: new Date(withdrawal.date).toISOString().split("T")[0],
          description: withdrawal.description ?? "",
        }
      : {
          owner: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          description: "",
        },
  });

  // Watch the owner field to update available balance
  const selectedOwner = form.watch("owner");

  useEffect(() => {
    async function loadBalance() {
      if (selectedOwner) {
        const balance = await getOwnerBalance(selectedOwner);
        setAvailableBalance(balance);
      } else {
        setAvailableBalance(0);
      }
    }
    loadBalance();
  }, [selectedOwner]);

  const onSubmit = async (data: WithdrawalFormData) => {
    try {
      if (withdrawal) {
        await updateWithdrawal(withdrawal._id, {
          owner: data.owner,
          amount: data.amount,
          date: new Date(data.date),
          description: data.description || undefined,
        });
      } else {
        await createWithdrawal({
          owner: data.owner,
          amount: data.amount,
          date: new Date(data.date),
          description: data.description || undefined,
        });
      }
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast.error(errorMessage);
      console.error("Error saving withdrawal:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="owner"
          rules={{ required: "Owner is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.name} value={owner.name}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedOwner && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm">
              Available Balance: <span className={`font-bold ${availableBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                ৳{availableBalance.toFixed(2)}
              </span>
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="amount"
          rules={{ 
            required: "Amount is required",
            validate: (value) => {
              if (value <= 0) return "Amount must be greater than 0";
              if (value > availableBalance) return `Amount exceeds available balance (৳${availableBalance.toFixed(2)})`;
              return true;
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          rules={{ required: "Date is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Withdrawal description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {withdrawal ? "Update Withdrawal" : "Add Withdrawal"}
        </Button>
      </form>
    </Form>
  );
}
