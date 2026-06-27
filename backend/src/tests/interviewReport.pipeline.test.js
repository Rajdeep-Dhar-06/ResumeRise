import { test, mock } from 'node:test';
import assert from 'node:assert';

// Import pipeline functions
import {
  runInterviewReportPipeline,
  parseAndSaveResumeStep,
  fetchOrScrapeJobDescriptionStep,
  generateAiAnalysisStep,
  saveInterviewReportStep
} from '../pipelines/interviewReport.pipeline.js';

// Import dependencies to mock
import InterviewReportModel from '../models/interviewReport.model.js';
import JobDescriptionModel from '../models/jobDescription.model.js';
import resumeModel from '../models/resume.model.js';

test('1. Pipeline Runner - Context Passing & Execution Order', async () => {
  // Define dummy mock steps
  const stepA = async (ctx) => {
    ctx.stageA = 'A_completed';
    return ctx;
  };

  const stepB = async (ctx) => {
    ctx.stageB = ctx.stageA + '_and_B_completed';
    return ctx;
  };

  const initialContext = { inputVal: 'hello' };
  
  // Run pipeline using the dummy steps
  const finalContext = await runInterviewReportPipeline(initialContext, [stepA, stepB]);

  // Assertions
  assert.strictEqual(finalContext.inputVal, 'hello');
  assert.strictEqual(finalContext.stageA, 'A_completed');
  assert.strictEqual(finalContext.stageB, 'A_completed_and_B_completed');
});

test('2. Pipeline Runner - Error Handling per Step', async () => {
  const goodStep = async (ctx) => {
    ctx.ok = true;
    return ctx;
  };

  const badStep = async () => {
    throw new Error('Something went wrong in Step 2');
  };

  const initialContext = {};

  // Running the pipeline should throw a formatted error detailing the failed step
  await assert.rejects(
    async () => {
      await runInterviewReportPipeline(initialContext, [goodStep, badStep]);
    },
    (err) => {
      assert.match(err.message, /Pipeline failed at step \[badStep\]/);
      assert.strictEqual(err.stepName, 'badStep');
      return true;
    }
  );
});

test('3. Step Isolation - parseAndSaveResumeStep with empty buffer', async () => {
  const context = { resumeFileBuffer: null };
  const updatedContext = await parseAndSaveResumeStep(context);

  assert.strictEqual(updatedContext.resumeText, '');
  assert.strictEqual(updatedContext.resumeId, null);
});

test('4. Step Isolation - parseAndSaveResumeStep with existing resume', async (t) => {
  // Mock the mongoose resumeModel.findOne method
  const mockFindOne = mock.method(resumeModel, 'findOne', async () => {
    return { _id: 'resume_123', rawText: 'Existing Resume Text' };
  });

  t.after(() => {
    mockFindOne.mock.restore();
  });

  const context = {
    userId: 'user_123',
    resumeFileBuffer: Buffer.from('pdf data'),
    resumeFileName: 'my-resume.pdf'
  };

  const updatedContext = await parseAndSaveResumeStep(context);

  assert.strictEqual(updatedContext.resumeId, 'resume_123');
  assert.strictEqual(updatedContext.resumeText, 'Existing Resume Text');
  assert.strictEqual(mockFindOne.mock.calls.length, 1);
});

test('5. Step Isolation - fetchOrScrapeJobDescriptionStep with existing job description', async (t) => {
  // Mock the mongoose JobDescriptionModel.findOne method
  const mockFindOne = mock.method(JobDescriptionModel, 'findOne', async () => {
    return {
      _id: 'job_456',
      rawText: 'React Developer Needed',
      skills: [{ term: 'React', priority: 'REQUIRED' }],
      requirements: [{ term: '5 years experience', priority: 'REQUIRED' }]
    };
  });

  t.after(() => {
    mockFindOne.mock.restore();
  });

  const context = {
    jobDescriptionUrl: 'https://example.com/jobs/react-dev'
  };

  const updatedContext = await fetchOrScrapeJobDescriptionStep(context);

  assert.strictEqual(updatedContext.jobDescriptionId, 'job_456');
  assert.strictEqual(updatedContext.jobDescriptionText, 'React Developer Needed');
  assert.deepStrictEqual(updatedContext.jobDescriptionSkills, [{ term: 'React', priority: 'REQUIRED' }]);
  assert.strictEqual(mockFindOne.mock.calls.length, 1);
});

test('6. Step Isolation - saveInterviewReportStep saves correct ObjectId references', async (t) => {
  // Mock the mongoose InterviewReportModel.create method
  const mockCreate = mock.method(InterviewReportModel, 'create', async (data) => {
    assert.strictEqual(data.user, 'user_123');
    assert.strictEqual(data.jobDescription, 'job_456');
    assert.strictEqual(data.resume, 'resume_123');
    assert.strictEqual(data.matchScore, 85);
    return { _id: 'report_789', ...data };
  });

  t.after(() => {
    mockCreate.mock.restore();
  });

  const context = {
    userId: 'user_123',
    jobDescriptionId: 'job_456',
    resumeId: 'resume_123',
    matchedSkills: [],
    matchedRequirements: [],
    aiReport: {
      title: 'Interview Prep Roadmap',
      matchScore: 85,
      technicalQuestions: [],
      behavioralQuestions: [],
      skillGaps: [],
      preparationPlan: []
    }
  };

  const updatedContext = await saveInterviewReportStep(context);

  assert.ok(updatedContext.savedReport);
  assert.strictEqual(updatedContext.savedReport._id, 'report_789');
  assert.strictEqual(mockCreate.mock.calls.length, 1);
});
