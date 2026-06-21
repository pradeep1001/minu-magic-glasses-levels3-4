"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ArrowLeft, Zap, CheckCircle2, RotateCcw, Lightbulb, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MinuAvatar } from "@/components/minu-avatar"
import { LevelHub, LevelWatch } from "@/components/level-hub"
import { Starfield } from "@/components/starfield"
import { playClick, playFanfare, playError } from "@/lib/audio"
import type { LevelActivityProps } from "@/lib/level-data"
import type { MinuPose } from "@/lib/minu-config"
import { cn } from "@/lib/utils"

// ─── Dot generation ───────────────────────────────────────────

type Dot = { x: number; y: number }

const CIRCLE_DOTS: Dot[] = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * 2 * Math.PI
  return { x: 100 + 80 * Math.cos(angle), y: 100 + 80 * Math.sin(angle) }
})

function buildSquareDots(): Dot[] {
  const dots: Dot[] = []
  const seen = new Set<string>()
  for (let i = 0; i <= 160; i += 18) {
    const candidates: [number, number][] = [
      [20 + i, 20],
      [20 + i, 180],
      [20, 20 + i],
      [180, 20 + i],
    ]
    for (const [x, y] of candidates) {
      const key = `${x},${y}`
      if (!seen.has(key)) { seen.add(key); dots.push({ x, y }) }
    }
  }
  return dots
}
const SQUARE_DOTS = buildSquareDots()

function buildRhombusDots(): Dot[] {
  const vertices = [
    { x: 100, y: 20 },
    { x: 180, y: 100 },
    { x: 100, y: 180 },
    { x: 20, y: 100 },
  ]
  const dots: Dot[] = []
  for (let s = 0; s < 4; s++) {
    const v0 = vertices[s]
    const v1 = vertices[(s + 1) % 4]
    for (let t = 0; t < 6; t++) {
      dots.push({
        x: v0.x + (v1.x - v0.x) * (t / 6),
        y: v0.y + (v1.y - v0.y) * (t / 6),
      })
    }
  }
  return dots
}
const RHOMBUS_DOTS = buildRhombusDots()

// ─── Round config ─────────────────────────────────────────────

const ROUNDS = [
  {
    id: "circle",
    label: "Circle",
    title: "Round 1 – Circle",
    instruction: "Imagine a circle in the grid. Color the cells along its round edge!",
    hint: "Picture a big circle filling the grid, then click the cells that sit on its curved border. Leave the middle and corners blank.",
    doneText: "Amazing! You found the circle's edge cells!",
    color: "#a78bfa",
    dots: CIRCLE_DOTS,
  },
  {
    id: "square",
    label: "Square",
    title: "Round 2 – Square",
    instruction: "Trace a square. Color the cells along all four straight edges!",
    hint: "A square has a flat top, bottom, left and right. Click the cells that form those four straight sides, and leave the inside empty.",
    doneText: "Brilliant! The square's edges are revealed!",
    color: "#34d399",
    dots: SQUARE_DOTS,
  },
  {
    id: "rhombus",
    label: "Rhombus",
    title: "Round 3 – Rhombus",
    instruction: "Trace a diamond. Color the cells along its four slanted edges!",
    hint: "Start at the top point and follow each slanted side down to the side points and the bottom point — like a diamond.",
    doneText: "Incredible! You've mastered edge detection!",
    color: "#f59e0b",
    dots: RHOMBUS_DOTS,
  },
] as const

// ─── Quiz config ──────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    question: "What does edge detection find in a picture?",
    options: ["The outlines and borders of shapes", "The brightest colors", "The biggest pixels", "Hidden text"],
    correct: 0,
  },
  {
    question: "A computer sees a picture as a grid of cells. What are edges made of?",
    options: ["Cells along the border of a shape", "Cells in the very center", "The empty cells only", "Every cell equally"],
    correct: 0,
  },
  {
    question: "Which shape did you trace in Round 1?",
    options: ["Circle", "Triangle", "Star", "Rectangle"],
    correct: 0,
  },
]

const TRACE_RADIUS = 18
const REQUIRED_FRACTION = 1.0

/** Minimum distance from point P to the line segment AB. */
function distToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.sqrt((px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2)
}

type Phase = "hub" | "watch" | "activity" | "quiz"

// ─── Component ────────────────────────────────────────────────

