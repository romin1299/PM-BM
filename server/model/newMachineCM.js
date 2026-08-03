/**
 * SCHEMA: New Machine Commissioning (CM) Request Sheet
 *
 * PURPOSE: Document and track new machine installation, modification, and commissioning workflow
 *
 * WORKFLOW:
 * 1. PED (Production Engineering Dept) submits: scope, purpose, safety/quality requirements
 * 2. PED TL/HOS/HOD review and approve/reject
 * 3. MTD (Maintenance Tech Dept) reviews and assigns TL
 * 4. MTD TL manages jobs (parent/sub-jobs) with work details and spare parts
 * 5. Multiple approval levels (MTD_HOS, PED_HOS) verify completion
 * 6. Final confirmation and status tracking
 *
 * KEY DIFFERENCE FROM REGULAR CM:
 * - New machine installation (not corrective/preventive maintenance)
 * - Includes job/task structure with parent-child relationships
 * - Spare parts and modification tracking
 * - Multi-department approval chain (PED + MTD)
 */
const mongoose = require("mongoose");
const { userObj, approvalObj } = require("./common");

/**
 * REUSABLE WORK ENTRY FIELDS
 *
 * Used for both parent jobs and sub-jobs
 * Tracks work execution details, time, and responsible users
 */
const commonFields = {
  date: { type: String }, // Work execution date
  from: { type: String }, // Start time
  to: { type: String }, // End time
  time_taken: { type: Number }, // Duration in hours
  percentage: { type: Number, min: 0, max: 100, default: 0 }, // Completion %
  doneBy: [userObj], // Workers who completed task
  remarks: { type: String }, // Work notes/observations
  attachedPhotosByMTD: { type: [String] }, // Evidence photos
};

