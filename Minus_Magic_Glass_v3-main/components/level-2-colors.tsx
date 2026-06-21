"use client"

import { useState } from "react"
import { ArrowLeft, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Starfield } from "@/components/starfield"
import { LevelHub, LevelWatch } from "@/components/level-hub"
import { playClick } from "@/lib/audio"
import type { LevelActivityProps } from "@/lib/level-data"

type Phase = "hub" | "watch" | "play" | "quiz"

export default function Level2Colors({ onComplete, onBack }: LevelActivityProps) {
  const [phase, setPhase] = useState<Phase>("hub")

  if (phase === "hub") {
    return (
      <LevelHub
        levelLabel="Level 2"
        title="Color Potion Time!"
        subtitle="Red, Green and Blue make every colour Minu sees."
        quizUnlocked={false}
        onWatch={() => setPhase("watch")}
        onPlay={() => setPhase("play")}
        onQuiz={() => setPhase("quiz")}
        onBack={onBack}
      />
    )
  }

  if (phase === "watch") {
    return (
      <LevelWatch
        levelLabel="Level 2"
        title="Color Potion Time!"
        videoSrc="https://drive.google.com/file/d/1CfkS048BD3lpBAV6lywvG5ppxAiIK9ZQ/preview"
        onNext={() => setPhase("play")}
        onBack={() => setPhase("hub")}
      />
    )
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <Starfield count={70} />
      <header className="absolute left-0 top-0 z-10 px-5 py-5">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full"
          aria-label="Back to menu"
          onClick={() => { playClick(); setPhase("hub") }}
        >
          <ArrowLeft className="size-5" />
        </Button>
      </header>
      <div className="relative z-10 flex max-w-lg flex-col items-center gap-5 text-center">
        <span className="font-heading inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-bold text-secondary">
          Level 2
        </span>
        <h1 className="font-heading text-4xl font-extrabold text-foreground">Color Potion Time!</h1>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-5 py-4 text-sm font-semibold text-muted-foreground">
          <Wrench className="size-5 text-secondary" />
          This level&apos;s activity is coming soon!
        </div>
        <Button
          size="lg"
          onClick={() => { playClick(); setPhase("hub") }}
          className="font-heading mt-2 rounded-full px-8 text-lg font-extrabold"
        >
          <ArrowLeft className="size-5" />
          Back to Menu
        </Button>
      </div>
    </main>
  )
}
