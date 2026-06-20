"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { playClick, playError } from "@/lib/audio"
import type { QuizQuestion } from "@/lib/level-data"
import { cn } from "@/lib/utils"

type LevelQuizProps = {
  questions: QuizQuestion[]
  /** When true, failure calls onFail and the parent handles reset (no internal retry button). */
  retryOnlyOnFail?: boolean
  /** Tighter spacing for embedded layouts. */
  compact?: boolean
  /** Correct answers needed to pass — defaults to 80% rounded up. */
  passCount?: number
  onComplete: () => void
  onBack: () => void
  onFail?: () => void
}

export function LevelQuiz({
  questions,
  retryOnlyOnFail = false,
  compact = false,
  passCount,
  onComplete,
  onBack,
  onFail,
}: LevelQuizProps) {
  const required = passCount ?? Math.ceil(questions.length * 0.8)

  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)
  const [passed, setPassed] = useState(false)

  const question = questions[qIndex]

  const handleSelect = (i: number) => {
    if (selected !== null) return
    playClick()

    let correct = false
    if (question.type === "visual_choice") {
      correct = question.options[i].correct
    }

    setSelected(i)
    setIsCorrect(correct)
    if (!correct) playError()

    const newScore = correct ? score + 1 : score
    if (correct) setScore(newScore)

    setTimeout(() => {
      const next = qIndex + 1
      if (next < questions.length) {
        setQIndex(next)
        setSelected(null)
        setIsCorrect(null)
      } else {
        const didPass = newScore >= required
        setPassed(didPass)
        setDone(true)
        if (!didPass) setTimeout(() => onFail?.(), 800)
      }
    }, 900)
  }

  if (done) {
    return (
      <div className={cn("flex flex-col items-center gap-4 text-center", compact && "gap-3")}>
        {passed ? (
          <>
            <CheckCircle2 className={cn("text-accent", compact ? "size-10" : "size-14")} />
            <p className={cn("font-heading font-extrabold text-foreground", compact ? "text-base" : "text-xl")}>
              {score}/{questions.length} correct — Amazing!
            </p>
            <Button
              size={compact ? "default" : "lg"}
              onClick={() => { playClick(); onComplete() }}
              className="font-heading rounded-full px-8 font-extrabold"
            >
              <CheckCircle2 className="size-5" /> Continue!
            </Button>
          </>
        ) : (
          <>
            <XCircle className={cn("text-destructive", compact ? "size-10" : "size-14")} />
            <p className={cn("font-heading font-extrabold text-foreground", compact ? "text-base" : "text-xl")}>
              {score}/{questions.length} correct — Let&apos;s try again!
            </p>
            {!retryOnlyOnFail && (
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size={compact ? "default" : "lg"}
                  onClick={() => { playClick(); onFail?.() }}
                  className="font-heading rounded-full px-6 font-extrabold"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size={compact ? "default" : "lg"}
                  onClick={() => { playClick(); onBack() }}
                  className="font-heading rounded-full px-6 font-extrabold"
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  if (question.type === "visual_choice") {
    return (
      <div className={cn("flex flex-col gap-4", compact && "gap-2")}>
        <p className={cn("font-heading text-center font-bold text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          Question {qIndex + 1} of {questions.length}
        </p>
        <p className={cn("font-heading text-center font-extrabold text-foreground", compact ? "text-sm" : "text-base sm:text-lg")}>
          {question.question}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((opt, i) => {
            const isSelected = selected === i
            const showRight = isSelected && isCorrect === true
            const showWrong = isSelected && isCorrect === false
            const isMissed = selected !== null && !isSelected && opt.correct
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-all",
                  selected === null && "border-border hover:border-secondary/70 hover:bg-secondary/10",
                  showRight && "border-accent bg-accent/15",
                  showWrong && "border-destructive bg-destructive/15",
                  isMissed && "border-accent/50 bg-accent/5",
                )}
              >
                {opt.imageSrc && (
                  <Image
                    src={opt.imageSrc}
                    alt={opt.label}
                    width={128}
                    height={128}
                    className={cn("object-contain", compact ? "max-h-14" : "max-h-20")}
                  />
                )}
                <span className={cn("font-heading font-bold", compact ? "text-[10px]" : "text-xs")}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
