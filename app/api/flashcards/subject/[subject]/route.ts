// app/api/flashcards/subject/[subject]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Subject } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { subject: string } }
) {
  try {
    const subjectParam = params.subject.toUpperCase();

    // Validate subject is valid enum value
    if (!Object.values(Subject).includes(subjectParam as Subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }

    const flashcards = await prisma.flashcard.findMany({
      where: {
        subject: subjectParam as Subject,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("Error fetching flashcards by subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}
