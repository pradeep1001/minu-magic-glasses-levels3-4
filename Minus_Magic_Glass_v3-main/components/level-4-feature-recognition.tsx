"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Zap, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MinuAvatar } from "@/components/minu-avatar"
import { LevelQuiz } from "@/components/level-quiz"
import { LevelHub, LevelWatch } from "@/components/level-hub"
import { Starfield } from "@/components/starfield"
import { playClick, playFanfare, playError } from "@/lib/audio"
import type { LevelActivityProps, QuizQuestion } from "@/lib/level-data"
import type { MinuPose } from "@/lib/minu-config"
import { cn } from "@/lib/utils"

// ─── Quiz config ──────────────────────────────────────────────

const LEVEL4_QUIZ: QuizQuestion[] = [
  {
    type: "visual_choice",
    question: "Tap the pair of figures that differ mainly by SHAPE.",
    options: [
      { imageSrc: "/images/level4/Apple vs tomato.png", label: "Apple vs Tomato", correct: true },
      { imageSrc: "/images/level4/Coconut vs Basketball.png", label: "Coconut vs Basketball", correct: false },
      { imageSrc: "/images/level4/Orange vs Tennis Ball.png", label: "Orange vs Tennis Ball", correct: false },
      { imageSrc: "/images/level4/White color football vs golf.png", label: "Football vs Golf", correct: false },
    ],
  },
  {
    type: "visual_choice",
    question: "Tap the pair of figures that differ mainly by TEXTURE.",
    options: [
      { imageSrc: "/images/level4/Dolphin.png", label: "Dolphin", correct: false },
      { imageSrc: "/images/level4/Apple vs tomato.png", label: "Apple vs Tomato", correct: false },
      { imageSrc: "/images/level4/Coconut vs Basketball.png", label: "Coconut vs Basketball", correct: true },
      { imageSrc: "/images/level4/White color football vs golf.png", label: "Football vs Golf", correct: false },
    ],
  },
  {
    type: "visual_choice",
    question: "Tap the pair where one figure is REAL and one is a TOY.",
    options: [
      { imageSrc: "/images/level4/Apple vs tomato.png", label: "Apple vs Tomato", correct: false },
      { imageSrc: "/images/level4/Dolphin.png", label: "Dolphin", correct: true },
      { imageSrc: "/images/level4/Orange vs Tennis Ball.png", label: "Orange vs Tennis Ball", correct: false },
      { imageSrc: "/images/level4/White color football vs golf.png", label: "Football vs Golf", correct: false },
    ],
  },
]

// ─── Round config ──────────────────────────────────────────────

const OPTIONS = ["Shape", "Color", "Texture"] as const
type Option = (typeof OPTIONS)[number]
type SubmitState = "idle" | "correct" | "wrong"

const ROUNDS = [
  {
    id: "round1",
    image: "/images/level4/Apple vs tomato.png",
    label: "Apple vs Tomato",
    correct: "Shape" as Option,
  },
  {
    id: "round2",
    image: "/images/level4/Coconut vs Basketball.png",
    label: "Coconut vs Basketball",
    correct: "Texture" as Option,
  },
  {
    id: "round3",
    image: "/images/level4/Dolphin.png",
    label: "Real Dolphin vs Plushy Dolphin",
    correct: "Texture" as Option,
  },
  {
    id: "round4",
    image: "/images/level4/Orange vs Tennis Ball.png",
    label: "Orange vs Tennis Ball",
    correct: "Texture" as Option,
  },
  {
    id: "round5",
    image: "/images/level4/White color football vs golf.png",
    label: "Football vs Golf Ball",
    correct: "Texture" as Option,
  },
]

type Phase = "hub" | "watch" | "activity" | "quiz"

// ─── Component ────────────────────────────────────────────────

