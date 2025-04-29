// app/api/quizzes/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET specific quiz by id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: params.id,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

// DELETE quiz by id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.quiz.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
