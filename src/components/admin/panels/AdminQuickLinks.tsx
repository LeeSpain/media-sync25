import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/admin/content-ai", label: "Content AI" },
  { to: "/admin/sales-ai", label: "Sales AI" },
  { to: "/admin/video", label: "Video" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminQuickLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick links</CardTitle>
        <CardDescription>Jump to any admin section</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {links.map((l) => (
            <Button key={l.to} asChild variant="secondary">
              <Link to={l.to}>{l.label}</Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
