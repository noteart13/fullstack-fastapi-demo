"use client";

import { useAppSelector } from "../../lib/hooks";
import { loggedIn } from "../../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Chặn truy cập nếu chưa đăng nhập, redirect về /login
 */
export default function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push(redirectTo);
    }
  }, [isLoggedIn, router, redirectTo]);

  if (!isLoggedIn) {
    return null; // Hoặc loading spinner
  }

  return <>{children}</>;
}

