"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, Edit } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getCurrentAdmin,
  type Admin,
  type AdminPermissions,
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

interface CreateAdminFormData {
  email: string;
  role: "admin" | "superadmin";
}

interface EditAdminFormData {
  role: "admin" | "superadmin";
  permissions: AdminPermissions;
}

export default function AdminsClient({
  initialAdmins,
}: {
  initialAdmins: Admin[];
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);

  const loadAdmins = useCallback(async () => {
    const newAdmins = await getAdmins();
    setAdmins(newAdmins);
  }, []);

  useEffect(() => {
    async function checkCurrentUser() {
      const current = await getCurrentAdmin();
      setCurrentUserIsSuperAdmin(current?.role === "superadmin");
    }
    checkCurrentUser();
  }, []);

  const handleCreate = async (data: CreateAdminFormData) => {
    try {
      await createAdmin(data.email, data.role);
      toast.success("Admin created successfully");
      setIsAddOpen(false);
      loadAdmins();
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error("Failed to create admin");
    }
  };

  const handleUpdate = async (id: string, data: Partial<EditAdminFormData>) => {
    try {
      await updateAdmin(id, data);
      toast.success("Admin updated successfully");
      setIsEditOpen(false);
      setEditingAdmin(null);
      loadAdmins();
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Failed to update admin");
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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Admins</h1>
        {currentUserIsSuperAdmin && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-purple-[#0F0A19]">
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
              </DialogHeader>
              <CreateAdminForm onSuccess={handleCreate} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin._id}>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      admin.role === "superadmin" ? "default" : "secondary"
                    }
                  >
                    {admin.role}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(admin.createdAt)}</TableCell>
                <TableCell className="flex gap-2">
                  {currentUserIsSuperAdmin && (
                    <>
                      <Dialog
                        open={isEditOpen && editingAdmin?._id === admin._id}
                        onOpenChange={(open) => {
                          setIsEditOpen(open);
                          if (!open) setEditingAdmin(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingAdmin(admin)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl bg-white dark:bg-purple-[#0F0A19]">
                          <DialogHeader>
                            <DialogTitle>Edit Admin</DialogTitle>
                          </DialogHeader>
                          <EditAdminForm
                            admin={admin}
                            onSuccess={(data) => handleUpdate(admin._id, data)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(admin._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
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

function CreateAdminForm({
  onSuccess,
}: {
  onSuccess: (data: CreateAdminFormData) => void;
}) {
  const form = useForm<CreateAdminFormData>({
    defaultValues: {
      role: "admin",
    },
  });

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
        <FormField
          control={form.control}
          name="role"
          rules={{ required: "Role is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
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

function EditAdminForm({
  admin,
  onSuccess,
}: {
  admin: Admin;
  onSuccess: (data: Partial<EditAdminFormData>) => void;
}) {
  const form = useForm<EditAdminFormData>({
    defaultValues: {
      role: admin.role,
      permissions: admin.permissions || {
        pages: {
          dashboard: true,
          income: { read: true, write: true },
          expenses: { read: true, write: true },
          categories: { read: true, write: true },
          withdrawals: { read: true, write: true },
          reports: true,
          activityLogs: true,
          admins: false,
          settings: false,
        },
      },
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSuccess)} className="space-y-6">
        <FormField
          control={form.control}
          name="role"
          rules={{ required: "Role is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Permissions</h3>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="permissions.pages.dashboard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Dashboard Access</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Income</h4>
                <FormField
                  control={form.control}
                  name="permissions.pages.income.read"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Read Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permissions.pages.income.write"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Write Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Expenses</h4>
                <FormField
                  control={form.control}
                  name="permissions.pages.expenses.read"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Read Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permissions.pages.expenses.write"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Write Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Categories</h4>
                <FormField
                  control={form.control}
                  name="permissions.pages.categories.read"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Read Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permissions.pages.categories.write"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Write Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Withdrawals</h4>
                <FormField
                  control={form.control}
                  name="permissions.pages.withdrawals.read"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Read Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permissions.pages.withdrawals.write"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Write Access</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="permissions.pages.reports"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Reports Access</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="permissions.pages.activityLogs"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Activity Logs Access</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="permissions.pages.admins"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Manage Admins Access</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="permissions.pages.settings"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Settings Access</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Update Admin
        </Button>
      </form>
    </Form>
  );
}
