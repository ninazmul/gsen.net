"use client";

import { useEffect, useState } from "react";
import { hasPermission } from "@/lib/permission-helpers";
import { type Admin } from "@/lib/actions/admin.actions";

export function useWritePermission(
  admin: Admin | null,
  page: keyof Admin["permissions"]["pages"],
) {
  const [hasWriteAccess, setHasWriteAccess] = useState(false);

  useEffect(() => {
    setHasWriteAccess(hasPermission(admin, page, "write"));
  }, [admin, page]);

  return hasWriteAccess;
}
