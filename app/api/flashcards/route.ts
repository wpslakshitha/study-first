// app/api/flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Subject } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject") as Subject | null;

    // Get flashcards, optionally filtered by subject
    const flashcards = await prisma.flashcard.findMany({
      where: subject ? { subject } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // Create new flashcard
    const flashcard = await prisma.flashcard.create({
      data: {
        question,
        answer,
        subject,
      },
    });

    return NextResponse.json(flashcard, { status: 201 });
  } catch (error) {
    console.error("Error creating flashcard:", error);
    return NextResponse.json(
      { error: "Failed to create flashcard" },
      { status: 500 }
    );
  }
}
