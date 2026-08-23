import { useState } from 'react'
import { Briefcase, FileText, Sparkles, Upload, X, Info } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CreatePlan({
  jobDescriptionUrl,
  setJobDescriptionUrl,
  candidateProfile,
  setCandidateProfile,
  handleGenerateReport,
  loading,
  daysLimit,
  setDaysLimit,
}) {
  const hasProfile = candidateProfile && candidateProfile.trim().length > 50;

  // Determine if strategy button is disabled
  const hasUrl = jobDescriptionUrl && jobDescriptionUrl.trim().length > 0;
  const isSubmitDisabled = !hasUrl || !hasProfile || loading;

  // ================= MAIN CARD CONTAINER =================
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-8 md:gap-x-0 md:grid-cols-2 md:divide-x md:divide-border">
          {/* ================= LEFT COLUMN: JOB URL ================= */}
          <div className="flex flex-col justify-between gap-4 md:pr-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-5 text-primary" />
                  <h3 className="text-base font-semibold">Target Job Details</h3>
                </div>
                <Badge variant={hasUrl ? "default" : "destructive"}>
                  {hasUrl ? "Ready" : "Required"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="job-url">Job posting URL</Label>
                <div className="relative w-full">
                  <Input
                    id="job-url"
                    type="url"
                    value={jobDescriptionUrl}
                    onChange={(e) => setJobDescriptionUrl(e.target.value)}
                    placeholder="Paste job posting URL (e.g. LinkedIn, Indeed, Lever)..."
                    disabled={loading}
                    autoComplete="off"
                    className="h-10 pr-10"
                  />
                  {jobDescriptionUrl && !loading && (
                    <button
                      type="button"
                      onClick={() => setJobDescriptionUrl("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Job Description required</AlertTitle>
              <AlertDescription>
                ResumeRise will scrape and map the job skills automatically behind the scenes!
              </AlertDescription>
            </Alert>
          </div>

          {/* ================= RIGHT COLUMN: CANDIDATE PROFILE ================= */}
          <div className="flex flex-col justify-between gap-4 md:pl-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <h3 className="text-base font-semibold">Your Profile</h3>
                </div>
                <Badge variant={hasProfile ? "default" : "destructive"}>
                  {hasProfile ? "Ready" : "Required"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="candidate-profile">Career Transcript / Summary</Label>
                <textarea
                  id="candidate-profile"
                  value={candidateProfile}
                  onChange={(e) => setCandidateProfile(e.target.value)}
                  disabled={loading}
                  placeholder="Paste your resume text, LinkedIn about section, or a detailed career summary here..."
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Descriptive text required</AlertTitle>
              <AlertDescription>Your custom roadmap will be generated based on the experience detailed above.</AlertDescription>
            </Alert>
          </div>
        </div>

        {/* ================= BOTTOM BAR: DAYS SELECTOR ================= */}
        <div className="mt-6 pt-5 border-t border-border flex flex-col gap-2 max-w-xs mx-auto">
          <Label htmlFor="days-limit" className="font-semibold text-center sm:text-left">Target Preparation Duration</Label>
          <Select
            value={String(daysLimit)}
            onValueChange={(val) => setDaysLimit(Number(val))}
            disabled={loading}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days (Comprehensive)</SelectItem>
              <SelectItem value="5">5 Days (Standard)</SelectItem>
              <SelectItem value="3">3 Days (Crash Course)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            The AI will customize the preparation tasks to fit your window.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-end gap-4">
        <Button
          onClick={handleGenerateReport}
          className="w-full sm:w-auto"
          disabled={isSubmitDisabled}
        >
          <Sparkles className="size-4 mr-2" />
          Generate My Interview Strategy
        </Button>
      </CardFooter>
    </Card>
  )
}
