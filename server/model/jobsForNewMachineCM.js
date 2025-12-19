const mongoose = require("mongoose");

const dynamicJobsForNewMachineCMSchema = mongoose.Schema(
  {
    job_name: {
      type: String,
      required: true,
      trim: true,
    },
    job_content: [
      {
        parent_job_name: { type: String, required: true, trim: true },
        expectedTime: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

const Jobs = new mongoose.model("Jobs", dynamicJobsForNewMachineCMSchema);
module.exports = Jobs;
