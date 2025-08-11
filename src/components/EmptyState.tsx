import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Action = {
  label: string;
  to: string;
  variant?: "default" | "secondary" | "outline";
};

interface EmptyStateProps {
  title: string;
  description: string;
  actions?: Action[];
}

export default function EmptyState({ title, description, actions = [] }: EmptyStateProps) {
  return (
    <section aria-label="empty state" className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {actions.length > 0 && (
          <CardContent className="flex flex-wrap gap-2">
            {actions.map((a, i) => (
              <Button key={`${a.label}-${i}`} asChild variant={a.variant ?? "default"}>
                <Link to={a.to}>{a.label}</Link>
              </Button>
            ))}
          </CardContent>
        )}
      </Card>
    </section>
  );
}