const newMachineSchema = new mongoose.Schema(
  {
    // ==================== METADATA ====================
    /**
     * Request sheet identifier (e.g., "NEW-CM-2025-001")
     * Auto-generated sequence number for tracking
     */
    requestSheetNoOfNewMachineCM: {
      type: String,
    },

    /**
     * Financial year and month timestamp for reporting/aggregation
     * Format: requestSheet_year = "2024-2025", requestSheet_month = "Dec"
     * Used for filtering and grouping requests by fiscal period
     */
    preAggregationTimeStampOfRequestSheet: {
      requestSheet_year: {
        type: String,
      },
      requestSheet_month: {
        type: String,
      },
    },

    // ==================== STAGE 1: PED SUBMISSION ====================
    /**
     * Production Engineering Department (PED) Initial Request
     *
     * What: Defines new machine/modification requirements
     * Who: PED engineer submits, PED TL/HOS/HOD review
     * Purpose: Captures what needs to be done and why
     */
    newMachineRequestFilledByPED: {
      scopeOfCM: {
        type: String,
      },
      requestOn: { type: String }, // Request submission date
      requiredOn: { type: String }, // Required completion date
      modificationWork: [
        {
          modificationConcept: { type: String }, // Description of modification
        },
      ],
      purposeOfCM: { type: String }, // Why this machine/modification
      riskAssessment: { type: String }, // Safety risks identified
      safetyRelated: { type: String }, // Safety implications (Yes/No)
      qualityRelated: { type: String }, // Quality impact (Yes/No)
      shiftOfNewCM: { type: String }, // Which shift to perform

      // ---- PED APPROVAL CHAIN ----
      preparedByPED_TL: userObj, // TL who prepared request
      checkedByPED_HOS: [
        // HOS review (can have comments/rejection)
        {
          ...userObj,
          ...approvalObj,
        },
      ],
      approvedByPED_HOD: [
        // Final PED approval (HOD)
        {
          ...userObj,
          ...approvalObj,
        },
      ],
    },

    // ==================== STAGE 2: MTD EXECUTION ====================
    /**
     * Maintenance Technical Department (MTD) Execution Phase
     *
     * What: Technical execution of PED's requirements
     * Who: MTD TL assigns work, assigns technicians, tracks progress
     * Activities: Jobs/tasks, spare parts, completion verification
     */
    filledByMTD_User: {
      // ---- MTD APPROVAL CHAIN ----
      /**
       * MTD HOS review of modification work plan (before execution)
       * Verifies feasibility, safety, resource allocation
       */
      modificationWork_ApprovedByMTD_HOS: [
        {
          ...userObj,
          ...approvalObj,
        },
      ],
      /**
       * MTD HOD final approval for modification execution
       */
      modificationWork_ApprovedByMTD_HOD: [
        {
          ...userObj,
          ...approvalObj,
        },
      ],
      /**
       * MTD TL who assigned the modification work
       * TL is responsible for coordinating technicians
       */
      modificationWork_AssignedMTD_TL: [userObj],

      // ---- JOB/TASK STRUCTURE ----
      /**
       * Hierarchical job structure for tracking work
       *
       * Format:
       * Parent Job (e.g., "Machine Installation")
       *   ├─ Sub-Job 1 (e.g., "Electrical connections")
       *   └─ Sub-Job 2 (e.g., "Hydraulic setup")
       *
       * Each has: date, time, completion %, photos, personnel
       * Allows fine-grained tracking of each task
       */
      job_details: {
        job_name: {
          type: String,
          trim: true,
        },
        job_content: [
          {
            parent_job_name: { type: String, trim: true }, // Main task
            expectedTime: { type: Number }, // Estimated hours
            ...commonFields, // Actual work details
            sub_job_content: [
              {
                child_job_name: { type: String, trim: true }, // Subtask
                ...commonFields, // Work tracking
              },
            ],
          },
        ],
      },

      // ---- SPARE PARTS TRACKING ----
      /**
       * Whether spare parts were used during modification
       * Yes/No flag for quick filtering of parts-replacement jobs
       */
      sparePartUsedOrNot: { type: String },
      /**
       * List of parts replaced/used
       * Tracks: part number, name, maker, quantity, cost
       * Used for inventory and financial reporting
       */
      changedParts: [
        {
          partNo: { type: String },
          partName: { type: String },
          makerName: { type: String },
          quantity: { type: Number },
          cost: { type: Number },
        },
      ],
    },

    // ==================== COMPLETION & STATUS ====================
    /**
     * Verification that modification meets PED requirements
     * Yes/No confirmation after execution complete
     */
    modificationConfirmationAfterCompletion: { type: String },
    /**
     * Additional notes/comments from MTD or final approvers
     * Documents any deviations, issues, or special circumstances
     */
    SpecialComments: { type: String },
    /**
     * Workflow status: "Generated" → "Under Review" → "Completed" → "Rejected"
     * Tracks progression through approval chain
     */
    statusOfNewRequestOfCM: { type: String },
    /**
     * Final flag: "Yes"/"No" - is work completely finished?
     * May differ from status (partial completion scenarios)
     */
    isJobFinished: { type: String },

    // ==================== APPROVAL SIGNATURES ====================
    /**
     * MTD TL prepared and verified - initial technical check
     */
    preparedAndCheckedByMTD_TL: [
      {
        ...userObj,
        ...approvalObj,
      },
    ],
    /**
     * MTD HOS approved - senior technical approval
     */
    approvedByMTD_HOS: [
      {
        ...userObj,
        ...approvalObj,
      },
    ],
    /**
     * PED TL checked technical execution - verifies work meets PED requirements
     */
    checkedByPED_TL: [
      {
        ...userObj,
        ...approvalObj,
      },
    ],
    /**
     * PED HOS final approval - official sign-off on completion
     */
    approvedByPED_HOS: [
      {
        ...userObj,
        ...approvalObj,
      },
    ],

    // ==================== APPROVAL DASHBOARD ====================
    /**
     * Pointer to current approver responsible for next action
     * Used to show pending approvals on approval dashboard
     * Example: {Id: user_id, departmentAndGradeOfUser: "MTD HOS"}
     */
    getDataForApprovalDashboard: {
      Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      departmentAndGradeOfUser: {
        type: String,
      },
    },

    /**
     * Rejection reasons when request is rejected
     * Array allows multiple rejection reasons across approval chain
     * Example: ["Insufficient safety measures", "Timeline unrealistic"]
     */
    rejectedRemarksOfRequestSheet: {
      type: [String],
    },

    // ==================== HIERARCHICAL REFERENCES ====================
    /**
     * Links to plant/line/cell/machine hierarchy
     * Enables location-based filtering and reporting
     * References to organizational structure
     */
    machineRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MachinesAllData",
    },
    lineRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lines",
    },
    cellRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cells",
    },
    subSectionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSections",
    },
    sectionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sections",
    },
    plantRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plants",
    },

    /**
     * Denormalized reference to complete hierarchy
     * Avoids multiple lookups for plant/line/machine details
     * Used in aggregation pipelines for quick data retrieval
     */
    plantToMachineHierarchyRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlantToMachineHierarchy",
    },
  },
  { timestamps: true } // Auto adds createdAt, updatedAt
);

/**
 * ========== NEW MACHINE REQUEST SHEET MODEL ==========
 *
 * Mongoose model for new machine/modification requests
 * Collection: "newMachineRequestSheet" (MongoDB)
 *
 * Workflow Process:
 * 1. PED creates request (scope, risk, required date)
 * 2. PED approves through chain (TL → HOS → HOD)
 * 3. MTD executes work (assign TL, jobs, spare parts)
 * 4. MTD completes and approves (TL → HOS)
 * 5. PED verifies completion (TL → HOS final sign-off)
 *
 * Key Differences from Regular CM (Corrective Maintenance):
 * - Multi-department workflow (PED + MTD, not just MTD)
 * - Modification-driven vs fix-driven
 * - Safety/quality risk assessment upfront
 * - Hierarchical job structure for complex installations
 *
 * Use Cases:
 * - New machine installations
 * - Major equipment modifications
 * - Production line upgrades
 * - Safety/quality enhancement projects
 */
const NewMachineRequestSheetOfCM = new mongoose.model(
  "newMachineRequestSheet",
  newMachineSchema
);
module.exports = NewMachineRequestSheetOfCM;
