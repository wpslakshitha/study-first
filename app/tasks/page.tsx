"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  Clock,
  Play,
  Square,
  Trash2,
  Plus,
  BarChart,
  Hourglass,
  X,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInSeconds } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
type Task = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  completed: boolean;
  timeEntries: TimeEntry[];
  createdAt: Date;
  updatedAt: Date;
};

type TimeEntry = {
  id: string;
  startTime: Date;
  endTime: Date | null;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Available subjects for tasks
const SUBJECTS = ["PHYSICS", "CHEMISTRY", "MATHEMATICS"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    subject: "Physics", // Default to first subject
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();

      const tasksWithDates = data.map(
        (task: {
          createdAt: string | number | Date;
          updatedAt: string | number | Date;
          timeEntries: TimeEntry[]; // Fix explicit any type
        }) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          timeEntries: task.timeEntries.map((entry) => ({
            ...entry,
            startTime: new Date(entry.startTime),
            endTime: entry.endTime ? new Date(entry.endTime) : null,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          })),
        })
      );
      setTasks(tasksWithDates);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const createTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Task title required",
        description: "Please enter a title for your task.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || null,
          subject: newTask.subject,
        }),
      });

      if (!response.ok) {
        console.log("Response status:", response.status);

        throw new Error("Failed to create task");
      }

      const task = await response.json();

      // Add created dates to the task object
      const taskWithDates = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        timeEntries: [],
      };

      setIsCreating(false);
      setTasks((prev) => [taskWithDates, ...prev]);
      setNewTask({ title: "", description: "", subject: "PHYSICS" });
      setIsAddDialogOpen(false);

      toast({
        title: "Task added",
        description: "Your new task has been created.",
      });
    } catch (error) {
      setIsCreating(false);
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, completed: boolean) => {
    try {
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: taskToUpdate.title,
          description: taskToUpdate.description,
          subject: taskToUpdate.subject,
          completed: completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, completed: completed, updatedAt: new Date() };
        }
        return task;
      });

      setTasks(updatedTasks);

      toast({
        title: completed ? "Task completed" : "Task marked incomplete",
        description: taskToUpdate.title,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    // If this is the active task, stop the timer first
    if (activeTask && activeTask.id === taskId) {
      handleStopTimer();
    }

    const taskToDelete = tasks.find((t) => t.id === taskId);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks(tasks.filter((task) => task.id !== taskId));

      toast({
        title: "Task deleted",
        description: taskToDelete?.title,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createTimeEntry = async (taskId: string, startTime: Date) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/time-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create time entry");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating time entry:", error);
      toast({
        title: "Error",
        description: "Failed to start timer. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTimeEntry = async (entryId: string, endTime: Date) => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endTime: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update time entry");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating time entry:", error);
      toast({
        title: "Error",
        description: "Failed to stop timer. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTimeEntry = async (taskId: string, entryId: string) => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete time entry");
      }

      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            timeEntries: task.timeEntries.filter(
              (entry) => entry.id !== entryId
            ),
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      toast({
        title: "Time entry deleted",
        description: "The time entry has been removed.",
      });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleDeleteTimeEntry = (taskId: string, entryId: string) => {
    deleteTimeEntry(taskId, entryId);
  };

  useEffect(() => {
    fetchTasks();
    if (window.innerWidth >= 1024) {
      setShowAnalytics(true);
    }
  }, [fetchTasks]);

  // Timer logic
  useEffect(() => {
    if (timer !== null) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer]);

  const handleAddTask = () => {
    createTask();
  };

  const handleStartTimer = async (task: Task) => {
    if (activeTask) {
      handleStopTimer();
    }

    const now = new Date();
    const newTimeEntry = await createTimeEntry(task.id, now);

    if (!newTimeEntry) return;

    const timeEntry: TimeEntry = {
      ...newTimeEntry,
      startTime: new Date(newTimeEntry.startTime),
      endTime: null,
      createdAt: new Date(newTimeEntry.createdAt),
      updatedAt: new Date(newTimeEntry.updatedAt),
    };

    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          timeEntries: [...t.timeEntries, timeEntry],
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    setActiveTask(task);
    setTimer(Date.now());
    setElapsedTime(0);

    toast({
      title: "Timer started",
      description: `Now tracking time for: ${task.title}`,
    });
  };

  const handleStopTimer = async () => {
    if (!activeTask) return;

    const now = new Date();
    const activeTaskData = tasks.find((t) => t.id === activeTask.id);

    if (!activeTaskData) return;

    const lastTimeEntry =
      activeTaskData.timeEntries[activeTaskData.timeEntries.length - 1];

    if (!lastTimeEntry || lastTimeEntry.endTime !== null) return;

    const updatedEntry = await updateTimeEntry(lastTimeEntry.id, now);

    if (!updatedEntry) return;

    const updatedTasks = tasks.map((task) => {
      if (task.id === activeTask.id) {
        const updatedEntries = task.timeEntries.map((entry, index) => {
          if (index === task.timeEntries.length - 1 && entry.endTime === null) {
            return {
              ...entry,
              endTime: new Date(updatedEntry.endTime),
              updatedAt: new Date(updatedEntry.updatedAt),
            };
          }
          return entry;
        });

        return { ...task, timeEntries: updatedEntries, updatedAt: new Date() };
      }
      return task;
    });

    setTasks(updatedTasks);
    setActiveTask(null);
    setTimer(null);

    toast({
      title: "Timer stopped",
      description: `Time tracked: ${formatTime(elapsedTime)}`,
    });
  };

  const handleToggleComplete = (taskId: string) => {
    // If this is the active task, stop the timer first
    if (activeTask && activeTask.id === taskId) {
      handleStopTimer();
    }

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      updateTaskStatus(taskId, !task.completed);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  const getTotalTimeForTask = (task: Task): number => {
    return task.timeEntries.reduce((total, entry) => {
      if (!entry.endTime) return total;
      return total + differenceInSeconds(entry.endTime, entry.startTime);
    }, 0);
  };

  const getTotalTaskTime = (): number => {
    return tasks.reduce((total, task) => {
      return total + getTotalTimeForTask(task);
    }, 0);
  };

  const getCompletedTasksCount = (): number => {
    return tasks.filter((task) => task.completed).length;
  };

  // Create data for charts
  const getPieChartData = () => {
    const taskTimeData = tasks
      .map((task) => ({
        name: task.title,
        value: getTotalTimeForTask(task),
      }))
      .filter((item) => item.value > 0);

    return taskTimeData.length ? taskTimeData : [{ name: "No data", value: 1 }];
  };

  const getBarChartData = () => {
    // Last 7 days time tracking
    const days = 7;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // Calculate time spent on this day
      let timeSpent = 0;
      tasks.forEach((task) => {
        task.timeEntries.forEach((entry) => {
          if (!entry.endTime) return;

          const entryStart = new Date(entry.startTime);
          const entryEnd = new Date(entry.endTime);

          // If entry overlaps with this day
          if (entryStart < nextDay && entryEnd >= date) {
            const effectiveStart = entryStart < date ? date : entryStart;
            const effectiveEnd = entryEnd > nextDay ? nextDay : entryEnd;
            timeSpent += differenceInSeconds(effectiveEnd, effectiveStart);
          }
        });
      });

      data.push({
        day: format(date, "E"), // Day name (Mon, Tue, etc.)
        hours: Math.round(timeSpent / 36) / 100, // Convert seconds to hours with 2 decimal places
      });
    }

    return data;
  };

  const getSubjectBreakdownData = () => {
    // Group time by subject
    const subjectTime: Record<string, number> = {};

    tasks.forEach((task) => {
      const taskTime = getTotalTimeForTask(task);
      if (taskTime > 0) {
        if (!subjectTime[task.subject]) {
          subjectTime[task.subject] = 0;
        }
        subjectTime[task.subject] += taskTime;
      }
    });

    return Object.keys(subjectTime).map((subject) => ({
      name: subject,
      value: subjectTime[subject],
    }));
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A44CD3",
    "#8884d8",
    "#83a6ed",
    "#8dd1e1",
    "#82ca9d",
    "#ffc658",
  ];

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return !task.completed;
    if (activeTab === "completed") return task.completed;
    return true;
  });

  const toggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Task Tracker</h1>
        <div className="flex gap-2">
          <Button
            onClick={toggleAnalytics}
            variant="outline"
            className="block lg:hidden"
          >
            <BarChart className="h-4 w-4" />
            <span className="sr-only">Toggle Analytics</span>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2 hidden sm:inline" />
                <span>Add Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to track your study progress.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (optional)
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Select
                    value={newTask.subject}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, subject: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTask} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Timer */}
          {activeTask && (
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="text-base sm:text-lg">
                    Currently Working On
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        handleStopTimer();
                        handleToggleComplete(activeTask.id);
                      }}
                      className="gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Complete</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleStopTimer}
                      className="gap-1"
                    >
                      <Square className="h-4 w-4" />
                      <span className="hidden sm:inline">Stop</span>
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 text-sm">
                  {activeTask.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <h3 className="text-3xl sm:text-4xl font-mono font-bold">
                    {formatTime(elapsedTime)}
                  </h3>
                  <p className="text-xs sm:text-sm mt-2">
                    Started{" "}
                    {formatDistanceToNow(
                      new Date(Date.now() - elapsedTime * 1000)
                    )}{" "}
                    ago
                  </p>
                  <Badge className="mt-2 bg-primary-foreground text-primary">
                    {activeTask.subject}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task List */}
          <div>
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    All Tasks
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-xs sm:text-sm">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs sm:text-sm">
                    Completed
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0 space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Hourglass className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No tasks found</p>
                    {activeTab !== "all" && (
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => setActiveTab("all")}
                      >
                        View all tasks
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={task.completed ? "opacity-75" : ""}
                    >
                      <CardHeader className="pb-2 px-4 sm:px-6">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={task.completed ? "secondary" : "ghost"}
                              size="icon"
                              className={`${
                                task.completed
                                  ? "bg-green-100 hover:bg-green-200 text-green-600"
                                  : "text-muted-foreground"
                              } h-8 w-8`}
                              onClick={() => handleToggleComplete(task.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Complete</span>
                            </Button>
                            <span
                              className={`${
                                task.completed ? "line-through" : ""
                              } text-sm sm:text-base`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {!task.completed && !activeTask && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleStartTimer(task)}
                              >
                                <Play className="h-4 w-4" />
                                <span className="sr-only">Start</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </CardTitle>
                        {task.description && (
                          <CardDescription className="text-xs sm:text-sm">
                            {task.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <div className="mt-3">
                        {/* Collapsible Time Log Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs flex items-center justify-center gap-1 border-t pt-2"
                          onClick={() =>
                            setExpandedTaskId(
                              expandedTaskId === task.id ? null : task.id
                            )
                          }
                        >
                          <Clock className="h-3 w-3" />
                          {expandedTaskId === task.id
                            ? "Hide Time Log"
                            : "Show Time Log"}
                        </Button>

                        {/* Expanded Time Log Section */}
                        {expandedTaskId === task.id && (
                          <div className="mt-3 space-y-3 bg-muted/30 p-3 rounded-md text-xs">
                            <h4 className="font-medium">Time Sessions</h4>

                            {task.timeEntries.length === 0 ? (
                              <p className="text-muted-foreground italic">
                                No time entries recorded
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {task.timeEntries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between bg-background p-2 rounded-sm"
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {format(
                                          new Date(entry.startTime),
                                          "MMM d, h:mm a"
                                        )}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {entry.endTime
                                          ? `Duration: ${formatTime(
                                              differenceInSeconds(
                                                new Date(entry.endTime),
                                                new Date(entry.startTime)
                                              )
                                            )}`
                                          : "In progress..."}
                                      </p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTimeEntry(
                                            task.id,
                                            entry.id
                                          );
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        <span className="sr-only">Delete</span>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Analytics Section */}
        <div
          className={`space-y-6 lg:block ${showAnalytics ? "block" : "hidden"}`}
        >
          <div className="flex justify-between items-center lg:hidden">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <Button variant="ghost" size="sm" onClick={toggleAnalytics}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart className="h-5 w-5 text-primary" />
                Study Analytics
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Track your progress and time spent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <h4 className="text-xl sm:text-2xl font-bold">
                    {tasks.length}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Tasks
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <h4 className="text-xl sm:text-2xl font-bold">
                    {getCompletedTasksCount()}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Completed
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium">
                  Completion Rate
                </h4>
                <Progress
                  value={
                    tasks.length
                      ? (getCompletedTasksCount() / tasks.length) * 100
                      : 0
                  }
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {tasks.length
                      ? Math.round(
                          (getCompletedTasksCount() / tasks.length) * 100
                        )
                      : 0}
                    %
                  </span>
                  <span>
                    {getCompletedTasksCount()}/{tasks.length} tasks
                  </span>
                </div>
              </div>

              <Separator />

              {/* Time Spent Breakdown by Subject */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium mb-4">
                  Time by Subject
                </h4>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({
                          name,
                          percent,
                        }: {
                          name: string;
                          percent: number;
                        }) =>
                          `${
                            name.length > 8
                              ? name.substring(0, 8) + "..."
                              : name
                          }: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getSubjectBreakdownData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatTime(value),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Separator />

              {/* Time Spent Breakdown by Task */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium mb-4">
                  Time by Task
                </h4>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({
                          name,
                          percent,
                        }: {
                          name: string;
                          percent: number;
                        }) =>
                          `${
                            name.length > 8
                              ? name.substring(0, 8) + "..."
                              : name
                          }: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatTime(value),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Separator />
              {/* Weekly Activity */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium mb-4">
                  Weekly Activity
                </h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={getBarChartData()}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                      }}
                    >
                      {/* <Cartesian strokeDasharray="3 3" /> */}
                      <XAxis dataKey="day" />
                      <YAxis
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: "0.7rem" },
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} hours`]}
                      />
                      <Bar
                        dataKey="hours"
                        fill="#8884d8"
                        name="Hours Spent"
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <Separator />

              {/* Total Time */}
              <div className="text-center py-2">
                <h4 className="text-xs sm:text-sm font-medium mb-1">
                  Total Time Tracked
                </h4>
                <p className="text-xl sm:text-2xl font-bold font-mono">
                  {formatTime(getTotalTaskTime())}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Study Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Pomodoro Technique</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Work for 25 minutes, then take a 5-minute break. After four
                  cycles, take a longer break of 15-30 minutes.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Active Recall</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Instead of re-reading notes, test yourself on what you&apos;ve
                  learned to strengthen memory recall.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Spaced Repetition</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Review Newton&apos;s laws and problem sets
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
