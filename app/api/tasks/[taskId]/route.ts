import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TaskParams = {
  params: Promise<{
    taskId: string;
  }>;
};

// GET /api/tasks/[taskId] - Get a specific task
export async function GET(request: NextRequest, props: TaskParams) {
  const params = await props.params;
  const taskId = params.taskId;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { timeEntries: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[taskId] - Update a task
export async function PATCH(request: NextRequest, props: TaskParams) {
  const params = await props.params;
  const taskId = params.taskId;

  try {
    const data = await request.json();

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        subject: data.subject,
        completed: data.completed,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.log("🚀 ~ file: route.ts:105 ~ PATCH ~ data:", error);

    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId] - Delete a task
export async function DELETE(request: NextRequest, props: TaskParams) {
  const params = await props.params;
  const taskId = params.taskId;

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
