"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import CategoryForm from "./CategoryForm";
import { getCategories, deleteCategory } from "@/lib/actions/category.actions";
import { useWritePermission } from "@/lib/hooks/useWritePermission";
import { type Admin } from "@/lib/actions/admin.actions";

interface Category {
  _id: string;
  name: string;
  type: "Income" | "Expense";
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function CategoriesClient({
  initialCategories,
  currentAdmin,
}: {
  initialCategories: Category[];
  currentAdmin: Admin | null;
}) {
  const hasWriteAccess = useWritePermission(currentAdmin, "categories");
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    const params: { type?: "Income" | "Expense" } = {};
    if (typeFilter && typeFilter !== "all") {
      params.type = typeFilter as "Income" | "Expense";
    }
    const newCategories = await getCategories(params);
    setCategories(
      newCategories.filter(
        (cat: Category) =>
          !search || cat.name.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [search, typeFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        toast.success("Category deleted successfully");
        loadCategories();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete category";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Categories</h1>
        {hasWriteAccess && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-[#0F0A19]">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <CategoryForm
                onSuccess={() => {
                  setIsAddOpen(false);
                  loadCategories();
                  toast.success("Category added successfully");
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category._id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      category.type === "Income" ? "default" : "destructive"
                    }
                  >
                    {category.type}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(category.createdAt)}</TableCell>
                <TableCell className="flex gap-2">
                  {hasWriteAccess && (
                    <Dialog
                      open={isEditOpen && editingCategory?._id === category._id}
                      onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setEditingCategory(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white dark:bg-[#0F0A19]">
                        <DialogHeader>
                          <DialogTitle>Edit Category</DialogTitle>
                        </DialogHeader>
                        <CategoryForm
                          category={editingCategory ?? undefined}
                          onSuccess={() => {
                            setIsEditOpen(false);
                            setEditingCategory(null);
                            loadCategories();
                            toast.success("Category updated successfully");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  {hasWriteAccess && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
