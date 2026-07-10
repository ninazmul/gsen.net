import { Schema, model, models } from "mongoose";

const ActivityLogSchema = new Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    adminEmail: { type: String, required: true },
    module: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    recordId: { type: Schema.Types.ObjectId },
    oldData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    browser: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance optimization on large data sets
ActivityLogSchema.index({ date: -1, createdAt: -1 });
ActivityLogSchema.index({ module: 1, action: 1 });

const ActivityLog = models.ActivityLog || model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
