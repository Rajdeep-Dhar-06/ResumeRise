import { useState } from 'react'
import { Briefcase, FileText, Sparkles, Upload, X, Info } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShadcnSelect } from './ShadcnSelect.jsx'

export function CreatePlan({
  jobDescriptionUrl,
  setJobDescriptionUrl,
  fileName,
  resumeInputRef,
  handleFileChange,
  handleGenerateReport,
  loading,
  handleClearFile,
  daysLimit,
  setDaysLimit,
  hasFile,
}) {
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (file) {
      handleFileChange({ target: { files: [file] } })
    }
  }

  // Determine if strategy button is disabled
  const hasUrl = jobDescriptionUrl && jobDescriptionUrl.trim().length > 0;
  const isSubmitDisabled = !hasUrl || !hasFile || loading;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-8 md:gap-x-0 md:grid-cols-2 md:divide-x md:divide-border">
          {/* Left: target job details */}
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

          {/* Right: resume upload */}
          <div className="flex flex-col justify-between gap-4 md:pl-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <h3 className="text-base font-semibold">Your Profile</h3>
                </div>
                <Badge variant={hasFile ? "default" : "destructive"}>
                  {hasFile ? "Ready" : "Required"}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  <Upload className="size-4" /> Upload Resume PDF
                </Label>

                {/* Hidden native file input */}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(e) => handleFile(e.dataTransfer?.files?.[0] || e.target.files?.[0])}
                  disabled={loading}
                />

                {fileName ? (
                  // Selected state: show the file name with a remove button
                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 h-[88px]">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="size-5 shrink-0 text-primary" />
                      <span className="truncate text-sm font-medium">{fileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearFile}
                      aria-label="Remove file"
                      disabled={loading}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  // Empty state: clickable + drag-and-drop area
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !loading && resumeInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (!loading && (e.key === 'Enter' || e.key === ' ')) {
                        resumeInputRef.current?.click()
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (!loading) setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragging(false)
                      if (!loading) handleFile(e.dataTransfer.files?.[0])
                    }}
                    className={`cursor-pointer rounded-lg border border-dashed text-center transition-all h-[88px] flex items-center justify-center ${dragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/60 hover:bg-accent/20'
                      }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="size-5 text-muted-foreground mb-1" />
                      <h4 className="text-xs font-medium">Click to browse or drag &amp; drop PDF</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PDF format only (Max 3MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Resume required</AlertTitle>
              <AlertDescription>Your custom roadmap will be generated based on this resume.</AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Dynamic target days selector */}
        <div className="mt-6 pt-5 border-t border-border flex flex-col gap-2 max-w-xs mx-auto">
          <Label htmlFor="days-limit" className="font-semibold text-center sm:text-left">Target Preparation Duration</Label>
          <ShadcnSelect
            value={daysLimit}
            onChange={setDaysLimit}
            disabled={loading}
            options={[
              { value: 7, label: "7 Days (Comprehensive)" },
              { value: 5, label: "5 Days (Standard)" },
              { value: 3, label: "3 Days (Crash Course)" },
            ]}
          />
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
