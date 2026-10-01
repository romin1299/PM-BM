/**
 * SCHEMA: Machine Modification Work Request / Report (CM)
 *
 * Mirrors the controlled form FO/MTD/17/01/05, section for section, so a
 * stored sheet and the printed one hold the same fields in the same order:
 *
 *   1. Requested department fills the request — scope, concept, background,
 *      current vs proposed, purpose, the three Yes/No declarations — and names
 *      its HOD (approves), HOS (checks) and TL (prepares).
 *   2. MTD approves the work: HOSS, HOS, HOD.
 *   3. MTD reports the work done — started/ended, who attended, description,
 *      and the parts used.
 *   4. Both departments close the sheet: the requester confirms completion and
 *      signs off (HOS approves, TL checks), MTD signs off (HOD approves, HOS
 *      checks, TL prepares).
 *
 * The three stages are separately editable, which is why each keeps its own
 * block rather than the fields being flattened.
 */
const mongoose = require("mongoose");
const { userObj, approvalObj } = require("./common");

/** A signature box on the form: who was named, and what they decided. */
const signatureObj = [
  {
    ...userObj,
    ...approvalObj,
  },
];

/** The form's Yes / No declarations, which carry a detail sheet when Yes. */
const yesNo = { type: String, enum: ["Yes", "No"] };

/** Shifts the plant runs; the form prints them as "A  B  C  G". */
const SHIFTS = ["A", "B", "C", "G"];

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
      scopeOfCM: { type: String }, // "Scope:" band at the head of the form

      /**
       * REQUEST ON / REQUIRED ON. The form prints a date and a time box for
       * each; both are captured as one datetime-local value, since a date
       * without its time was never meaningful on its own.
       */
      requestOn: { type: String },
      requiredOn: { type: String },

      /**
       * The machine as the form names it. Copied from the machine the sheet is
       * raised against at the moment it is raised, so a renamed or re-coded
       * machine does not rewrite sheets already signed.
       */
      machineJigName: { type: String },
      machineJigNo: { type: String },
      deptLine: { type: String }, // "DEPT / LINE", e.g. "PRD-ECU/CBMU"

      shiftOfNewCM: { type: String, enum: SHIFTS }, // SHIFT box

      // ---- THE REQUEST ITSELF ----
      modificationWorkRequest: { type: String }, // "...(With Concept):"
      background: { type: String },
      currentSituation: { type: String }, // "Current-"
      proposedSituation: { type: String }, // "Proposed-"
      purposeOfCM: { type: String },

      /**
       * The three declarations. Each is Yes or No on the form, and a Yes is
       * what obliges the requester to attach a detail sheet — "(**) : If Yes,
       * Please attach detail sheet" — so each carries its own attachments,
       * held as filenames the way every other upload on this sheet is.
       */
      riskAssessment: yesNo, // "**Risk Assessment done"
      riskAssessmentAttachments: { type: [String] },
      safetyRelated: yesNo, // "**Safety related"
      safetyRelatedAttachments: { type: [String] },
      qualityRelated: yesNo, // "**Quality related"
      qualityRelatedAttachments: { type: [String] },

      // ---- REQUESTED DEPARTMENT SIGNATURES (top row of the form) ----
      approvedByPED_HOD: signatureObj, // "Approved by HOD*" — mandatory
      checkedByPED_HOS: signatureObj, // "Checked by"
      preparedByPED_TL: signatureObj, // "Prepared by"
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
      // ---- "MODIFICATION WORK APPROVAL FROM MTD" (stage 2) ----
      modificationWork_ApprovedByMTD_HOSS: signatureObj,
      modificationWork_ApprovedByMTD_HOS: signatureObj,
      modificationWork_ApprovedByMTD_HOD: signatureObj,

      // ---- "MODIFICATION WORK REPORT ( To be filled by MTD)" (stage 3) ----
      /** WORK STARTED / WORK ENDED: a date and a time box each on the form. */
      workStartedOn: { type: String },
      workEndedOn: { type: String },
      /** "Attended By" — the MTD person who carried the work out. */
      attendedBy: userObj,
      workDescription: { type: String }, // "MODIFICATION WORK DESCRIPTION:"

      /**
       * "PARTS  FOR MODIFICATION" — the form prints three rows; the table
       * grows as needed. Price and cost centre are what the accounts side of
       * the form asks for, and are not on any other CM sheet.
       */
      changedParts: [
        {
          partNo: { type: String },
          partName: { type: String },
          makerName: { type: String },
          quantity: { type: Number },
          price: { type: Number },
          costCenter: { type: String },
        },
      ],
    },

    // ==================== COMPLETION & STATUS ====================
    /**
     * "Requested dept. Confirmation After Completion:" — the requester's own
     * account of the finished work, written as prose on the form.
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
    // ==================== APPROVAL SIGNATURES ====================
    /**
     * The closing signatures, the form's last band: the requested department
     * on the left, MTD on the right. These are the sheet being closed, not the
     * work being authorised — that is the top and middle bands.
     */
    approvedByPED_HOS: signatureObj, // Requested Dept. — "Approved by"
    checkedByPED_TL: signatureObj, // Requested Dept. — "Checked by"
    approvedByMTD_HOD: signatureObj, // MTD — "Approved by"
    approvedByMTD_HOS: signatureObj, // MTD — "Checked by"
    preparedAndCheckedByMTD_TL: signatureObj, // MTD — "Prepared by"

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
