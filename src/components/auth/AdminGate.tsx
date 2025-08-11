import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">You don’t have permission to view this area.</p>
            <div className="flex gap-2">
              <Link to="/login"><Button variant="default" size="sm">Sign in</Button></Link>
              <Link to="/"><Button variant="outline" size="sm">Go home</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

