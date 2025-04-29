// app/api/quizzes/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all quizzes grouped by subject
export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // Group by subject
    const quizzesBySubject = quizzes.reduce((acc, quiz) => {
      if (!acc[quiz.subject]) {
        acc[quiz.subject] = [];
      }
      acc[quiz.subject].push(quiz);
      return acc;
    }, {});

    return NextResponse.json(quizzesBySubject);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST to create a new quiz
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const quiz = await prisma.quiz.create({
      data: {
        subject: body.subject,
        questions: {
          create: body.questions.map((question) => ({
            content: question.content,
            points: question.points,
            options: {
              create: question.options.map((option) => ({
                content: option.content,
                isCorrect: option.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
