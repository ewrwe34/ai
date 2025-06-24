import { PoemGenerator } from '@/components/poem-generator';
import { Bot } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 px-6 md:px-8 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Bot className="text-primary h-7 w-7" />
          <h1 className="text-2xl font-headline font-bold text-foreground">
            SnapVerse
          </h1>
        </div>
      </header>
      <main className="flex-1">
        <PoemGenerator />
      </main>
    </div>
  );
}
