import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { useI18n } from "@/i18n";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { name: "W1", impressions: 400, clicks: 24 },
  { name: "W2", impressions: 300, clicks: 13 },
  { name: "W3", impressions: 460, clicks: 30 },
  { name: "W4", impressions: 520, clicks: 39 },
];

const Dashboard = () => {
  const { t } = useI18n();
  return (
    <main className="container py-10 space-y-8">
      <SEO title={`${t("dashboard.title")} | ${t("app.name")}`} description="Your AI-powered workspace with strategy, calendar, CRM and performance." canonical={window.location.href} />
      <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.strategy")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Auto-generated 90-day plan will appear here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.calendar")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Weekly schedule of posts, emails, and messages.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.crm")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Leads, pipeline and AI scoring.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("dashboard.performance")}</CardTitle></CardHeader>
          <CardContent className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="impressions" stroke="hsl(var(--brand))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--brand-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Dashboard;
