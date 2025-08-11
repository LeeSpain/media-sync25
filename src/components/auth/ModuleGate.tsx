import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModuleFlags } from "@/hooks/useModuleFlags";
import { Link } from "react-router-dom";

export default function ModuleGate({ module, children }: { module: string; children: ReactNode }) {
  const { flags, isLoading } = useModuleFlags();
  const enabled = !!flags[module]?.enabled;

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading module…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Module disabled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">This section is disabled by your workspace admin.</p>
            <div>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">Go to Overview</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
