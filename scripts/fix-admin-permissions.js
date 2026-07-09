const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gsen';

async function fixAdminPermissions() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const admins = db.collection('admins');
    
    const result = await admins.find({}).toArray();
    console.log(`Found ${result.length} admins`);
    
    for (const admin of result) {
      console.log(`\nChecking admin: ${admin.email}`);
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
      
      await admins.updateOne(
        { _id: admin._id },
        { $set: { permissions: fixedPermissions } }
      );
      
      console.log('Fixed permissions:', JSON.stringify(fixedPermissions, null, 2));
    }
    
    console.log('\n✅ All admin permissions fixed successfully');
  } catch (error) {
    console.error('Error fixing permissions:', error);
  } finally {
    await client.close();
  }
}

fixAdminPermissions();
