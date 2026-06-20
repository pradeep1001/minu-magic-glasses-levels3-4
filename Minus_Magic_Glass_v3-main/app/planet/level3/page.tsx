import Link from "next/link"

export default function Level3Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
      <h1 className="text-3xl font-bold">Level 3 - Edge Detection</h1>
      <p>Help Minu find the outlines hiding in a picture.</p>

      {/* Watch, Learn, Quiz buttons */}
      <div className="flex gap-4 mt-8">
        <Link href="/planet/level3/watch" className="btn btn-primary">Watch</Link>
        <Link href="/planet/level3/learn" className="btn btn-secondary">Learn</Link>
        <Link href="/planet/level3/quiz" className="btn btn-accent">Quiz</Link>
      </div>

      {/* Existing Mark Calibrated button */}
      <div className="mt-8">
        <button className="btn btn-outline">Mark Calibrated</button>
      </div>
    </main>
  )
}
