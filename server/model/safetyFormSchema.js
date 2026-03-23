const mongoose = require("mongoose");

const safetyFormSchema = new mongoose.Schema({
  requestSheetRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "requestsheetofbms",
  },
  safetyFormFilledUpBy: {
    type: String,
  },
  processName: {
    type: String
  },
  assetAdminNo: {
    type: String,
  },
  workName: {
    type: String,
  },
  keyRisks: {
    type: String,
  },
  preventiveMeasures: {
    type: String,
  },
  generalMaintainanceWork: {
    IsAccepted: {
      type: String,
    },
    protectiveEquipment: {
      type: Boolean,
    },
    postNecessaryWarnigs: {
      type: Boolean,
    },
    powerAndAirOff: {
      type: Boolean,
    },
  },
  workInsideMachine: {
    protectiveEquipment: {
      type: Boolean,
    },
    hadMeeting: {
      type: Boolean,
    },
    IsAccepted: {
      type: String,
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
    IsAccepted: {
      type: String,
    },
  },
  workHandlingHeavyObj: {
    visuallyGuessWeight: {
      type: Boolean,
    },
    prohibitSlingOpWithSingleWire: {
      type: Boolean,
    },

    secureFootingAndHandPosition: {
      type: Boolean,
    },
    IsAccepted: {
      type: String,
    },
  },
  workAtHeight: {
    wearPersonalProtectiveEquipment: {
      type: Boolean,
    },
    postASignOfHighPlace: {
      type: Boolean,
    },

    secureFootingAndSafetyBelt: {
      type: Boolean,
    },
    isAssociatesQualified: {
      type: Boolean,
    },
    IsAccepted: {
      type: String,
    },
  },
  workHandlingFire: {
    postASignToUseFire: {
      type: Boolean,
    },
    takeFirePrevention: {
      type: Boolean,
    },
    measureOxygen: {
      type: Boolean,
    },
    isAssociatesQualified: {
      type: Boolean,
    },
    IsAccepted: {
      type: String,
    },
    IsAccepted: {
      type: String,
    },
  },
  // involvingHandlingOfFlammableLiquid: {
  //   takeFirePrevention: {
  //     type: Boolean,
  //   },

  //   isAssociatesQualified: {
  //     type: Boolean,
  //   },
  //   IsAccepted: {
  //     type: String,
  //   },
  // },
  workInvolvingRiskOfOxygen: {
    measureOxygen: {
      type: Boolean,
    },
    holdAnObserverAndWearProtectiveEquipment: {
      type: Boolean,
    },
    isAssociatesQualified: {
      type: Boolean,
    },
    IsAccepted: {
      type: String,
    },
  },
  // workUsingHighVoltage: {
  //   isAssociatesQualified: {
  //     type: Boolean,
  //   },
  //   IsAccepted: {
  //     type: String,
  //   },
  // },
  workUsingHighTemp: {
    isAssociatesWereSafetyTools: {
      type: Boolean,
    },
    IsAccepted: {
      type: String,
    },
  },
  finalSafetyAcceptance: {
    type: Boolean,
  },
});

const SafetyForm = mongoose.model("safetyForms", safetyFormSchema);
module.exports = SafetyForm;
