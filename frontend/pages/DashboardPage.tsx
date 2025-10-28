import { useEffect, useState } from "react";
import { useBackend } from "../hooks/useBackend";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import type { Alert as AlertType } from "~backend/alert/types";

export default function DashboardPage() {
  const backend = useBackend();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [stats, setStats] = useState({
    completedTasks: 0,
    pendingTasks: 0,
    overallProductivity: 0,
  });

  useEffect(() => {
    backend.alert.get()
      .then((data) => setAlerts(data.alerts))
      .catch(console.error);

    backend.report.get()
      .then((data) => setStats(data.stats))
      .catch(console.error);
  }, [backend]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return <Clock className="h-4 w-4" />;
      case "procrastination":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallProductivity.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Alerts & Notifications</h2>
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <p className="text-muted-foreground">No alerts at the moment. Keep up the good work!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <Alert
                  key={index}
                  variant={alert.severity === "critical" ? "destructive" : "default"}
                >
                  {getAlertIcon(alert.type)}
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
