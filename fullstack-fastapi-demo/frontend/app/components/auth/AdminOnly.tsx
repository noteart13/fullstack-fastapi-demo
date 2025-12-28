"use client";

import { useAppSelector } from "../../lib/hooks";
import { isAdmin } from "../../lib/slices/authSlice";

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Admin Only Component
 * Chỉ render children nếu user là admin (is_superuser && is_active)
 */
export default function AdminOnly({
  children,
  fallback = null,
}: AdminOnlyProps) {
  const isAdminUser = useAppSelector((state) => isAdmin(state));

  if (!isAdminUser) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

