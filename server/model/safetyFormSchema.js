const mongoose = require("mongoose");

const safetyFormSchema = new mongoose.Schema({
  requestSheetRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "requestsheetofbms",
  },
  workInsideMachine: {
    protectiveEquipment: {
      type: Boolean,
    },
    hadMeeting: {
      type: Boolean,
    },
  },
  highPressure: {
    notOpenPressureLine: {
      type: Boolean,
    },
    proper3SWork: {
      type: Boolean,
    },
    isTrainedStaffAvailable: {
      type: Boolean,
    },
  },
  workHandlingHeavyObj: {
    visuallyGuessWeight: {
      type: Boolean,
    },
    prohibitSlingOpWithSingleWire: {
      type: Boolean,
    },
    wearPersonalProtectiveEquipment: {
      type: Boolean,
    },
    secureFootingAndHandPosition: {
      type: Boolean,
    },
  },
  workAtHeight: {
    postASignOfHighPlace: {
      type: Boolean,
    },
    postASignToUseFire: {
      type: Boolean,
    },
    secureFootingAndSafetyBelt: {
      type: Boolean,
    },
  },
  workHandlingFire: {
    takeFirePrevention: {
      type: Boolean,
    },
    measureOxygen: {
      type: Boolean,
    },
    isAssociatesQualified: {
      type: Boolean,
    },
  },
  involvingHandlingOfFlammableLiquid: {
    takeFirePrevention: {
      type: Boolean,
    },
    measureOxygen: {
      type: Boolean,
    },
    isAssociatesQualified: {
      type: Boolean,
    },
  },
  workInvolvingRiskOfOxygen: {
    holdAnObserverAndWearProtectiveEquipment: {
      type: Boolean,
    },
    isAssociatesQualified: {
      type: Boolean,
    },
  },
  workUsingHighVoltage: {
    isAssociatesQualified: {
      type: Boolean,
    },
  },
});

const SafetyForm = mongoose.model("safetyForms", safetyFormSchema);
module.exports = SafetyForm;
