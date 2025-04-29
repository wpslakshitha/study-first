// app/api/quizzes/subject/[subject]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Subject } from "@prisma/client";

const prisma = new PrismaClient();

// GET quizzes by subject
export async function GET(
  request: Request,
  { params }: { params: { subject: string } }
) {
  try {
    // Validate that the subject is a valid enum value
    const subjectUppercase = params.subject.toUpperCase();
    if (!Object.values(Subject).includes(subjectUppercase as Subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        subject: subjectUppercase as Subject,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}
