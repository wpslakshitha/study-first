import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, Brain, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Hero section with responsive text sizes */}
      <div className="text-center space-y-4 py-6 md:py-10">
        <h1 className="text-3xl md:text-4xl font-bold">Study Companion</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
          Master physics, chemistry, and mathematics with interactive quizzes,
          flashcards, and time tracking.
        </p>
      </div>

      {/* Card grid that stacks on mobile and shows as columns on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {/* Quiz Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <Brain className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Quizzes
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Test your knowledge with randomly generated quizzes
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm md:text-base">
              Challenge yourself with questions in physics, chemistry, and
              mathematics. Get points for correct answers and track your
              progress.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/quizzes" className="w-full">
              <Button className="w-full text-sm md:text-base">
                Start a Quiz
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Flashcards Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Flashcards
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Memorize concepts with interactive flashcards
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm md:text-base">
              Flip through cards to test your memory. Mark cards as correct or
              incorrect to focus on areas that need improvement.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/flashcards" className="w-full">
              <Button className="w-full text-sm md:text-base">
                Study Flashcards
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Task Tracker Card */}
        <Card className="hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Task Tracker
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Manage study time and track progress
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm md:text-base">
              Create tasks, track time spent, and view detailed reports to
              optimize your study habits and productivity.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/tasks" className="w-full">
              <Button className="w-full text-sm md:text-base">
                Track Tasks
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