export default function Level4FeatureRecognition({ onComplete, onBack }: LevelActivityProps) {
  const [phase, setPhase] = useState<Phase>("hub")
  const [playDone, setPlayDone] = useState(false)
  const [quizKey, setQuizKey] = useState(0)
  const [roundIndex, setRoundIndex] = useState(0)
  const [selected, setSelected] = useState<Option | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [minuPose, setMinuPose] = useState<MinuPose>("pointing")
  const [statusText, setStatusText] = useState(
    "Look at the two figures carefully. How are they different?",
  )

  const round = ROUNDS[roundIndex]

  const handleAnswer = (option: Option) => {
    if (submitState !== "idle") return
    playClick()
    setSelected(option)

    if (option === round.correct) {
      setSubmitState("correct")
      setMinuPose("celebrating")
      setStatusText(`Correct! The figures differ by ${round.correct}. Great job!`)
      playFanfare()

      setTimeout(() => {
        const next = roundIndex + 1
        if (next < ROUNDS.length) {
          setRoundIndex(next)
          setSelected(null)
          setSubmitState("idle")
          setMinuPose("pointing")
          setStatusText("Look at the two figures carefully. How are they different?")
        } else {
          setPlayDone(true)
          setPhase("quiz")
        }
      }, 1400)
    } else {
      setSubmitState("wrong")
      setMinuPose("oops")
      setStatusText(`Not quite! Look more closely at the two figures and try again.`)
      playError()

      // Reset after showing error so user can try again (same question)
      setTimeout(() => {
        setSelected(null)
        setSubmitState("idle")
        setMinuPose("pointing")
        setStatusText("Look at the two figures carefully. How are they different?")
      }, 1500)
    }
  }

  // ── Hub Phase (Watch / Play / Quiz landing) ────────────────────
  if (phase === "hub") {
    return (
      <LevelHub
        levelLabel="Level 4"
        title="Feature Recognition"
        subtitle="Spot shapes and regions so Minu knows what's what."
        quizUnlocked={playDone}
        onWatch={() => setPhase("watch")}
        onPlay={() => setPhase("activity")}
        onQuiz={() => setPhase("quiz")}
        onBack={onBack}
      />
    )
  }

  // ── Watch Phase (video placeholder → Play) ─────────────────────
  if (phase === "watch") {
    return (
      <LevelWatch
        levelLabel="Level 4"
        title="Feature Recognition"
        onNext={() => setPhase("activity")}
        onBack={() => setPhase("hub")}
      />
    )
  }

  // ── Quiz Phase ─────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <main className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background">
        <Starfield count={70} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-chart-4/15 to-transparent"
        />
        <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-primary/20 px-4 py-3 sm:px-6">
          <Button
            size="icon"
            variant="secondary"
            className="size-10 shrink-0 rounded-full border border-primary/25"
            aria-label="Back to menu"
            onClick={() => { playClick(); setPhase("hub") }}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-xs font-bold tracking-wide text-secondary uppercase">
              Bonus Round
            </p>
            <h1 className="font-heading text-lg font-extrabold text-foreground sm:text-xl">
              Final Quiz!
            </h1>
          </div>
          <Sparkles className="size-6 shrink-0 text-secondary drop-shadow-[0_0_8px_var(--chart-4)]" />
        </header>
        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col justify-center px-4 py-4">
          <LevelQuiz
            key={quizKey}
            questions={LEVEL4_QUIZ}
            passCount={2}
            retryOnlyOnFail
            compact
            onComplete={() => { playFanfare(); onComplete() }}
            onBack={() => setPhase("hub")}
            onFail={() => { playClick(); setQuizKey((k) => k + 1) }}
          />
        </div>
      </main>
    )
  }

  // ── Activity Phase ──────────────────────────────────────────────
  return (
    <main className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background">
      <Starfield count={80} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-chart-4/20 via-primary/5 to-transparent"
      />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
        <Button
          size="icon"
          variant="secondary"
          className="size-9 shrink-0 rounded-full border border-primary/25 sm:size-10"
          aria-label="Back to menu"
          onClick={() => { playClick(); setPhase("hub") }}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-heading flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-secondary uppercase sm:text-xs">
            <Zap className="size-3.5" />
            Level 4 · Feature Recognition
          </p>
          <h1 className="font-heading truncate text-base font-extrabold text-foreground sm:text-xl">
            {round.label}
          </h1>
        </div>
        <span className="font-heading shrink-0 rounded-full border border-primary/30 bg-card/80 px-2.5 py-1 text-xs font-bold text-primary shadow-sm sm:px-3 sm:text-sm">
          {roundIndex + 1}/{ROUNDS.length}
        </span>
      </header>

      {/* Main */}
      <div className="relative z-10 flex min-h-0 flex-1 gap-2 px-2 sm:gap-4 sm:px-4">

        {/* Left: Minu + question + status */}
        <aside className="flex w-[36%] min-w-[118px] max-w-[280px] shrink-0 flex-col gap-2 sm:gap-2.5">
          <p className="font-heading text-center text-[10px] font-bold tracking-wider text-secondary uppercase sm:text-xs">
            Your Mission
          </p>

          {/* Minu avatar */}
          <div className="flex shrink-0 items-center justify-center py-1">
            <MinuAvatar pose={minuPose} size={64} className="hidden sm:block" />
            <MinuAvatar pose={minuPose} size={48} className="sm:hidden" />
          </div>

          {/* Question */}
          <div className="rounded-2xl border-2 border-primary/35 bg-card/75 px-3 py-2.5 shadow-lg shadow-primary/15">
            <p className="font-heading text-[11px] font-bold leading-snug text-foreground sm:text-sm">
              On what feature do the given figures differ?
            </p>
          </div>

          {/* Status message */}
          <div
            className={cn(
              "rounded-2xl border-2 px-3 py-2.5 backdrop-blur-sm transition-all",
              submitState === "correct" &&
                "border-accent/50 bg-accent/10 shadow-[0_0_20px_oklch(0.78_0.2_150/25%)]",
              submitState === "wrong" &&
                "border-destructive/45 bg-destructive/10 shadow-[0_0_20px_oklch(0.62_0.24_25/25%)]",
              submitState === "idle" &&
                "border-primary/25 bg-card/60",
            )}
          >
            <p className="font-heading text-[11px] font-bold leading-snug text-foreground sm:text-sm">
              {statusText}
            </p>
          </div>
        </aside>

        {/* Right: Image + answer buttons */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/25 bg-card/50 px-2 py-1.5 sm:px-3">
            <p className="font-heading text-[10px] font-bold text-foreground sm:text-xs">
              Study the two figures, then pick the feature that differs!
            </p>
          </div>

          {/* Image — transparent PNG on dark theme */}
          <div className="relative min-h-0 flex-1 flex items-center justify-center">
            <Image
              src={round.image}
              alt={round.label}
              fill
              className="object-contain drop-shadow-2xl"
              sizes="(max-width: 640px) 60vw, 50vw"
              priority
            />
          </div>

          {/* Answer buttons */}
          <div className="grid shrink-0 grid-cols-3 gap-2">
            {OPTIONS.map((option) => {
              const isSelected = selected === option
              const isCorrect = isSelected && submitState === "correct"
              const isWrong = isSelected && submitState === "wrong"
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={submitState !== "idle"}
                  className={cn(
                    "font-heading rounded-2xl border-2 py-3 text-sm font-extrabold transition-all sm:py-4 sm:text-base",
                    submitState === "idle" &&
                      "border-border bg-card/80 hover:border-secondary/70 hover:bg-secondary/10",
                    isCorrect && "border-accent bg-accent/20 text-accent shadow-[0_0_16px_oklch(0.78_0.2_150/30%)]",
                    isWrong   && "border-destructive bg-destructive/15 text-destructive",
                    !isSelected && submitState !== "idle" && "opacity-40",
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>

        </section>
      </div>

      {/* Footer progress rail */}
      <footer className="relative z-10 shrink-0 border-t border-primary/20 bg-card/40 px-4 py-2 backdrop-blur-sm sm:py-2.5">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2">
          {ROUNDS.map((r, i) => (
            <div key={r.id} className="flex flex-col items-center gap-0.5">
              <span
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === roundIndex ? "w-8 bg-primary shadow-[0_0_8px_var(--primary)]" : "w-4",
                  i < roundIndex ? "bg-accent" : i !== roundIndex ? "bg-muted" : "",
                )}
              />
              <span
                className={cn(
                  "font-heading hidden text-[9px] font-bold sm:block",
                  i === roundIndex ? "text-primary" : "text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </main>
  )
}
