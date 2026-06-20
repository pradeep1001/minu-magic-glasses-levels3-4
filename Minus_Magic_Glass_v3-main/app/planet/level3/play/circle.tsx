"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CircleRound() {
  const [traced, setTraced] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const router = useRouter()

  const handleTrace = () => setTraced(true)

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
      <h1 className="text-3xl font-bold mb-4">Round 1 – Circle</h1>
      <p>Trace over the dots to complete the circle!</p>

      {/* SVG circle with dots */}
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="mt-8"
        onMouseMove={handleTrace}
        onTouchMove={handleTrace}
      >
        {[...Array(20)].map((_, i) => {
          const angle = (i / 20) * 2 * Math.PI
          const x = 100 + 80 * Math.cos(angle)
          const y = 100 + 80 * Math.sin(angle)
          return <circle key={i} cx={x} cy={y} r="4" fill="#a78bfa" />
        })}
      </svg>

      {traced && (
        <>
          <p className="mt-6 text-green-400 font-semibold">
            ✅ Circle completed! Great job!
          </p>
          <button
            onClick={() => router.push("/planet/level3/play/square")}
            className="btn btn-primary mt-4"
          >
            Next Round →
          </button>
        </>
      )}

      {/* Hint button */}
      <div className="mt-6">
        <button onClick={() => setShowHint(!showHint)} className="btn btn-outline">
          Show Hint
        </button>
        {showHint && (
          <p className="mt-2 text-sm text-purple-300">
            Hint: Move your cursor along the dotted outline to trace the circle.
          </p>
        )}
      </div>
    </main>
  )
}
