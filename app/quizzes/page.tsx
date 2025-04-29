"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Beaker, Brain, Calculator, Check, X } from "lucide-react";
import { Subject } from "@prisma/client";

// Types
type Option = {
  id: string;
  content: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  content: string;
  points: number;
  options: Option[];
};

type Quiz = {
  id: string;
  subject: Subject;
  questions: Question[];
};

export default function QuizzesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [quizzes, setQuizzes] = useState<Record<Subject, Quiz[]>>({});
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [viewingAnswers, setViewingAnswers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // Fetch all subjects and quizzes on component mount
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/quizzes");
        const data = await response.json();

        // Set available subjects
        setSubjects(Object.keys(data) as Subject[]);

        // Set quizzes by subject
        setQuizzes(data);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast({
          title: "Error",
          description: "Failed to load quizzes. Please try again later.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [toast]);

  useEffect(() => {
    if (selectedSubject && quizzes[selectedSubject]?.length > 0) {
      // Select a random quiz for the subject
      const selectedQuiz = {
        ...quizzes[selectedSubject][
          Math.floor(Math.random() * quizzes[selectedSubject].length)
        ],
      };

      // Shuffle questions for a random quiz
      selectedQuiz.questions = [...selectedQuiz.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5); // Get 5 random questions or all if less than 5

      setCurrentQuiz(selectedQuiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setQuizCompleted(false);
      setViewingAnswers(false);
    }
  }, [selectedSubject, quizzes]);

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleNextQuestion = () => {
    const currentQuestion = currentQuiz?.questions[currentQuestionIndex];

    if (!currentQuestion || !selectedAnswers[currentQuestion.id]) {
      toast({
        title: "Please select an answer",
        description:
          "You need to select an answer before moving to the next question.",
        variant: "destructive",
      });
      return;
    }

    // Check if answer is correct and add points
    const selectedOption = currentQuestion.options.find(
      (option) => option.id === selectedAnswers[currentQuestion.id]
    );

    if (selectedOption?.isCorrect) {
      setScore((prev) => prev + currentQuestion.points);
      toast({
        title: "Correct!",
        description: `+${currentQuestion.points} points`,
        variant: "default",
      });
    } else {
      toast({
        title: "Incorrect",
        description:
          "The correct answer was: " +
          currentQuestion.options.find((o) => o.isCorrect)?.content,
        variant: "destructive",
      });
    }

    if (currentQuestionIndex < (currentQuiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setSelectedSubject(null);
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setQuizCompleted(false);
    setViewingAnswers(false);
  };

  const viewAnswers = () => {
    setViewingAnswers(true);
  };

  const tryAgain = () => {
    // Shuffle questions again for a new quiz
    if (selectedSubject && quizzes[selectedSubject]?.length > 0) {
      const selectedQuiz = {
        ...quizzes[selectedSubject][
          Math.floor(Math.random() * quizzes[selectedSubject].length)
        ],
      };

      // Shuffle questions for a random quiz
      selectedQuiz.questions = [...selectedQuiz.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      setCurrentQuiz(selectedQuiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setQuizCompleted(false);
      setViewingAnswers(false);
    }
  };

  const getSubjectIcon = (subject: Subject) => {
    switch (subject) {
      case "PHYSICS":
        return <Brain className="h-5 w-5" />;
      case "CHEMISTRY":
        return <Beaker className="h-5 w-5" />;
      case "MATHEMATICS":
        return <Calculator className="h-5 w-5" />;
      default:
        return <Calculator className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (!selectedSubject) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-6 sm:p-0">
        <h1 className="text-3xl font-bold text-center">Select a Subject</h1>
        <div className="grid gap-4">
          {subjects.map((subject) => (
            <Card
              key={subject}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedSubject(subject)}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  {getSubjectIcon(subject)}
                </div>
                <div>
                  <CardTitle>
                    {subject.charAt(0) + subject.slice(1).toLowerCase()} Quiz
                  </CardTitle>
                  <CardDescription>
                    Test your knowledge in {subject.toLowerCase()}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (quizCompleted && viewingAnswers && currentQuiz) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Answer Review</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Final Score:</span>
            <span className="font-bold">{score}</span>
          </div>
        </div>

        <div className="space-y-6">
          {currentQuiz.questions.map((question, index) => {
            const userAnswerId = selectedAnswers[question.id];
            const correctOptionId = question.options.find(
              (o) => o.isCorrect
            )?.id;
            const isCorrect = userAnswerId === correctOptionId;

            return (
              <Card
                key={question.id}
                className={isCorrect ? "border-green-400" : "border-red-400"}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <span className="mr-2">Question {index + 1}</span>
                      {isCorrect ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {question.points} points
                    </span>
                  </div>
                  <CardDescription className="text-base font-medium">
                    {question.content}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isUserSelected = option.id === userAnswerId;
                      const isCorrectOption = option.id === correctOptionId;

                      let optionClass = "";
                      if (isUserSelected && isCorrectOption) {
                        optionClass =
                          "bg-green-100 border-green-400 text-green-800";
                      } else if (isUserSelected && !isCorrectOption) {
                        optionClass = "bg-red-100 border-red-400 text-red-800";
                      } else if (isCorrectOption) {
                        optionClass =
                          "bg-green-50 border-green-200 text-green-700";
                      }

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center p-3 rounded border ${optionClass}`}
                        >
                          <div className="flex-1">{option.content}</div>
                          {isUserSelected && !isCorrectOption && (
                            <X className="h-4 w-4 text-red-500 ml-2" />
                          )}
                          {isCorrectOption && (
                            <Check className="h-4 w-4 text-green-500 ml-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between">
          <Button onClick={resetQuiz} variant="outline">
            New Subject
          </Button>
          <Button onClick={tryAgain}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const totalPoints =
      currentQuiz?.questions.reduce((sum, q) => sum + q.points, 0) || 0;
    const scorePercentage = Math.round((score / totalPoints) * 100);

    return (
      <div className="max-w-md mx-auto p-6 sm:p-0">
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground text-center">
            <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <p className="text-6xl font-bold">
                {score}/{totalPoints}
              </p>
              <p className="text-muted-foreground">Points earned</p>
            </div>

            <Progress value={scorePercentage} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {scorePercentage}% score
            </p>

            <div className="text-center">
              {scorePercentage >= 80 ? (
                <p className="font-medium text-green-600 dark:text-green-400">
                  Excellent work!
                </p>
              ) : scorePercentage >= 60 ? (
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  Good job!
                </p>
              ) : (
                <p className="font-medium text-red-600 dark:text-red-400">
                  Keep practicing!
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button onClick={viewAnswers} className="w-full">
              View Answers
            </Button>
            <div className="flex gap-2 w-full justify-between">
              <Button onClick={resetQuiz} variant="outline" className="flex-1">
                New Subject
              </Button>
              <Button onClick={tryAgain} className="flex-1">
                Try Again
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / (currentQuiz?.questions.length || 1)) * 100;

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 sm:p-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{selectedSubject} Quiz</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Score:</span>
          <span className="font-bold">{score}</span>
        </div>
      </div>

      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Question {currentQuestionIndex + 1} of {currentQuiz?.questions.length}
        </span>
        <span>{currentQuestion.points} points</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.content}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedAnswers[currentQuestion.id]}
            onValueChange={(value) =>
              handleAnswerSelect(currentQuestion.id, value)
            }
          >
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer py-2"
                  >
                    {option.content}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNextQuestion} className="ml-auto">
            {currentQuestionIndex < (currentQuiz?.questions.length || 0) - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
