"use client";

import { useState, useCallback } from "react";
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
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAdmins,
  createAdmin,
  deleteAdmin,
} from "@/lib/actions/admin.actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface Admin {
  _id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAdminFormData {
  email: string;
}

export default function AdminsClient({
  initialAdmins,
}: {
  initialAdmins: Admin[];
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const loadAdmins = useCallback(async () => {
    const newAdmins = await getAdmins();
    setAdmins(newAdmins);
  }, []);

  const handleCreate = async (data: CreateAdminFormData) => {
    try {
      await createAdmin(data.email);
      toast.success("Admin created successfully");
      setIsAddOpen(false);
      loadAdmins();
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error("Failed to create admin");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this admin?")) {
      try {
        await deleteAdmin(id);
        toast.success("Admin deleted successfully");
        loadAdmins();
      } catch (error) {
        console.error("Error deleting admin:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete admin",
        );
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admins</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
            </DialogHeader>
            <CreateAdminForm onSuccess={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin._id}>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{formatDate(admin.createdAt)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(admin._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CreateAdminForm({
  onSuccess,
}: {
  onSuccess: (data: CreateAdminFormData) => void;
}) {
  const form = useForm<CreateAdminFormData>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSuccess)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Admin
        </Button>
      </form>
    </Form>
  );
}
