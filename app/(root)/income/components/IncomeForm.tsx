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
import { createIncome, updateIncome } from "@/lib/actions/income.actions";
import { useEffect, useState } from "react";
import { getCategories } from "@/lib/actions/category.actions";
import { getSettings } from "@/lib/actions/settings.actions";
import { type Admin } from "@/lib/actions/admin.actions";
import { toast } from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
  active: boolean;
}

interface Owner {
  name: string;
  email: string;
}

interface Income {
  _id: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
  deletedAt?: Date;
}

interface IncomeFormProps {
  income?: Income;
  currentAdmin?: Admin | null;
  defaultOwner?: string;
  onSuccess: () => void;
}

interface IncomeFormData {
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNumber: string;
  description: string;
  owner: string;
}

export default function IncomeForm({
  income,
  currentAdmin,
  defaultOwner,
  onSuccess,
}: IncomeFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);

  // Initialize form
  const form = useForm<IncomeFormData>({
    defaultValues: income
      ? {
          category:
            typeof income.category === "object"
              ? income.category._id
              : income.category,
          amount: income.amount,
          date: new Date(income.date).toISOString().split("T")[0],
          paymentMethod: income.paymentMethod,
          referenceNumber: income.referenceNumber ?? "",
          description: income.description ?? "",
          owner: income.owner ?? "",
        }
      : {
          category: "",
          amount: "" as unknown as number,
          date: new Date().toISOString().split("T")[0],
          paymentMethod: "Cash",
          referenceNumber: "",
          description: "",
          owner: defaultOwner ?? "",
        },
  });

  // Load categories and owners (like ExpenseForm)
  useEffect(() => {
    async function loadData() {
      const cats = await getCategories({ type: "Income", active: true });
      setCategories(cats);
      const settings = await getSettings();
      setOwners(settings?.owners || []);
    }
    loadData();
  }, []); // Match ExpenseForm's empty dependency array

  // Set default category for new income: try "Sales" first, otherwise first category
  useEffect(() => {
    if (!income && categories.length > 0) {
      const salesCat = categories.find(
        (c) => c.name.trim().toLowerCase() === "sales",
      );
      const defaultCat = salesCat || categories[0];
      if (defaultCat) {
        form.setValue("category", defaultCat._id);
      }
    }
  }, [income, categories, form]);

  // Pre-select owner based on logged in user's email matching owner email (like ExpenseForm)
  useEffect(() => {
    if (!income && defaultOwner) {
      form.setValue("owner", defaultOwner);
    }
  }, [defaultOwner, form, income]);

  useEffect(() => {
    if (!income && currentAdmin?.email && owners.length > 0) {
      const match = owners.find(
        (o) =>
          o.email &&
          o.email.trim().toLowerCase() ===
            currentAdmin.email.trim().toLowerCase(),
      );
      if (match && !form.getValues("owner")) {
        form.setValue("owner", match.name);
      }
    }
  }, [owners, currentAdmin, income, form]);

  const onSubmit = async (data: IncomeFormData) => {
    try {
      const payload = {
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        description: data.description || undefined,
        owner: data.owner && data.owner !== "none" ? data.owner : undefined,
      };

      if (income) {
        await updateIncome(income._id, payload);
      } else {
        await createIncome(payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving income:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save income";
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="max-h-[50vh] md:max-h-[60vh] overflow-y-auto space-y-4 pr-3 pb-4">
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

          <FormField
            control={form.control}
            name="category"
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            rules={{
              required: "Amount is required",
              min: { value: 0.01, message: "Amount must be greater than 0" },
              validate: (value) => !isNaN(value) || "Amount is required",
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter income amount"
                    {...field}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? "" : parseFloat(val));
                    }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paymentMethod"
              rules={{ required: "Payment method is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Mobile Banking">
                        Mobile Banking
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Reference number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Income description"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="pt-2 border-t">
          <Button type="submit" className="w-full">
            {income ? "Update Income" : "Add Income"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
