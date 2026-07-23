export function matchScoreColor(score) {
  if (score >= 90) return 'bg-violet-500/15 text-violet-400 border border-violet-500/30';
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  if (score >= 60) return 'bg-teal-500/15 text-teal-400 border border-teal-500/30';
  if (score >= 45) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  if (score >= 30) return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
  return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
}

