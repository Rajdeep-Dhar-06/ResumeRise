'use client'

import { useRef, useState } from 'react'
import { Briefcase, FileText, Info, Sparkles, Upload, X } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldLabel } from '@/components/ui/field'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

export function CreatePlan() {
  const [jobUrl, setJobUrl] = useState('')
  const [fileName, setFileName] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  function handleFile(file) {
    if (file) setFileName(file.name)
  }

  return (
    <Card>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2 md:divide-x">
          {/* Left: target job details */}
          <div className="flex flex-col gap-4 md:pr-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                <h3 className="text-base font-semibold">Target Job Details</h3>
              </div>
              <Badge variant="destructive">Required</Badge>
            </div>

            <Field>
              <FieldLabel htmlFor="job-url">Job posting URL</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="job-url"
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Paste job posting URL (e.g. LinkedIn, Indeed)..."
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton variant="default">Fetch</InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Alert>
              <Info />
              <AlertDescription>Paste a job URL above and click Fetch to get started.</AlertDescription>
            </Alert>
          </div>

          {/* Right: resume upload */}
          <div className="flex flex-col gap-4 md:pl-8">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <h3 className="text-base font-semibold">Your Profile</h3>
            </div>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Upload className="size-4" /> Upload Resume PDF
              </FieldLabel>

              {/* Hidden native file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {fileName ? (
                // Selected state: show the file name with a remove button
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="size-5 shrink-0 text-primary" />
                    <span className="truncate text-sm">{fileName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFileName(null)}
                    aria-label="Remove file"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                // Empty state: clickable + drag-and-drop area
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    handleFile(e.dataTransfer.files?.[0])
                  }}
                  className={
                    dragging
                      ? 'cursor-pointer rounded-lg border border-dashed border-primary bg-primary/5'
                      : 'cursor-pointer rounded-lg border border-dashed hover:border-primary/60'
                  }
                >
                  <Empty className="py-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileText />
                      </EmptyMedia>
                      <EmptyTitle>Click to browse or drag &amp; drop</EmptyTitle>
                      <EmptyDescription>PDF format only (Max 3MB)</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )}
            </Field>

            <Alert>
              <Info />
              <AlertTitle>Resume required</AlertTitle>
              <AlertDescription>A resume is required to generate a personalized plan.</AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">AI-Powered Strategy Generation</p>
        <Button className="w-full sm:w-auto">
          <Sparkles data-icon="inline-start" />
          Generate My Interview Strategy
        </Button>
      </CardFooter>
    </Card>
  )
}
