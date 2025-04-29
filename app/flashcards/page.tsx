"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  Shuffle,
  Beaker,
  Brain,
  Calculator,
  RotateCcw,
  Award,
} from "lucide-react";
import { Subject } from "@prisma/client";

type SubjectType = keyof typeof Subject;

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  subject: SubjectType;
  createdAt: string;
  updatedAt: string;
};

// Available subjects (matches your Prisma schema)
const subjects: SubjectType[] = ["PHYSICS", "CHEMISTRY", "MATHEMATICS"];

export default function FlashcardsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<{
    [key in SubjectType]?: number;
  }>({});

  const [selectedSubject, setSelectedSubject] = useState<SubjectType | null>(
    null
  );
  const [currentFlashcards, setCurrentFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [remainingCards, setRemainingCards] = useState<Flashcard[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<Flashcard[]>([]);
  const [showScore, setShowScore] = useState(false);
  const [animation, setAnimation] = useState("");
  const [reviewMode, setReviewMode] = useState(false);

  // Fetch available subjects and their card counts on initial load
  useEffect(() => {
    const fetchSubjectsCount = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/flashcards");

        if (!response.ok) {
          throw new Error("Failed to fetch flashcards");
        }

        const data: Flashcard[] = await response.json();

        // Count flashcards per subject
        const counts: { [key in SubjectType]?: number } = {};
        subjects.forEach((subject) => {
          counts[subject] = data.filter(
            (card) => card.subject === subject
          ).length;
        });

        setAvailableSubjects(counts);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjectsCount();
  }, []);

  // Fetch flashcards when a subject is selected
  useEffect(() => {
    if (selectedSubject) {
      const fetchFlashcards = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetch(
            `/api/flashcards/subject/${selectedSubject}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch flashcards");
          }

          const data: Flashcard[] = await response.json();

          if (data.length === 0) {
            setError(
              `No flashcards found for ${selectedSubject.toLowerCase()}`
            );
            return;
          }

          // Shuffle the cards
          const shuffledCards = [...data].sort(() => Math.random() - 0.5);

          setCurrentFlashcards(shuffledCards);
          setRemainingCards(shuffledCards);
          setCurrentIndex(0);
          setIsFlipped(false);
          setCorrectCount(0);
          setIncorrectCount(0);
          setWrongAnswers([]);
          setShowScore(false);
          setReviewMode(false);
        } catch (err) {
          console.error("Error fetching flashcards:", err);
          setError("Failed to load flashcards. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchFlashcards();
    }
  }, [selectedSubject]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkCorrect = () => {
    if (remainingCards.length > 0) {
      setCorrectCount((prev) => prev + 1);
      const newRemaining = remainingCards.filter(
        (_, idx) => idx !== currentIndex
      );
      setRemainingCards(newRemaining);

      if (newRemaining.length > 0) {
        setCurrentIndex(currentIndex >= newRemaining.length ? 0 : currentIndex);
        triggerAnimation("slide-left");
      } else {
        // All cards completed
        if (wrongAnswers.length > 0) {
          setShowScore(true);
        } else {
          setRemainingCards(currentFlashcards);
          setCurrentIndex(0);
          setShowScore(true);
        }
      }
      setIsFlipped(false);
    }
  };

  const handleMarkIncorrect = () => {
    if (remainingCards.length > 0) {
      setIncorrectCount((prev) => prev + 1);
      // Add to wrong answers for review later
      setWrongAnswers((prev) => [...prev, remainingCards[currentIndex]]);

      // Move to next card
      const newRemaining = remainingCards.filter(
        (_, idx) => idx !== currentIndex
      );
      setRemainingCards(newRemaining);

      if (newRemaining.length > 0) {
        setCurrentIndex(currentIndex >= newRemaining.length ? 0 : currentIndex);
        triggerAnimation("slide-left");
      } else {
        // All cards completed
        setShowScore(true);
      }
      setIsFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (remainingCards.length > 0) {
      const nextIndex = (currentIndex + 1) % remainingCards.length;
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      triggerAnimation("slide-left");
    }
  };

  const handleShuffle = () => {
    const shuffled = [...remainingCards].sort(() => Math.random() - 0.5);
    setRemainingCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    triggerAnimation("shuffle");
  };

  const resetCards = () => {
    setSelectedSubject(null);
    setCurrentFlashcards([]);
    setRemainingCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setWrongAnswers([]);
    setShowScore(false);
    setReviewMode(false);
    setError(null);
  };

  const startReviewWrongAnswers = () => {
    if (wrongAnswers.length > 0) {
      setRemainingCards([...wrongAnswers]);
      setWrongAnswers([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowScore(false);
      setReviewMode(true);
      triggerAnimation("slide-right");
    }
  };

  const continueWithSameSubject = () => {
    if (selectedSubject) {
      // Refetch and shuffle the cards
      const fetchFlashcards = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetch(
            `/api/flashcards/subject/${selectedSubject}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch flashcards");
          }

          const data: Flashcard[] = await response.json();

          if (data.length === 0) {
            setError(
              `No flashcards found for ${selectedSubject.toLowerCase()}`
            );
            return;
          }

          // Shuffle the cards
          const shuffledCards = [...data].sort(() => Math.random() - 0.5);

          setCurrentFlashcards(shuffledCards);
          setRemainingCards(shuffledCards);
          setCurrentIndex(0);
          setIsFlipped(false);
          setCorrectCount(0);
          setIncorrectCount(0);
          setWrongAnswers([]);
          setShowScore(false);
          setReviewMode(false);
          triggerAnimation("slide-right");
        } catch (err) {
          console.error("Error fetching flashcards:", err);
          setError("Failed to load flashcards. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchFlashcards();
    }
  };

  const triggerAnimation = (animationType) => {
    setAnimation(animationType);
    setTimeout(() => setAnimation(""), 500); // Reset animation after it completes
  };

  const getSubjectIcon = (subject: SubjectType) => {
    switch (subject) {
      case "PHYSICS":
        return <Brain className="h-5 w-5" />;
      case "CHEMISTRY":
        return <Beaker className="h-5 w-5" />;
      case "MATHEMATICS":
        return <Calculator className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const calculateScore = () => {
    const total = correctCount + incorrectCount;
    if (total === 0) return 0;
    return Math.round((correctCount / total) * 100);
  };

  // Loading state

  if (isLoading && !selectedSubject) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading subjects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !selectedSubject) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Subject Selection View
  if (!selectedSubject) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4 p-6 sm:p-0">
        <h1 className="text-xl sm:text-3xl font-bold text-center mb-6">
          Select a Subject for Flashcards
        </h1>
        <div className="grid gap-4">
          {subjects.map((subject) => (
            <div
              key={subject}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-3"
              onClick={() => setSelectedSubject(subject)}
            >
              <div className="p-2 rounded-full">{getSubjectIcon(subject)}</div>
              <div>
                <h3 className="font-medium text-base sm:text-lg">
                  {subject.charAt(0) + subject.slice(1).toLowerCase()}{" "}
                  Flashcards
                </h3>
                <p className="text-sm text-gray-500">
                  {availableSubjects[subject] || 0} cards available
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Loading selected subject

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">
            Loading {selectedSubject.toLowerCase()} Flashcards...
          </p>
        </div>
      </div>
    );
  }

  // Error loading selected subject
  if (error && selectedSubject) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <h1 className="text-xl font-bold mb-4">{selectedSubject} Flashcards</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={continueWithSameSubject}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Try Again
          </button>
          <button
            onClick={resetCards}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-md"
          >
            Change Subject
          </button>
        </div>
      </div>
    );
  }

  // Score View
  if (showScore) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 p-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
          <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
          Session Complete!
        </h2>

        <div className="border p-4 sm:p-6 rounded-lg">
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">
            {calculateScore()}%
          </h3>
          <div className="flex justify-center gap-4 sm:gap-6 text-base sm:text-lg">
            <div>
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto mb-1" />
              <p className="font-medium">{correctCount} Correct</p>
            </div>
            <div>
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mx-auto mb-1" />
              <p className="font-medium">{incorrectCount} Incorrect</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center mt-4">
          {wrongAnswers.length > 0 && (
            <button
              onClick={startReviewWrongAnswers}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
              Review Wrong Answers ({wrongAnswers.length})
            </button>
          )}
          <button
            onClick={continueWithSameSubject}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm sm:text-base"
          >
            Try Again with New Cards
          </button>
          <button
            onClick={resetCards}
            className="w-full border border-gray-300  hover:bg-gray-50 py-2 px-4 rounded-md text-sm sm:text-base"
          >
            Change Subject
          </button>
        </div>
      </div>
    );
  }

  // All Cards Completed View
  if (remainingCards.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 p-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          All Flashcards Completed!
        </h2>
        <div className="flex justify-center gap-4 text-base sm:text-lg">
          <div>
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto mb-1" />
            <p className="font-medium">{correctCount} Correct</p>
          </div>
          <div>
            <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mx-auto mb-1" />
            <p className="font-medium">{incorrectCount} Incorrect</p>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={continueWithSameSubject}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm sm:text-base"
          >
            Try Again
          </button>
          <button
            onClick={resetCards}
            className="px-4 py-2 border border-gray-300  hover:bg-gray-50 rounded-md text-sm sm:text-base"
          >
            New Subject
          </button>
        </div>
      </div>
    );
  }

  // Main Flashcard View
  const currentCard = remainingCards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          {getSubjectIcon(selectedSubject)}
          <span className="truncate">{selectedSubject}</span> Flashcards
          {reviewMode && (
            <span className="text-orange-500 text-xs sm:text-sm">(Review)</span>
          )}
        </h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">{correctCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm">{incorrectCount}</span>
          </div>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-gray-500 flex justify-between">
        <span>
          Card {currentIndex + 1} of {remainingCards.length}
        </span>
        <span>
          {correctCount + incorrectCount} / {currentFlashcards.length} completed
        </span>
      </div>

      <div className="flashcard-container w-full h-64 sm:h-80 perspective-1000">
        <div
          className={`flashcard w-full h-full cursor-pointer border rounded-lg shadow-md transform-gpu transition-all duration-500 ${
            isFlipped ? "rotate-y-180" : ""
          } ${animation === "slide-left" ? "animate-slide-left" : ""} 
          ${animation === "slide-right" ? "animate-slide-right" : ""} 
          ${animation === "shuffle" ? "animate-shuffle" : ""}`}
          onClick={handleFlip}
        >
          <div className="flashcard-front absolute w-full h-full flex items-center justify-center p-4 sm:p-8 text-center backface-hidden  rounded-lg">
            <h3 className="text-base sm:text-xl font-medium">
              {currentCard.question}
            </h3>
          </div>
          <div className="flashcard-back absolute w-full h-full flex items-center justify-center p-4 sm:p-8 text-center backface-hidden rotate-y-180  rounded-lg">
            <p className="text-sm sm:text-lg">{currentCard.answer}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={handleMarkCorrect}
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="hidden xs:inline">Correct</span>
        </button>
        <button
          onClick={handleMarkIncorrect}
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm"
        >
          <XCircle className="h-4 w-4" />
          <span className="hidden xs:inline">Incorrect</span>
        </button>
        <button
          onClick={handleNextCard}
          className="flex items-center gap-1 border border-gray-300  hover:bg-gray-50 px-3 py-2 rounded-md text-sm"
        >
          <ArrowRightCircle className="h-4 w-4" />
          <span className="hidden xs:inline">Next</span>
        </button>
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1 border border-gray-300  hover:bg-gray-50 px-3 py-2 rounded-md text-sm"
        >
          <Shuffle className="h-4 w-4" />
          <span className="hidden xs:inline">Shuffle</span>
        </button>
      </div>

      <div className="text-center mt-2">
        <button
          onClick={resetCards}
          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
        >
          Change Subject
        </button>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-gpu {
          transform-style: preserve-3d;
          will-change: transform;
        }

        .backface-hidden {
          backface-visibility: hidden;
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        @keyframes slideLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          40% {
            transform: translateX(-20%);
            opacity: 0;
          }
          60% {
            transform: translateX(20%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          40% {
            transform: translateX(20%);
            opacity: 0;
          }
          60% {
            transform: translateX(-20%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shuffle {
          0% {
            transform: translateY(0) rotate(0);
            opacity: 1;
          }
          25% {
            transform: translateY(-10px) rotate(-5deg);
            opacity: 0.8;
          }
          50% {
            transform: translateY(0) rotate(5deg);
            opacity: 0.6;
          }
          75% {
            transform: translateY(10px) rotate(-2deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) rotate(0);
            opacity: 1;
          }
        }

        .animate-slide-left {
          animation: slideLeft 0.5s ease-in-out forwards;
        }

        .animate-slide-right {
          animation: slideRight 0.5s ease-in-out forwards;
        }

        .animate-shuffle {
          animation: shuffle 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
