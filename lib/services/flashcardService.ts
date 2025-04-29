// lib/services/flashcardService.ts
import { Subject } from "@prisma/client";

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  subject: Subject;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardInput = {
  question: string;
  answer: string;
  subject: Subject;
};

/**
 * Get all flashcards
 */
export async function getAllFlashcards(): Promise<Flashcard[]> {
  const response = await fetch("/api/flashcards");

  if (!response.ok) {
    throw new Error("Failed to fetch flashcards");
  }

  return response.json();
}

/**
 * Get flashcards by subject
 */
export async function getFlashcardsBySubject(
  subject: Subject
): Promise<Flashcard[]> {
  const response = await fetch(`/api/flashcards/subject/${subject}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${subject.toLowerCase()} flashcards`);
  }

  return response.json();
}

/**
 * Get a single flashcard by ID
 */
export async function getFlashcardById(id: string): Promise<Flashcard> {
  const response = await fetch(`/api/flashcards/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch flashcard");
  }

  return response.json();
}

/**
 * Create a new flashcard
 */
export async function createFlashcard(
  data: FlashcardInput
): Promise<Flashcard> {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create flashcard");
  }

  return response.json();
}

/**
 * Update an existing flashcard
 */
export async function updateFlashcard(
  id: string,
  data: FlashcardInput
): Promise<Flashcard> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update flashcard");
  }

  return response.json();
}

/**
 * Delete a flashcard by ID
 */
export async function deleteFlashcard(
  id: string
): Promise<{ message: string }> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete flashcard");
  }

  return response.json();
}

/**
 * Get flashcard counts by subject
 */
export async function getFlashcardCounts(): Promise<{
  [key in Subject]?: number;
}> {
  const flashcards = await getAllFlashcards();

  const counts: { [key in Subject]?: number } = {};

  // Count flashcards per subject
  Object.values(Subject).forEach((subject) => {
    counts[subject] = flashcards.filter(
      (card) => card.subject === subject
    ).length;
  });

  return counts;
}
