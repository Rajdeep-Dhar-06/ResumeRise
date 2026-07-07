export function matchScoreColor(score) {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-400'
  if (score >= 60) return 'bg-amber-500/15 text-amber-400'
  return 'bg-red-500/15 text-red-400'
}
