// AdminRoute.tsx - Protected route wrapper for admin pages
// Redirects unauthenticated users to admin login page.
// Shows a loading spinner while checking auth state.

import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAdminAuth();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                    <p className="text-zinc-400 text-sm">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // Redirect to sign-in page if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
