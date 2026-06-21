"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ArrowLeft, Zap, CheckCircle2, RotateCcw, Lightbulb, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MinuAvatar } from "@/components/minu-avatar"
import { LevelHub, LevelWatch } from "@/components/level-hub"
import { Starfield } from "@/components/starfield"
import { playClick, playFanfare, playError } from "@/lib/audio"
import type { LevelActivityProps } from "@/lib/level-data"
import type { MinuPose } from "@/lib/minu-config"
import { cn } from "@/lib/utils"

// ─── Round config ─────────────────────────────────────────────

type RGB = { r: number; g: number; b: number }

const ROUNDS = [
  {
    id: "black",
    label: "Black",
    title: "Round 1 – Black",
    target: { r: 0, g: 0, b: 0 },
    initialGuess: { r: 255, g: 255, b: 255 },
    tolerance: 2,
    colorName: "black",
    instruction: "Mix the sliders until the right lens matches the black target!",
    hint: "Pull all three sliders — Red, Green, and Blue — all the way to the left (0).",
    doneText: "Amazing! You found black — that's when all colours are turned off!",
  },
  {
    id: "white",
    label: "White",
    title: "Round 2 – White",
    target: { r: 255, g: 255, b: 255 },
    initialGuess: { r: 0, g: 0, b: 0 },
    tolerance: 2,
    colorName: "white",
    instruction: "Mix the sliders until the right lens matches the white target!",
    hint: "Push all three sliders — Red, Green, and Blue — all the way to the right (100%).",
    doneText: "Brilliant! White means all colours are turned up to maximum brightness!",
  },
  {
    id: "grey",
    label: "Grey",
    title: "Round 3 – Grey",
    target: { r: 127, g: 127, b: 127 },
    initialGuess: { r: 0, g: 0, b: 0 },
    tolerance: 4,
    colorName: "grey",
    instruction: "Mix the sliders until the right lens matches the grey target!",
    hint: "Move all three sliders to the middle — around 50% each.",
    doneText: "Incredible! Grey is right in the middle — half brightness for every colour!",
  },
] as const

// ─── Quiz config ──────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    question: "A computer picture is made of lots of tiny little squares. What are these tiny squares called?",
    options: ["Stars", "Dots", "Pixels", "Bubbles"],
    correct: 2,
  },
  {
    question: "Minu is looking at a black-and-white photo. Which word describes how dark or light each tiny square is?",
    options: ["Speed", "Brightness", "Weight", "Smell"],
    correct: 1,
  },
  {
    question: "If a tiny square in a picture is completely black, is it very bright or very dark?",
    options: ["Very bright", "A little bright", "In the middle", "Very dark"],
    correct: 3,
  },
  {
    question: "If a tiny square is pure white, what does that mean?",
    options: ["It is completely dark", "It is broken", "It is as bright as it can be", "It has no colour"],
    correct: 2,
  },
  {
    question: "Minu zooms into a photo really closely. What will she see?",
    options: [
      "Tiny little squares of different shades",
      "Tiny stars twinkling",
      "One big solid colour",
      "Nothing — it disappears",
    ],
    correct: 0,
  },
]

type Phase = "hub" | "watch" | "play" | "quiz"

// ─── Component ────────────────────────────────────────────────

