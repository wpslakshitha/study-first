"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, BookOpen, Brain, Clock, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: <Book className="h-5 w-5" />,
    },
    {
      name: "Quizzes",
      href: "/quizzes",
      icon: <Brain className="h-5 w-5" />,
    },
    {
      name: "Flashcards",
      href: "/flashcards",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  return (
    <header className="  sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur pl-4 pr-4 sm:p-0">
      <div className="container mx-auto  flex h-16 items-center justify-between">
        {/* Logo and brand name */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Study First</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
          <ModeToggle />
        </nav>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <nav className="container py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-2 text-sm font-medium rounded-md hover:bg-accent ${
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
