"use server";

import { connectToDatabase } from "@/lib/database";
import Admin from "@/lib/database/models/admin.model";

export async function fixAllAdminPermissions() {
  await connectToDatabase();
  
  const admins = await Admin.find({});
  console.log(`Found ${admins.length} admins`);
  
  for (const admin of admins) {
    console.log(`Checking admin: ${admin.email}`);
    console.log('Current permissions:', JSON.stringify(admin.permissions, null, 2));
    
    // Fix permissions structure
    const fixedPermissions = {
      pages: {
        dashboard: admin.permissions?.pages?.dashboard ?? true,
        income: {
          read: admin.permissions?.pages?.income?.read ?? true,
          write: admin.permissions?.pages?.income?.write ?? true,
        },
        expenses: {
          read: admin.permissions?.pages?.expenses?.read ?? true,
          write: admin.permissions?.pages?.expenses?.write ?? true,
        },
        categories: {
          read: admin.permissions?.pages?.categories?.read ?? true,
          write: admin.permissions?.pages?.categories?.write ?? true,
        },
        withdrawals: {
          read: admin.permissions?.pages?.withdrawals?.read ?? true,
          write: admin.permissions?.pages?.withdrawals?.write ?? true,
        },
        reports: admin.permissions?.pages?.reports ?? true,
        activityLogs: admin.permissions?.pages?.activityLogs ?? true,
        admins: admin.permissions?.pages?.admins ?? false,
        settings: admin.permissions?.pages?.settings ?? false,
      }
    };
    
    await Admin.findByIdAndUpdate(
      admin._id,
      { $set: { permissions: fixedPermissions } }
    );
    
    console.log('Fixed permissions:', JSON.stringify(fixedPermissions, null, 2));
  }
  
  return { success: true, message: 'All admin permissions fixed successfully' };
}
