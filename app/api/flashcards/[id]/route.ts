// app/api/flashcards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Subject } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const flashcard = await prisma.flashcard.findUnique({
      where: { id },
    });

    if (!flashcard) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(flashcard);
  } catch (error) {
    console.error("Error fetching flashcard:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcard" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const { question, answer, subject } = body;

    // Validate required fields
    if (!question || !answer || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate subject is valid enum value
    if (!Object.values(Subject).includes(subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }

    // Check if flashcard exists
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: { id },
    });

    if (!existingFlashcard) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    // Update flashcard
    const updatedFlashcard = await prisma.flashcard.update({
      where: { id },
      data: {
        question,
        answer,
        subject,
      },
    });

    return NextResponse.json(updatedFlashcard);
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Check if flashcard exists
    const existingFlashcard = await prisma.flashcard.findUnique({
      where: { id },
    });

    if (!existingFlashcard) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    // Delete flashcard
    await prisma.flashcard.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Flashcard deleted successfully" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard" },
      { status: 500 }
    );
  }
}
