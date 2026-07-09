import { Schema, model, models } from "mongoose";

// Define permissions sub-schema
const PermissionsSchema = new Schema(
  {
    pages: {
      dashboard: { type: Boolean, default: true },
      income: {
        read: { type: Boolean, default: true },
        write: { type: Boolean, default: true },
      },
      expenses: {
        read: { type: Boolean, default: true },
        write: { type: Boolean, default: true },
      },
      categories: {
        read: { type: Boolean, default: true },
        write: { type: Boolean, default: true },
      },
      withdrawals: {
        read: { type: Boolean, default: true },
        write: { type: Boolean, default: true },
      },
      reports: { type: Boolean, default: true },
      activityLogs: { type: Boolean, default: true },
      admins: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
    },
  },
  { _id: false },
);

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },
    permissions: { type: PermissionsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

const Admin = models.Admin || model("Admin", AdminSchema);

export default Admin;
