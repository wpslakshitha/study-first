import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Subject } from "@prisma/client";

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        timeEntries: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.subject) {
      return NextResponse.json(
        { error: "Title and subject are required" },
        { status: 400 }
      );
    }

    // Validate subject enum
    if (!Object.values(Subject).includes(data.subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        subject: data.subject,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
