import { useEffect, useState } from "react";
import { useBackend } from "../hooks/useBackend";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface DailyProductivity {
  date: string;
  completedTasks: number;
  totalTasks: number;
  productivityPercent: number;
}

interface CategoryTime {
  category: string;
  totalMinutes: number;
}

export default function ReportsPage() {
  const backend = useBackend();
  const [last7Days, setLast7Days] = useState<DailyProductivity[]>([]);
  const [categoryTime, setCategoryTime] = useState<CategoryTime[]>([]);
  const [stats, setStats] = useState({
    completedTasks: 0,
    pendingTasks: 0,
    estimatedFreeTime: 0,
    overallProductivity: 0,
  });

  useEffect(() => {
    backend.report.get()
      .then((data) => {
        setLast7Days(data.last7Days);
        setCategoryTime(data.weekCategoryTime);
        setStats(data.stats);
      })
      .catch(console.error);
  }, [backend]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your productivity and time usage</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Free Time (min)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.estimatedFreeTime}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overallProductivity.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Last 7 Days Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {last7Days.map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${day.productivityPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-sm text-right">
                    {day.completedTasks}/{day.totalTasks} tasks
                  </div>
                  <div className="w-16 text-sm font-medium text-right">
                    {day.productivityPercent.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time by Category (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryTime.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No category data available yet
              </p>
            ) : (
              <div className="space-y-4">
                {categoryTime.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">{cat.category}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{
                            width: `${
                              (cat.totalMinutes /
                                Math.max(
                                  ...categoryTime.map((c) => c.totalMinutes),
                                  1
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-sm text-right">
                      {cat.totalMinutes} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
