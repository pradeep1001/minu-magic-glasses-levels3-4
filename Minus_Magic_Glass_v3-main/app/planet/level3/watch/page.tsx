export default function WatchPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Level 3 – Watch</h1>
      <video
        src="/Intro.mp4"
        controls
        width="640"
        height="360"
        className="rounded-lg shadow-lg"
      />
    </main>
  )
}
