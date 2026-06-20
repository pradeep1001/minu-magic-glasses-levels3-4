"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SquareRound() {
  const [traced, setTraced] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const router = useRouter()

  const handleTrace = () => setTraced(true)

  // Generate dots along the square edges
  const dots = []
  const size = 160
  const step = 20
  for (let i = 0; i <= size; i += step) {
    // Top edge
    dots.push({ x: 20 + i, y: 20 })
    // Bottom edge
    dots.push({ x: 20 + i, y: 180 })
    // Left edge
    dots.push({ x: 20, y: 20 + i })
    // Right edge
    dots.push({ x: 180, y: 20 + i })
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
      <h1 className="text-3xl font-bold mb-4">Round 2 – Square</h1>
      <p>Trace over the dots to complete the square!</p>

      {/* SVG square with dots */}
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="mt-8"
        onMouseMove={handleTrace}
        onTouchMove={handleTrace}
      >
        {dots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r="4" fill="#34d399" />
        ))}
      </svg>

      {traced && (
        <>
          <p className="mt-6 text-green-400 font-semibold">
            ✅ Square completed! Well done!
          </p>
          <button
            onClick={() => router.push("/planet/level3/play/rhombus")}
            className="btn btn-primary mt-4"
          >
            Next Round →
          </button>
        </>
      )}

      {/* Hint button */}
      <div className="mt-6">
        <button
          onClick={() => setShowHint(!showHint)}
          className="btn btn-outline"
        >
          Show Hint
        </button>
        {showHint && (
          <p className="mt-2 text-sm text-green-300">
            Hint: Move along each side of the square to connect the dots.
          </p>
        )}
      </div>
    </main>
  )
}