export default function Level1Pixels({ onComplete, onBack }: LevelActivityProps) {
  const [phase, setPhase] = useState<Phase>("hub")
  const [playDone, setPlayDone] = useState(false)

  // Play state
  const [roundIndex, setRoundIndex] = useState(0)
  const [guessColor, setGuessColor] = useState<RGB>(ROUNDS[0].initialGuess)
  const [roundDone, setRoundDone] = useState(false)
  const [minuPose, setMinuPose] = useState<MinuPose>("pointing")
  const [statusText, setStatusText] = useState(ROUNDS[0].instruction)
  const [hintVisible, setHintVisible] = useState(false)
  const [matchFeedback, setMatchFeedback] = useState<"success" | "fail" | null>(null)

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null)
  const [quizDone, setQuizDone] = useState(false)

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const round = ROUNDS[roundIndex]

  useEffect(() => {
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current) }
  }, [])

  const handleSliderChange = useCallback((channel: "r" | "g" | "b", val: number) => {
    setGuessColor(prev => ({ ...prev, [channel]: val }))
  }, [])

  const handleCheckMatch = useCallback(() => {
    if (roundDone) return
    const { target, tolerance } = round
    const isMatch =
      Math.abs(target.r - guessColor.r) <= tolerance &&
      Math.abs(target.g - guessColor.g) <= tolerance &&
      Math.abs(target.b - guessColor.b) <= tolerance

    if (isMatch) {
      playFanfare()
      setRoundDone(true)
      setMinuPose("celebrating")
      setStatusText(round.doneText)
      setMatchFeedback("success")
    } else {
      playError()
      setMinuPose("empathetic")
      setMatchFeedback("fail")
      // Hint about which channel is furthest off
      const diffR = Math.abs(target.r - guessColor.r)
      const diffG = Math.abs(target.g - guessColor.g)
      const diffB = Math.abs(target.b - guessColor.b)
      let hint = ""
      if (diffR >= diffG && diffR >= diffB) {
        hint = guessColor.r < target.r ? "Try moving the Red slider to the right!" : "Try moving the Red slider to the left!"
      } else if (diffG >= diffR && diffG >= diffB) {
        hint = guessColor.g < target.g ? "Try moving the Green slider to the right!" : "Try moving the Green slider to the left!"
      } else {
        hint = guessColor.b < target.b ? "Try moving the Blue slider to the right!" : "Try moving the Blue slider to the left!"
      }
      setStatusText(`Not quite! ${hint}`)
      feedbackTimerRef.current = setTimeout(() => {
        setMatchFeedback(null)
        setMinuPose("pointing")
        setStatusText(round.instruction)
      }, 2000)
    }
  }, [round, guessColor, roundDone])

  const handleNextRound = () => {
    playClick()
    if (roundIndex < ROUNDS.length - 1) {
      const next = roundIndex + 1
      setRoundIndex(next)
      setGuessColor(ROUNDS[next].initialGuess)
      setRoundDone(false)
      setMinuPose("pointing")
      setStatusText(ROUNDS[next].instruction)
      setHintVisible(false)
      setMatchFeedback(null)
    } else {
      setPlayDone(true)
      setPhase("quiz")
    }
  }

  const resetRound = () => {
    playClick()
    setGuessColor(round.initialGuess)
    setRoundDone(false)
    setMinuPose("pointing")
    setStatusText(round.instruction)
    setHintVisible(false)
    setMatchFeedback(null)
  }

  const handleQuizAnswer = (optionIndex: number) => {
    if (quizSelected !== null) return
    playClick()
    const correct = optionIndex === QUIZ_QUESTIONS[quizIndex].correct
    setQuizSelected(optionIndex)
    setQuizCorrect(correct)
    const newScore = correct ? quizScore + 1 : quizScore
    if (correct) {
      setQuizScore(newScore)
    } else {
      playError()
    }
    setTimeout(() => {
      const next = quizIndex + 1
      if (next < QUIZ_QUESTIONS.length) {
        setQuizIndex(next)
        setQuizSelected(null)
        setQuizCorrect(null)
      } else {
        setQuizDone(true)
        if (newScore >= 3) playFanfare()
      }
    }, 1000)
  }

  const retryQuiz = () => {
    playClick()
    setQuizIndex(0)
    setQuizScore(0)
    setQuizSelected(null)
    setQuizCorrect(null)
    setQuizDone(false)
  }

  // ── Hub Phase ──────────────────────────────────────────────────
  if (phase === "hub") {
    return (
      <LevelHub
        levelLabel="Level 1"
        title="Pixel to Colors"
        subtitle="Teach Minu how computers store light as numbers."
        quizUnlocked={playDone}
        onWatch={() => setPhase("watch")}
        onPlay={() => { setRoundIndex(0); setGuessColor(ROUNDS[0].initialGuess); setRoundDone(false); setMinuPose("pointing"); setStatusText(ROUNDS[0].instruction); setPhase("play") }}
        onQuiz={() => setPhase("quiz")}
        onBack={onBack}
      />
    )
  }

  // ── Watch Phase ────────────────────────────────────────────────
  if (phase === "watch") {
    return (
      <LevelWatch
        levelLabel="Level 1"
        title="Pixel to Colors"
        videoSrc="https://drive.google.com/file/d/1UAz_vxqs2PNQXhvmDLdh8LD1TniuWqHZ/preview"
        onNext={() => setPhase("play")}
        onBack={() => setPhase("hub")}
      />
    )
  }

  // ── Quiz Phase ─────────────────────────────────────────────────
  if (phase === "quiz") {
    const q = QUIZ_QUESTIONS[quizIndex]
    return (
      <main className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background">
        <Starfield count={70} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-chart-2/15 to-transparent" />

        <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-primary/20 px-4 py-3 sm:px-6">
          <Button
            size="icon" variant="secondary"
            className="size-10 shrink-0 rounded-full border border-primary/25"
            aria-label="Back to menu"
            onClick={() => { playClick(); setPhase("hub") }}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-xs font-bold tracking-wide text-secondary uppercase">Bonus Round</p>
            <h1 className="font-heading text-lg font-extrabold text-foreground sm:text-xl">Final Quiz!</h1>
          </div>
          <Star className="size-6 shrink-0 text-secondary drop-shadow-[0_0_8px_var(--chart-2)]" />
        </header>

        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col justify-center px-4 py-4 gap-5">
          {!quizDone ? (
            <>
              <p className="font-heading text-center text-xs font-bold text-muted-foreground">
                Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}
              </p>
              <p className="font-heading text-center text-base font-extrabold text-foreground sm:text-lg">
                {q.question}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, i) => {
                  const isSelected = quizSelected === i
                  const isRight = isSelected && quizCorrect === true
                  const isWrong = isSelected && quizCorrect === false
                  const isMissed = quizSelected !== null && !isSelected && i === QUIZ_QUESTIONS[quizIndex].correct
                  return (
                    <button
                      key={i}
                      onClick={() => handleQuizAnswer(i)}
                      disabled={quizSelected !== null}
                      className={cn(
                        "rounded-2xl border-2 px-4 py-3 text-left font-heading text-sm font-bold transition-all",
                        quizSelected === null && "border-border hover:border-secondary/70 hover:bg-secondary/10",
                        isRight && "border-accent bg-accent/15 text-accent",
                        isWrong && "border-destructive bg-destructive/15",
                        isMissed && "border-accent/50 bg-accent/5",
                      )}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-5 text-center">
              <MinuAvatar pose={quizScore >= 3 ? "celebrating" : "empathetic"} size={100} />
              <p className="font-heading text-xl font-extrabold text-foreground">
                {quizScore >= 3 ? "Awesome!" : "Keep trying!"} You scored {quizScore}/{QUIZ_QUESTIONS.length}!
              </p>
              {quizScore >= 3 ? (
                <Button size="lg" onClick={() => { playClick(); onComplete() }} className="font-heading rounded-full px-8 font-extrabold">
                  <CheckCircle2 className="size-5" /> Level Complete!
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="secondary" size="lg" onClick={retryQuiz} className="font-heading rounded-full px-6 font-extrabold">
                    <RotateCcw className="size-4" /> Try Again
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => { playClick(); setPhase("hub") }} className="font-heading rounded-full px-6 font-extrabold">
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    )
  }

  // ── Play Phase ─────────────────────────────────────────────────
  return (
    <main className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background">
      <style>{`
        @keyframes float-minu {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .minu-float { animation: float-minu 3s ease-in-out infinite; }
      `}</style>
      <Starfield count={80} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-chart-2/20 via-primary/5 to-transparent" />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center gap-4 px-4 py-4 sm:px-6">
        <button
          aria-label="Back to menu"
          onClick={() => { playClick(); setPhase("hub") }}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/40 hover:bg-fuchsia-400 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-heading flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-fuchsia-400 uppercase sm:text-xs">
            <Zap className="size-3.5" /> Level 1 · Pixel to Colors
          </p>
          <h1 className="font-heading truncate text-xl font-bold text-foreground sm:text-2xl">
            {round.title}
          </h1>
        </div>
        <span className="font-heading shrink-0 rounded-full border border-purple-500/50 px-4 py-1.5 text-sm font-semibold text-purple-300">
          {roundIndex + 1}/3
        </span>
      </header>

      {/* Main */}
      <div className="relative z-10 flex min-h-0 flex-1 gap-6 px-4 sm:gap-8 sm:px-6">

        {/* Left sidebar */}
        <aside className="flex w-56 shrink-0 flex-col gap-3 sm:w-64">
          <p className="font-heading flex items-center gap-2 text-sm font-bold text-fuchsia-400">
            <Star className="size-3.5 fill-fuchsia-400" /> YOUR MISSION
          </p>

          {/* Minu with float animation */}
          <div className="minu-float flex shrink-0 justify-center">
            <MinuAvatar pose={minuPose} size={96} />
          </div>

          {/* Status card */}
          <div className={cn(
            "rounded-2xl border p-4",
            roundDone
              ? "border-green-400/60 bg-green-500/5"
              : matchFeedback === "fail"
              ? "border-destructive/50 bg-destructive/5"
              : "border-purple-500/40 bg-card/60",
          )}>
            <p className="font-heading text-sm font-semibold leading-snug text-foreground">
              {statusText}
            </p>
          </div>

          {/* Hint button — full width fuchsia */}
          <button
            type="button"
            onClick={() => { playClick(); setHintVisible(h => !h) }}
            className="font-heading w-full rounded-full bg-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-fuchsia-500/40 hover:bg-fuchsia-400 transition-colors"
          >
            Hint
          </button>

          {/* Reset button — full width outline */}
          <button
            type="button"
            onClick={resetRound}
            className="font-heading flex w-full items-center justify-center gap-2 rounded-full border border-purple-500/40 py-3 font-semibold text-white hover:bg-purple-500/10 transition-colors"
          >
            <RotateCcw className="size-4" /> Reset
          </button>

          {hintVisible && (
            <p className="rounded-xl bg-secondary/10 px-3 py-2 text-xs font-semibold leading-snug text-secondary">
              {round.hint}
            </p>
          )}
        </aside>

        {/* Right content */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">

          {/* Instruction bar */}
          <div className="flex shrink-0 items-center justify-center gap-3 rounded-2xl border border-purple-500/50 py-4">
            <Zap className="size-4 text-purple-300" />
            <span className="font-heading text-sm font-semibold text-foreground sm:text-base">
              Move the sliders until both lenses match!
            </span>
          </div>

          {/* Colour lenses */}
          <div className="flex shrink-0 items-center justify-center gap-10 rounded-2xl border border-purple-500/50 py-6 sm:gap-12">
            {/* Target lens */}
            <div className="flex flex-col items-center gap-3">
              <p className="font-heading flex items-center gap-1 text-sm font-bold text-amber-400">
                🎯 TARGET
              </p>
              <div
                className="size-28 rounded-full border-4 border-amber-400 sm:size-36 md:size-40"
                style={{
                  backgroundColor: `rgb(${round.target.r},${round.target.g},${round.target.b})`,
                  boxShadow: `0 0 25px rgba(251,191,36,0.4)`,
                }}
              />
              <p className="font-heading text-sm text-gray-300">{round.colorName}</p>
            </div>

            <span className="font-heading text-2xl font-bold text-gray-300 sm:text-3xl">VS</span>

            {/* Guess lens */}
            <div className="flex flex-col items-center gap-3">
              <p className="font-heading flex items-center gap-1 text-sm font-bold text-green-400">
                🧪 YOUR MIX
              </p>
              <div
                className="size-28 rounded-full border-4 border-indigo-400 transition-colors duration-150 sm:size-36 md:size-40"
                style={{
                  backgroundColor: `rgb(${guessColor.r},${guessColor.g},${guessColor.b})`,
                  boxShadow: `0 0 25px rgba(129,140,248,0.4)`,
                }}
              />
              <p className="font-heading text-sm text-gray-300">your mix</p>
            </div>
          </div>

          {/* Sliders */}
          <div className="shrink-0 rounded-2xl border border-purple-500/40 px-5 py-5 sm:px-6">
            <div className="mx-auto flex max-w-xl flex-col gap-4">
              {(["r", "g", "b"] as const).map((ch) => {
                const labels = { r: "Red", g: "Green", b: "Blue" }
                const dots  = { r: "bg-red-500", g: "bg-green-500", b: "bg-blue-500" }
                const fills = { r: "#ef4444", g: "#22c55e", b: "#3b82f6" }
                return (
                  <div key={ch} className="flex items-center gap-4">
                    <span className={cn("size-3 shrink-0 rounded-full", dots[ch])} />
                    <span className="font-heading w-14 shrink-0 font-semibold text-foreground">
                      {labels[ch]}
                    </span>
                    <div className="relative flex flex-1 items-center">
                      <div
                        className="pointer-events-none absolute left-0 h-1.5 rounded-l-full opacity-70"
                        style={{ width: `${(guessColor[ch] / 255) * 100}%`, backgroundColor: fills[ch] }}
                      />
                      <input
                        type="range" min={0} max={255}
                        value={guessColor[ch]}
                        disabled={roundDone}
                        onChange={e => handleSliderChange(ch, parseInt(e.target.value))}
                        className="relative z-10 w-full cursor-pointer appearance-none rounded-full bg-[#2a1f33] h-1.5 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                    </div>
                    <span className="font-heading w-12 shrink-0 text-right font-semibold text-muted-foreground">
                      {Math.round((guessColor[ch] / 255) * 100)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Check Match / Next Round — centered */}
          <div className="flex shrink-0 justify-center pb-2">
            {!roundDone ? (
              <button
                onClick={handleCheckMatch}
                className="font-heading flex items-center gap-2 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 px-10 py-4 font-bold text-white shadow-lg shadow-purple-600/40 hover:from-purple-400 transition-all"
              >
                ✨ Check Match!
              </button>
            ) : (
              <button
                onClick={handleNextRound}
                className="font-heading flex items-center gap-2 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 px-10 py-4 font-bold text-white shadow-lg shadow-purple-600/40 hover:from-purple-400 transition-all"
              >
                <CheckCircle2 className="size-5" />
                {roundIndex < ROUNDS.length - 1 ? "Next Round →" : "Go to Quiz!"}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Footer progress rail */}
      <footer className="relative z-10 shrink-0 px-4 py-3 sm:py-4">
        <div className="mx-auto flex max-w-3xl items-start justify-center gap-10">
          {ROUNDS.map((r, i) => (
            <div key={r.id} className="flex flex-col items-center gap-1">
              {i === roundIndex ? (
                <>
                  <div className="h-1.5 w-8 rounded-full bg-purple-500" />
                  <span className="font-heading text-xs font-semibold text-purple-300">{r.label}</span>
                </>
              ) : (
                <span className={cn(
                  "font-heading text-xs font-semibold mt-[6px]",
                  i < roundIndex ? "text-accent" : "text-gray-400"
                )}>
                  {r.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </footer>
    </main>
  )
}
