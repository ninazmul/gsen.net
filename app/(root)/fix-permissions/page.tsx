import { fixAllAdminPermissions } from "@/lib/actions/fix-permissions.actions";
import { requireSuperAdmin } from "@/lib/actions/permission-actions";

export default async function FixPermissionsPage() {
  await requireSuperAdmin();

  const result = await fixAllAdminPermissions();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Fix Admin Permissions</h1>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">{result.message}</p>
        <p className="mt-2 text-sm text-green-600">
          All admin permissions have been reset to proper default values.
        </p>
        <a
          href="/admins"
          className="inline-block mt-4 text-blue-600 hover:underline"
        >
          Return to Admins page
        </a>
      </div>
    </div>
  );
}
