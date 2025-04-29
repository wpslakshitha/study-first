import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks/[taskId]/time-entries - Get all time entries for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const timeEntries = await prisma.timeEntry.findMany({
      where: { taskId: params.taskId },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[taskId]/time-entries - Create a new time entry
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.startTime) {
      return NextResponse.json(
        { error: "Start time is required" },
        { status: 400 }
      );
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        taskId: params.taskId,
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}
