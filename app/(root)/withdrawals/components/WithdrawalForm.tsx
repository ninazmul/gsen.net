"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  getWithdrawalBalances,
} from "@/lib/actions/withdrawal.actions";
import { useEffect, useState } from "react";
import { type Admin } from "@/lib/actions/admin.actions";
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
  currentAdmin?: Admin | null;
  onSuccess: () => void;
}

interface WithdrawalFormData {
  owner: string;
  amount: number;
  date: string;
  description: string;
}

interface OwnerBalanceInfo {
  name: string;
  email: string;
  balance: number;
}

export default function WithdrawalForm({
  withdrawal,
  currentAdmin,
  onSuccess,
}: WithdrawalFormProps) {
  const [ownerBalances, setOwnerBalances] = useState<OwnerBalanceInfo[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  useEffect(() => {
    async function loadBalances() {
      const res = await getWithdrawalBalances();
      setOwnerBalances(res.ownerBalances || []);
      setTotalBalance(res.totalBalance || 0);
    }
    loadBalances();
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

  // Watch the owner field to update styles or track selected
  const selectedOwner = form.watch("owner");

  // Pre-select owner based on logged in user's email matching owner email
  useEffect(() => {
    if (!withdrawal && currentAdmin?.email && ownerBalances.length > 0) {
      const match = ownerBalances.find(
        (o) =>
          o.email &&
          o.email.trim().toLowerCase() ===
            currentAdmin.email.trim().toLowerCase(),
      );
      if (match) {
        form.setValue("owner", match.name);
      }
    }
  }, [ownerBalances, currentAdmin, withdrawal, form]);

  const maxWithdrawable = withdrawal
    ? totalBalance + withdrawal.amount
    : totalBalance;

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
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
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
              <FormControl>
                <Input
                  disabled
                  placeholder="Auto-detected owner"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                The owner is detected automatically from your account.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {ownerBalances.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg space-y-2 border border-gray-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Available Balances
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {ownerBalances.map((ob) => {
                const isSelected = ob.name === selectedOwner;
                return (
                  <div
                    key={ob.name}
                    className={`flex justify-between p-2 rounded-md border transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary dark:border-primary/50"
                        : "bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-900"
                    }`}
                  >
                    <span
                      className={`font-medium ${isSelected ? "text-primary font-semibold" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      {ob.name}:
                    </span>
                    <span
                      className={`font-semibold ${ob.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {ob.balance.toFixed(2)}{" "}
                      <span className="text-xs text-muted-foreground">SAR</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-between text-sm font-bold">
              <span className="text-gray-800 dark:text-gray-200">
                Total Business Balance:
              </span>
              <span
                className={
                  totalBalance >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-rose-600 dark:text-rose-400"
                }
              >
                {totalBalance.toFixed(2)}{" "}
                <span className="text-xs text-muted-foreground">SAR</span>
              </span>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="amount"
          rules={{
            required: "Amount is required",
            validate: (value) => {
              if (value <= 0) return "Amount must be greater than 0";
              if (value > maxWithdrawable)
                return `Amount exceeds total available balance (${maxWithdrawable.toFixed(2)}) SAR`;
              return true;
            },
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