export default function Level3EdgeDetection({ onComplete, onBack }: LevelActivityProps) {
  const [phase, setPhase] = useState<Phase>("hub")
  const [playDone, setPlayDone] = useState(false)

  // Activity state
  const [roundIndex, setRoundIndex] = useState(0)
  const [litDots, setLitDots] = useState<Set<number>>(new Set())
  const [roundDone, setRoundDone] = useState(false)
  const [minuPose, setMinuPose] = useState<MinuPose>("pointing")
  const [statusText, setStatusText] = useState(ROUNDS[0].instruction)
  const [hintVisible, setHintVisible] = useState(false)

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null)
  const [quizDone, setQuizDone] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const prevPosRef = useRef<{ x: number; y: number } | null>(null)
  const round = ROUNDS[roundIndex]
  const progress = litDots.size / round.dots.length
  const progressPct = Math.min(100, Math.round(progress * 100))

  // Detect round completion via tracing progress
  useEffect(() => {
    if (roundDone) return
    if (progress >= REQUIRED_FRACTION) {
      setRoundDone(true)
      setMinuPose("celebrating")
      setStatusText(round.doneText)
      playFanfare()
    } else if (progress >= 0.5) {
      setMinuPose("clapping")
    } else if (progress >= 0.2) {
      setMinuPose("thinking")
    }
  }, [progress, roundDone, round.doneText])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (roundDone) return
      const svg = svgRef.current
      if (!svg) return

      // Use the SVG's own coordinate system — correctly handles
      // preserveAspectRatio letterboxing at any container size.
      const ctm = svg.getScreenCTM()
      if (!ctm) return
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const svgPt = pt.matrixTransform(ctm.inverse())
      const curX = svgPt.x
      const curY = svgPt.y

      const prev = prevPosRef.current
      prevPosRef.current = { x: curX, y: curY }

      setLitDots((prevDots) => {
        const next = new Set(prevDots)
        round.dots.forEach((dot, i) => {
          if (next.has(i)) return
          const dist = prev
            ? distToSegment(dot.x, dot.y, prev.x, prev.y, curX, curY)
            : Math.sqrt((dot.x - curX) ** 2 + (dot.y - curY) ** 2)
          if (dist <= TRACE_RADIUS) next.add(i)
        })
        return next.size !== prevDots.size ? next : prevDots
      })
    },
    [round.dots, roundDone],
  )

  const goNextRound = () => {
    playClick()
    prevPosRef.current = null
    if (roundIndex < ROUNDS.length - 1) {
      const next = roundIndex + 1
      setRoundIndex(next)
      setLitDots(new Set())
      setRoundDone(false)
      setMinuPose("pointing")
      setStatusText(ROUNDS[next].instruction)
      setHintVisible(false)
    } else {
      setPlayDone(true)
      setPhase("quiz")
    }
  }

  const resetRound = () => {
    playClick()
    prevPosRef.current = null
    setLitDots(new Set())
    setRoundDone(false)
    setMinuPose("pointing")
    setStatusText(round.instruction)
    setHintVisible(false)
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
        if (newScore >= 2) playFanfare()
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

  // ── Hub Phase (Watch / Play / Quiz landing) ────────────────────
  if (phase === "hub") {
    return (
      <LevelHub
        levelLabel="Level 3"
        title="Edge Detection"
        subtitle="Help Minu find the outlines hiding in a picture."
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
        levelLabel="Level 3"
        title="Edge Detection"
        videoSrc="https://drive.google.com/file/d/1uVuvy6kaT7F7Qc3T0j-lbreHT95j6bj1/preview"
        onNext={() => setPhase("activity")}
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-chart-3/15 to-transparent"
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
          <Star className="size-6 shrink-0 text-secondary drop-shadow-[0_0_8px_var(--chart-3)]" />
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
                  const isMissed =
                    quizSelected !== null && !isSelected && i === QUIZ_QUESTIONS[quizIndex].correct
                  return (
                    <button
                      key={i}
                      onClick={() => handleQuizAnswer(i)}
                      disabled={quizSelected !== null}
                      className={cn(
                        "rounded-2xl border-2 px-4 py-3 text-left font-heading text-sm font-bold transition-all",
                        quizSelected === null &&
                          "border-border hover:border-secondary/70 hover:bg-secondary/10",
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
              <MinuAvatar pose={quizScore >= 2 ? "celebrating" : "empathetic"} size={100} />
              <p className="font-heading text-xl font-extrabold text-foreground">
                {quizScore >= 2 ? "Awesome!" : "Keep trying!"} You scored {quizScore}/
                {QUIZ_QUESTIONS.length}!
              </p>
              {quizScore >= 2 ? (
                <Button
                  size="lg"
                  onClick={() => { playClick(); onComplete() }}
                  className="font-heading rounded-full px-8 font-extrabold"
                >
                  <CheckCircle2 className="size-5" /> Level Complete!
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={retryQuiz}
                    className="font-heading rounded-full px-6 font-extrabold"
                  >
                    <RotateCcw className="size-4" /> Try Again
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => { playClick(); setPhase("hub") }}
                    className="font-heading rounded-full px-6 font-extrabold"
                  >
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

  // ── Activity Phase ─────────────────────────────────────────────
  return (
    <main className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background">
      <Starfield count={80} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-chart-3/20 via-primary/5 to-transparent"
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
            Level 3 · Edge Detection
          </p>
          <h1 className="font-heading truncate text-base font-extrabold text-foreground sm:text-xl">
            {round.title}
          </h1>
        </div>
        <span className="font-heading shrink-0 rounded-full border border-primary/30 bg-card/80 px-2.5 py-1 text-xs font-bold text-primary shadow-sm sm:px-3 sm:text-sm">
          {roundIndex + 1}/{ROUNDS.length}
        </span>
      </header>

      {/* Main */}
      <div className="relative z-10 flex min-h-0 flex-1 gap-2 px-2 sm:gap-4 sm:px-4">

        {/* Left: Minu + status + controls */}
        <aside className="flex w-[36%] min-w-[118px] max-w-[280px] shrink-0 flex-col gap-2 sm:gap-2.5">
          <p className="font-heading text-center text-[10px] font-bold tracking-wider text-secondary uppercase sm:text-xs">
            <Star className="mb-0.5 inline size-3 fill-secondary text-secondary" /> Your Mission
          </p>

          {/* Minu avatar */}
          <div className="flex shrink-0 items-center justify-center py-1">
            <MinuAvatar pose={minuPose} size={64} className="hidden sm:block" />
            <MinuAvatar pose={minuPose} size={48} className="sm:hidden" />
          </div>

          {/* Status message */}
          <div
            className={cn(
              "rounded-2xl border-2 px-3 py-2.5 backdrop-blur-sm",
              roundDone
                ? "border-accent/50 bg-accent/10 shadow-[0_0_20px_oklch(0.78_0.2_150/25%)]"
                : "border-primary/35 bg-card/75 shadow-lg shadow-primary/15",
            )}
          >
            <p className="font-heading text-[11px] font-bold leading-snug text-foreground sm:text-sm">
              {statusText}
            </p>
          </div>

          {/* Progress bar */}
          <div className="shrink-0 rounded-2xl border border-border/50 bg-card/60 px-3 py-2">
            <p className="font-heading mb-1.5 text-center text-[10px] font-bold text-muted-foreground sm:text-xs">
              Traced: {progressPct}%
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${progressPct}%`, backgroundColor: round.color }}
              />
            </div>
          </div>

          {/* Hint + Reset buttons */}
          <div className="grid shrink-0 grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { playClick(); setHintVisible((h) => !h) }}
              className="font-heading h-9 gap-1 rounded-full border border-secondary/30 text-[10px] font-bold sm:h-10 sm:text-xs"
            >
              <Lightbulb className="size-3.5 text-secondary" />
              Hint
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetRound}
              className="font-heading h-9 gap-1 rounded-full text-[10px] font-bold sm:h-10 sm:text-xs"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>

          {/* Hint text — only visible when hint button pressed */}
          {hintVisible && (
            <p className="rounded-xl bg-secondary/10 px-2 py-2 text-[10px] font-bold leading-snug text-secondary sm:text-xs">
              {round.hint}
            </p>
          )}
        </aside>

        {/* Right: SVG tracing canvas */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-primary/25 bg-card/50 px-2 py-1.5 sm:px-3">
            <p className="font-heading text-[10px] font-bold text-foreground sm:text-xs">
              Move over the dots to trace the shape!
            </p>
          </div>

          {/* SVG canvas */}
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-primary/20 bg-card/40 p-2">
            <svg
              ref={svgRef}
              viewBox="0 0 200 200"
              className="h-full max-h-full w-full max-w-full touch-none select-none"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => { prevPosRef.current = null }}
            >
              {round.dots.map((dot, i) => {
                const lit = litDots.has(i)
                return (
                  <circle
                    key={i}
                    cx={dot.x}
                    cy={dot.y}
                    r={lit ? 6 : 4}
                    fill={lit ? round.color : "#4b5563"}
                    opacity={lit ? 1 : 0.35}
                    style={lit ? { filter: `drop-shadow(0 0 5px ${round.color})` } : undefined}
                    className="transition-all duration-100"
                  />
                )
              })}
            </svg>
          </div>

          {/* Next round / quiz button — only visible when round is done */}
          {roundDone && (
            <Button
              size="lg"
              onClick={goNextRound}
              className="font-heading h-11 shrink-0 rounded-full border-2 border-primary/40 text-sm font-extrabold shadow-lg shadow-primary/25 sm:h-12 sm:text-base"
            >
              <CheckCircle2 className="size-5" />
              {roundIndex < ROUNDS.length - 1 ? "Next Round →" : "Go to Quiz!"}
            </Button>
          )}
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
                  i === roundIndex
                    ? "w-8 bg-primary shadow-[0_0_8px_var(--primary)]"
                    : "w-4",
                  i < roundIndex ? "bg-accent" : i !== roundIndex ? "bg-muted" : "",
                )}
              />
              <span
                className={cn(
                  "font-heading hidden text-[9px] font-bold sm:block",
                  i === roundIndex ? "text-primary" : "text-muted-foreground",
                )}
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </main>
  )
}
