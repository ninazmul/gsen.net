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
import { createExpense, updateExpense } from "@/lib/actions/expense.actions";
import { useEffect, useState } from "react";
import { getCategories } from "@/lib/actions/category.actions";
import { toast } from "react-hot-toast";

// Define types
interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
  active: boolean;
}

interface Expense {
  _id: string;
  title: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  deletedAt?: Date;
}

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess: () => void;
}

interface ExpenseFormData {
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNumber: string;
  description: string;
}

export default function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories({ type: "Expense", active: true });
      setCategories(cats);
    }
    loadCategories();
  }, []);

  const form = useForm<ExpenseFormData>({
    defaultValues: expense
      ? {
          title: expense.title,
          category:
            typeof expense.category === "object"
              ? expense.category._id
              : expense.category,
          amount: expense.amount,
          date: new Date(expense.date).toISOString().split("T")[0],
          paymentMethod: expense.paymentMethod,
          referenceNumber: expense.referenceNumber ?? "",
          description: expense.description ?? "",
        }
      : {
          title: "",
          category: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          paymentMethod: "",
          referenceNumber: "",
          description: "",
        },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      if (expense) {
        await updateExpense(expense._id, {
          title: data.title,
          category: data.category,
          amount: data.amount,
          date: new Date(data.date),
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || undefined,
          description: data.description || undefined,
        });
      } else {
        await createExpense({
          title: data.title,
          category: data.category,
          amount: data.amount,
          date: new Date(data.date),
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || undefined,
          description: data.description || undefined,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving expense:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save expense";
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          rules={{ required: "Title is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Expense title" {...field} />
              </FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          rules={{ required: "Amount is required" }}
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
          name="paymentMethod"
          rules={{ required: "Payment method is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Expense description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {expense ? "Update Expense" : "Add Expense"}
        </Button>
      </form>
    </Form>
  );
}
