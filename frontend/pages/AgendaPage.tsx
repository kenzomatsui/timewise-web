import { useEffect, useState } from "react";
import { useBackend } from "../hooks/useBackend";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Loader2 } from "lucide-react";
import type { Task } from "~backend/task/types";

export default function AgendaPage() {
  const backend = useBackend();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    try {
      const data = await backend.task.list({});
      setTasks(data.tasks.filter((t: Task) => t.allocatedDate));
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [backend]);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const data = await backend.agenda.generate({ days: 7 });
      loadTasks();
      toast({
        title: "Success!",
        description: data.message || "Agenda generated successfully",
      });
    } catch (error) {
      console.error("Failed to generate agenda:", error);
      toast({
        title: "Error",
        description: "Failed to generate agenda",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.allocatedDate!;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groupedTasks).sort();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">Your smart schedule for the week</p>
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Generate Agenda
              </>
            )}
          </Button>
        </div>

        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agenda generated yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Click "Generate Agenda" to create your smart schedule
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle>{new Date(date).toLocaleDateString("en-US", { 
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupedTasks[date]
                    .sort((a, b) => (a.allocatedStartTime || "").localeCompare(b.allocatedStartTime || ""))
                    .map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-muted-foreground">{task.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {task.allocatedStartTime} - {task.allocatedEndTime}
                            </p>
                            <p className="text-xs text-muted-foreground">{task.estimatedTime} min</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
