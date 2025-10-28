import { useEffect, useState } from "react";
import { useBackend } from "../hooks/useBackend";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import type { Task } from "~backend/task/types";

export default function TasksPage() {
  const backend = useBackend();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    priority: "medium",
    estimatedTime: "",
    deadline: "",
    description: "",
  });

  const loadTasks = async () => {
    try {
      const data = await backend.task.list({});
      setTasks(data.tasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [backend]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await backend.task.create({
        name: formData.name,
        category: formData.category,
        priority: formData.priority as any,
        estimatedTime: parseInt(formData.estimatedTime),
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        description: formData.description || undefined,
      });

      toast({ title: "Task created!", description: "Your task has been added" });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        category: "",
        priority: "medium",
        estimatedTime: "",
        deadline: "",
        description: "",
      });
      loadTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const handleMove = async (taskId: number, newStatus: string) => {
    try {
      await backend.task.update({ taskId, kanbanStatus: newStatus as any });

      loadTasks();
      toast({ title: "Task updated", description: "Status changed successfully" });
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await backend.task.deleteTask({ taskId });

      loadTasks();
      toast({ title: "Task deleted", description: "Task removed successfully" });
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const columns = [
    { id: "todo", title: "To Do", tasks: tasks.filter((t) => t.kanbanStatus === "todo") },
    { id: "in_progress", title: "In Progress", tasks: tasks.filter((t) => t.kanbanStatus === "in_progress") },
    { id: "completed", title: "Completed", tasks: tasks.filter((t) => t.kanbanStatus === "completed") },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">Manage your tasks with Kanban board</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (optional)</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((column) => (
            <Card key={column.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {column.title}
                  <span className="text-sm font-normal text-muted-foreground">
                    {column.tasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {column.tasks.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No tasks in this column
                  </p>
                ) : (
                  column.tasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{task.name}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{task.category}</p>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.priority === "high"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                            {task.estimatedTime}min
                          </span>
                        </div>
                        {column.id !== "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              handleMove(
                                task.id,
                                column.id === "todo" ? "in_progress" : "completed"
                              )
                            }
                          >
                            Move to {column.id === "todo" ? "In Progress" : "Completed"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
