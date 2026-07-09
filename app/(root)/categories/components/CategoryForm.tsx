"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createCategory, updateCategory } from "@/lib/actions/category.actions";
import { toast } from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
  type: "Income" | "Expense";
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryFormProps {
  category?: Category;
  onSuccess: () => void;
}

interface CategoryFormData {
  name: string;
  type: "Income" | "Expense";
  color: string;
  active: boolean;
}

export default function CategoryForm({
  category,
  onSuccess,
}: CategoryFormProps) {
  const form = useForm<CategoryFormData>({
    defaultValues: category
      ? {
          name: category.name,
          type: category.type,
          color: category.color,
          active: category.active,
        }
      : {
          name: "",
          type: "Income",
          color: "#3b82f6",
          active: true,
        },
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        await updateCategory(category._id, data);
      } else {
        await createCategory(data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving category:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save category";
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          rules={{ required: "Type is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input type="color" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {category ? "Update Category" : "Add Category"}
        </Button>
      </form>
    </Form>
  );
}
