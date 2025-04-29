import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/time-entries/[id] - Update a time entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const data = await request.json();

    const timeEntry = await prisma.timeEntry.update({
      where: { id: params.taskId },
      data: {
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : null,
      },
    });

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/time-entries/[id] - Delete a time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    await prisma.timeEntry.delete({
      where: { id: params.taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
