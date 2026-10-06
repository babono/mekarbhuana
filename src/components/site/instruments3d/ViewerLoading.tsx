/** Kept out of InstrumentViewer so showing it does not pull in three.js. */
export function ViewerLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="font-label text-[10px] tracking-[0.2em] text-smoke uppercase">
        Loading model…
      </span>
    </div>
  )
}
