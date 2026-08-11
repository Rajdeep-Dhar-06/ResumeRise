import 'dotenv/config';
import mongoose from 'mongoose';
import { runInterviewReportPipeline } from './src/pipeline/report_pipeline.js';

async function run() {
  try {
    // Need to use MONGO_URI
    await mongoose.connect(process.env.MONGO_URI);
    const state = await runInterviewReportPipeline({
      userId: new mongoose.Types.ObjectId(),
      resumeBuffer: Buffer.from('test pdf content'),
      jobDescriptionUrl: 'https://www.amazon.jobs/en-gb/jobs/10488368/sde-i-intern-amazon-university-talent-acquisition',
      daysLimit: 7,
    });
    console.log("Success:", !!state.savedReport);
  } catch (e) {
    console.error("PIPELINE ERROR:", e);
    console.error(e.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
run();
