import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminGate({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useAdmin();

  if (loading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Checking admin access…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
