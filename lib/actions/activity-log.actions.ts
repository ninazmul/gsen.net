"use server";

import { connectToDatabase } from "@/lib/database";
import ActivityLog from "@/lib/database/models/activity-log.model";
import { revalidatePath } from "next/cache";
import type { FilterQuery } from "mongoose";

interface ActivityLogDoc {
  _id: string;
  date: Date;
  adminEmail: string;
  module: string;
  action: string;
  description: string;
  recordId?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  browser?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function logActivity(data: {
  adminEmail: string;
  module: string;
  action: string;
  description: string;
  recordId?: unknown;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  browser?: string;
  userAgent?: string;
}) {
  await connectToDatabase();

  const log = await ActivityLog.create({
    ...data,
    date: new Date(),
  });

  revalidatePath("/activity-logs");
  return JSON.parse(JSON.stringify(log));
}

export async function getActivityLogs(params?: {
  module?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();

  const {
    module,
    action,
    startDate,
    endDate,
    search = "",
    page = 1,
    limit = 20,
  } = params || {};
  const skip = (page - 1) * limit;

  const query: FilterQuery<ActivityLogDoc> = {};

  if (module) query.module = module;
  if (action) query.action = action;
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  if (search) {
    query.$or = [
      { adminEmail: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { module: { $regex: search, $options: "i" } },
    ];
  }

  const logs = await ActivityLog.find<ActivityLogDoc>(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ActivityLog.countDocuments(query);

  return {
    logs: JSON.parse(JSON.stringify(logs)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRecentActivityLogs(limit: number = 10) {
  await connectToDatabase();

  const logs = await ActivityLog.find<ActivityLogDoc>()
    .sort({ date: -1, createdAt: -1 })
    .limit(limit);

  return JSON.parse(JSON.stringify(logs));
}
