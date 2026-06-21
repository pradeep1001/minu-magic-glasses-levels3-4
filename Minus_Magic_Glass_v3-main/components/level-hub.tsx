"use client"

import { ArrowLeft, Lock, PlayCircle, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MinuAvatar } from "@/components/minu-avatar"
import { Starfield } from "@/components/starfield"
import { playClick } from "@/lib/audio"
import { cn } from "@/lib/utils"

// ─── Level Hub (Watch / Play / Quiz landing) ──────────────────
// Faithful re-creation of the provided mockup, wired into the
// app's live state flow (no App Router pages). Shown when a
// planet is clicked, before the Play activity.

type LevelHubProps = {
  /** e.g. "Level 4" */
  levelLabel: string
  /** e.g. "Feature Recognition" */
  title: string
  /** One-line description under the title */
  subtitle: string
  /** Quiz stays locked until the Play activity is finished */
  quizUnlocked: boolean
  onWatch: () => void
  onPlay: () => void
  onQuiz: () => void
  onBack: () => void
}

export function LevelHub({
  levelLabel,
  title,
  subtitle,
  quizUnlocked,
  onWatch,
  onPlay,
  onQuiz,
  onBack,
}: LevelHubProps) {
  const buttons = [
    { emoji: "🎥", label: "Watch", onClick: onWatch, locked: false },
    { emoji: "📚", label: "Play", onClick: onPlay, locked: false },
    { emoji: "🧠", label: "Quiz", onClick: onQuiz, locked: !quizUnlocked },
  ]

  return (
    <main className="relative flex h-dvh max-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background px-4">
      <Starfield count={90} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(34,12,64,.45) 0, rgba(8,5,21,.25) 25%, transparent 55%)",
        }}
      />

      {/* Back button */}
      <header className="absolute left-0 top-0 z-20 px-4 py-4 sm:px-5 sm:py-5">
        <Button
          size="icon"
          variant="secondary"
          className="size-10 rounded-full border border-primary/25"
          aria-label="Back to map"
          onClick={() => { playClick(); onBack() }}
        >
          <ArrowLeft className="size-5" />
        </Button>
      </header>

      {/* Content */}
      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <MinuAvatar pose="idle" size={132} className="mb-5 sm:mb-8" />

        {/* Level pill */}
        <span
          className="font-heading mb-4 inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-extrabold"
          style={{ background: "rgba(84,35,134,.72)", color: "#ff4dff" }}
        >
          {levelLabel}
        </span>

        {/* Title */}
        <h1
          className="font-heading text-3xl font-extrabold text-white sm:text-4xl"
          style={{ textShadow: "0 3px 0 rgba(255,255,255,.18), 0 6px 12px rgba(0,0,0,.55)" }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-md text-base font-bold text-[#d9d5e5] sm:text-lg">
          {subtitle}
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:gap-5">
          {buttons.map((b) => (
            <button
              key={b.label}
              onClick={() => { if (b.locked) return; playClick(); b.onClick() }}
              disabled={b.locked}
              className={cn(
                "font-heading flex h-11 w-40 items-center justify-center gap-2 rounded-full text-lg font-extrabold text-white transition-all sm:w-[150px]",
                b.locked
                  ? "cursor-not-allowed border border-border/60 bg-muted/40 text-muted-foreground"
                  : "hover:scale-[1.04] active:scale-95",
              )}
              style={
                b.locked
                  ? undefined
                  : {
                      background: "linear-gradient(180deg,#a737ff 0%,#8d2df4 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,.22), 0 5px 16px rgba(113,25,238,.28)",
                    }
              }
            >
              {b.locked ? <Lock className="size-4" /> : <span className="text-[15px]">{b.emoji}</span>}
              <span>{b.label}</span>
            </button>
          ))}
        </div>

        {!quizUnlocked && (
          <p className="font-heading mt-4 text-xs font-bold text-muted-foreground">
            🔒 Finish <span className="text-secondary">Play</span> to unlock the Quiz
          </p>
        )}
      </section>
    </main>
  )
}

// ─── Watch screen (video placeholder) ─────────────────────────

type LevelWatchProps = {
  levelLabel: string
  title: string
  /** Google Drive or any embeddable video URL */
  videoSrc?: string
  /** Lands on the Play activity */
  onNext: () => void
  /** Returns to the hub */
  onBack: () => void
}

export function LevelWatch({ levelLabel, title, videoSrc, onNext, onBack }: LevelWatchProps) {
  return (
    <main className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background">
      <Starfield count={70} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-chart-4/15 to-transparent"
      />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-primary/20 px-4 py-3 sm:px-6">
        <Button
          size="icon"
          variant="secondary"
          className="size-10 shrink-0 rounded-full border border-primary/25"
          aria-label="Back to menu"
          onClick={() => { playClick(); onBack() }}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-heading flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-secondary uppercase sm:text-xs">
            <Video className="size-3.5" /> {levelLabel} · Watch
          </p>
          <h1 className="font-heading truncate text-lg font-extrabold text-foreground sm:text-xl">
            {title}
          </h1>
        </div>
      </header>

      {/* Video placeholder */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-center gap-5 px-4 py-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-primary/30 bg-card/50 shadow-lg shadow-primary/15">
          {videoSrc ? (
            <iframe
              src={videoSrc}
              className="absolute inset-0 h-full w-full"
              allow="autoplay"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <PlayCircle className="size-16 text-primary/70 drop-shadow-[0_0_12px_var(--primary)] sm:size-20" />
              <p className="font-heading text-sm font-bold text-muted-foreground sm:text-base">
                Video coming soon
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-center">
          <Button
            size="lg"
            onClick={() => { playClick(); onNext() }}
            className="font-heading h-12 rounded-full px-10 text-base font-extrabold shadow-lg shadow-primary/25"
          >
            Next →
          </Button>
        </div>
      </div>
    </main>
  )
}
