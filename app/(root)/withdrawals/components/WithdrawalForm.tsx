"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  getOwnerSettlementWithdrawalInfo,
  type OwnerSettlementInfo,
} from "@/lib/actions/withdrawal.actions";
import { getSettings } from "@/lib/actions/settings.actions";
import { useEffect, useState } from "react";
import { type Admin } from "@/lib/actions/admin.actions";
import { toast } from "react-hot-toast";
import { User, AlertCircle, Sparkles } from "lucide-react";

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

export default function WithdrawalForm({
  withdrawal,
  currentAdmin,
  onSuccess,
}: WithdrawalFormProps) {
  const [settlementInfo, setSettlementInfo] = useState<OwnerSettlementInfo | null>(null);
  const [ownerName, setOwnerName] = useState<string>(withdrawal?.owner || "");
  const [isLoading, setIsLoading] = useState(true);

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

  // Resolve owner and fetch settlement withdrawal limit from dashboard calculation
  useEffect(() => {
    async function loadOwnerAndSettlement() {
      setIsLoading(true);
      try {
        let resolvedOwner = withdrawal?.owner || "";
        if (!resolvedOwner && currentAdmin?.email) {
          const settings = await getSettings();
          const owners = (settings?.owners || []) as { name: string; email: string }[];
          const match = owners.find(
            (o) =>
              o.email &&
              o.email.trim().toLowerCase() ===
                currentAdmin.email.trim().toLowerCase(),
          );
          if (match) {
            resolvedOwner = match.name;
          }
        }

        setOwnerName(resolvedOwner);
        form.setValue("owner", resolvedOwner);

        if (resolvedOwner) {
          const info = await getOwnerSettlementWithdrawalInfo(resolvedOwner);
          setSettlementInfo(info);
        }
      } catch (error) {
        console.error("Error loading settlement info:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadOwnerAndSettlement();
  }, [withdrawal, currentAdmin, form]);

  const baseSettlement = settlementInfo?.availableSettlement ?? 0;
  const baseMax = settlementInfo?.maxWithdrawable ?? 0;

  // If editing an existing withdrawal, add its original amount back to allowable limit
  const maxWithdrawable = withdrawal
    ? baseMax + withdrawal.amount
    : baseMax;
  const availableSettlement = withdrawal
    ? baseSettlement + withdrawal.amount
    : baseSettlement;

  const onSubmit = async (data: WithdrawalFormData) => {
    try {
      if (!ownerName) {
        toast.error("You are not identified as a registered business owner.");
        return;
      }

      if (withdrawal) {
        await updateWithdrawal(withdrawal._id, {
          amount: data.amount,
          date: new Date(data.date),
          description: data.description || undefined,
        });
      } else {
        await createWithdrawal({
          owner: ownerName,
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
        {/* Hidden owner input - locked to the authenticated owner */}
        <input type="hidden" {...form.register("owner", { required: "Owner is required" })} />

        {/* Owner Card - Displays ONLY the withdrawing owner's name and their calculated settlement limit */}
        <div className="rounded-xl border border-purple-200/70 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/70 to-white dark:from-purple-950/20 dark:to-zinc-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3e0078] to-[#7c3aed] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Withdrawing Partner
                </p>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase truncate">
                  {ownerName || (isLoading ? "Loading..." : "Unknown Owner")}
                </p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-bold uppercase text-[10px] tracking-wider">
              {withdrawal ? "Edit Mode" : "Personal Only"}
            </Badge>
          </div>

          <div className="pt-2.5 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Available Settlement Limit:
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Calculated from dashboard net profit & expenses
              </p>
            </div>
            <span
              className={`text-base sm:text-lg font-black tabular-nums ${
                availableSettlement > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {availableSettlement.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-semibold text-slate-400">SAR</span>
            </span>
          </div>

          {!isLoading && availableSettlement <= 0 && !withdrawal && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                You have reached your maximum profit share withdrawal limit. No settlement funds available to withdraw.
              </span>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="amount"
          rules={{
            required: "Amount is required",
            validate: (value) => {
              if (value <= 0) return "Amount must be greater than 0";
              if (value > maxWithdrawable) {
                return `Amount exceeds available settlement limit (${maxWithdrawable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR)`;
              }
              return true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Amount (SAR)</FormLabel>
                {maxWithdrawable > 0 && (
                  <button
                    type="button"
                    onClick={() => form.setValue("amount", parseFloat(maxWithdrawable.toFixed(2)), { shouldValidate: true })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Withdraw Max ({maxWithdrawable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR)
                  </button>
                )}
              </div>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                <Textarea placeholder="Withdrawal description or notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full font-bold"
          disabled={isLoading || (!withdrawal && maxWithdrawable <= 0) || !ownerName}
        >
          {withdrawal ? "Update Withdrawal" : "Add Withdrawal"}
        </Button>
      </form>
    </Form>
  );
}
