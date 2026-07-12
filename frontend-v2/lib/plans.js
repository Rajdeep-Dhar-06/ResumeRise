// The shape of a single interview plan (for reference — no TypeScript here).
// When you hook up your real database later, make sure your backend
// returns objects that look like this:
//   { id, title, generatedOn, matchScore }

// Sample plans used for the UI mockup.
// Later you can replace this with data fetched from your backend/db.
export const samplePlans = [
  {
    id: '1',
    title: 'Network Fabric Test Engineer Preparation Roadmap',
    generatedOn: '28/6/2026',
    matchScore: 52,
  },
  {
    id: '2',
    title: 'Software Engineering Internship Preparation Roadmap',
    generatedOn: '28/6/2026',
    matchScore: 68,
  },
  {
    id: '3',
    title: 'Frontend Developer Preparation Roadmap',
    generatedOn: '26/6/2026',
    matchScore: 80,
  },
  {
    id: '4',
    title: 'Preparation Roadmap for Network Fabric Role',
    generatedOn: '24/6/2026',
    matchScore: 54,
  },
  {
    id: '5',
    title: 'Backend Engineer Preparation Roadmap',
    generatedOn: '22/6/2026',
    matchScore: 72,
  },
  {
    id: '6',
    title: 'Product Designer Preparation Roadmap',
    generatedOn: '20/6/2026',
    matchScore: 88,
  },
]

// Decides the color tier for a match score. Returns className overrides
// for the shadcn <Badge> (background + text), since Badge has no
// built-in success/warning variant.
export function matchScoreColor(score) {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-400'
  if (score >= 60) return 'bg-amber-500/15 text-amber-400'
  return 'bg-red-500/15 text-red-400'
}
