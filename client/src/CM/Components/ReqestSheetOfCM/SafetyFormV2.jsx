import { useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  TextField,
} from "@mui/material";
import { BiPlusMedical } from "react-icons/bi";
import { Controller, useForm, get, useWatch } from "react-hook-form";
import { Form, Modal } from "react-bootstrap";
import {
  axiosGetOrDelete,
  axiosPostOrPatch,
} from "../../../Spare/Utils/axiosUtils";

const radioButtonOptions = [
  {
    label: "Yes",
    value: "Yes",
  },
  {
    label: "No",
    value: "No",
  },
];

const sectionWiseFormFields = [
  {
    sectionTitle: "General Maintainance",
    sectionRadioButtons: [
      {
        radioButtonTitle:
          "1) General Maintainance Work (Check by operators onsite):",
        fieldKey: "generalMaintainanceWork.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "generalMaintainanceWork.protectiveEquipment",
            requiredMsg:
              "This field is required when 'General Maintainance Work' is Yes",
            label:
              "Wear personal protective equipment(Safety glasses, helmet, safety shoes)",
          },
          {
            fieldKey: "generalMaintainanceWork.postNecessaryWarnigs",
            requiredMsg:
              "This field is required when 'Work Inside Machine' is Yes",
            label:
              "Post necessary warning signs(Under repair, Do NOT turn on, etc.)",
          },
          {
            fieldKey: "generalMaintainanceWork.powerAndAirOff",
            requiredMsg:
              "This field is required when 'Work Inside Machine' is Yes",
            label:
              "Ensure that the power and air is OFF and no residual pressure, inertia, or voltage in the control panel is present.",
          },
        ],
      },
    ],
  },
  {
    sectionTitle: "7 Designated Works (Work in pairs)",
    sectionRadioButtons: [
      {
        radioButtonTitle:
          "2) Complex work(On Adjacent machines or very nearby , two or more teams works at same time for different):",
        fieldKey: "complexWork.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "complexWork.leaderOfOtherTeamsAndClarity",
            requiredMsg: "This field is required",
            label:
              "Determine leader of other teams & clarify the job contents with schedule",
            subFieldType: "text",
            subFields: [
              {
                fieldKey: "complexWork.otherTLDetails",
                requiredMsg: "This field is required",
                label: "1. Other TL details:",
              },
              {
                fieldKey: "complexWork.workDetails",
                requiredMsg: "This field is required",
                label: "2. Work details:",
              },
            ],
          },
          {
            fieldKey: "complexWork.physicalSeparation",
            requiredMsg: "This field is required",
            label: "Physical Separation or barricading",
          },
          {
            fieldKey: "complexWork.commonUtilitySources",
            requiredMsg: "This field is required",
            radioButtonKey: "complexWork.sourcesAvailable",
            label:
              "Common utility sources  available for adjacent machines  (Electricity, Air ,Gas)",
            subFieldType: "checkbox",
            subFields: [
              {
                fieldKey: "complexWork.applyLOTOOrCautionTag",
                requiredMsg: "This field is required",
                label: "If yes, apply separate  LOTO / caution Tag",
              },
            ],
          },
          {
            fieldKey: "complexWork.gapAmongAllOtherTeams",
            requiredMsg: "This field is required",
            label:
              "If physical separation not possible ,keep time gap among all other  teams jobs",
          },
          {
            fieldKey: "complexWork.postponeActivity",
            requiredMsg: "This field is required",
            label:
              "If physical separation & time gap not possible ,postpone the activity",
          },
        ],
      },
      {
        radioButtonTitle: "3) Work Team:",
        fieldKey: "workInsideMachine.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "workInsideMachine.protectiveEquipment",
            requiredMsg:
              "This field is required when 'Work Inside Machine' is Yes",
            label: "Determine a leader. (Leader's name)",
          },
          {
            fieldKey: "workInsideMachine.hadMeeting",
            requiredMsg: "This field is required when 'Work Team' is Yes",
            label:
              "Hold a meeting before work (to confirm the details, procedures, steps, repetition.)",
          },
        ],
      },
      {
        radioButtonTitle: "4) Work bypassing safety devices:",
        fieldKey: "highPressure.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "highPressure.notOpenPressureLine",
            requiredMsg:
              "This field is required when 'bypassing safety devices' is Yes",
            label: "Issue a permission of bypassing safety devices.",
          },
          {
            fieldKey: "highPressure.proper3SWork",
            requiredMsg: "This field is required when 'High Pressure' is Yes",
            label:
              "Observe alternative safety measure and restore the safety device after the work.",
          },
          {
            fieldKey: "highPressure.isTrainedStaffAvailable",
            requiredMsg: "This field is required when 'High Pressure' is Yes",
            label:
              "Insert a safety block (to prevent the machine from moving due to its own weight.)",
          },
        ],
      },
      {
        radioButtonTitle: "5) Work handling heavy objects:",
        fieldKey: "workHandlingHeavyObj.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "workHandlingHeavyObj.visuallyGuessWeight",
            requiredMsg:
              "This field is required when 'Work handling heavy objects' is Yes",
            label:
              "Visually guess the weight to use appropriate lifting slings, tools, conveying equipment, etc.",
          },
          {
            fieldKey: "workHandlingHeavyObj.prohibitSlingOpWithSingleWire",
            requiredMsg:
              "This field is required when 'Work handling heavy objects' is Yes",
            label:
              "Prohibit to use sling operation using single wire. If it is necessary to do this, use a hook bolt.",
          },
          {
            fieldKey: "workHandlingHeavyObj.secureFootingAndHandPosition",
            requiredMsg:
              "This field is required when 'Work handling heavy objects' is Yes",
            label:
              "Secure footing and hand position (Check that there is no risk of hand being caught.",
          },
        ],
      },
      {
        radioButtonTitle: "6) Work at height (>2 metres):",
        fieldKey: "workAtHeight.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "workAtHeight.wearPersonalProtectiveEquipment",
            requiredMsg:
              "This field is required when 'Work handling heavy objects' is Yes",
            label:
              "Wear personal protective equipment (helmet, safety belt/harness).",
          },
          {
            fieldKey: "workAtHeight.postASignOfHighPlace",
            requiredMsg: "This field is required when 'Work at height' is Yes",
            label:
              "Post a sign indicating that high-place work is in progress.",
          },
          {
            fieldKey: "workAtHeight.secureFootingAndSafetyBelt",
            requiredMsg: "This field is required when 'Work at height' is Yes",
            label: "Secure footing and observe to use safety belt/harness.",
          },
          {
            fieldKey: "workAtHeight.isAssociatesQualified",
            requiredMsg:
              "This field is required when 'Work handling fire/Work' is Yes",
            label:
              "Ensure that associates are properly qualified (High place: special education, skill training course for the operation of vehicle for work at height, slinging work: skill training, handling fire: skill training course for gas welding, special education on arc welding, oxygen deficiency: work supervisor, special education",
          },
        ],
      },
      {
        radioButtonTitle: " 7) Work handling fire/Work:",
        fieldKey: "workHandlingFire.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "workHandlingFire.postASignToUseFire",
            requiredMsg: "This field is required when 'Work at height' is Yes",
            label:
              "Post a sign indicating the use of fire is permitted. Check that there is no remaining fire in 30 minutes after operations.",
          },
          {
            fieldKey: "workHandlingFire.takeFirePrevention",
            requiredMsg:
              "This field is required when 'Work handling fire/Work' is Yes",
            label:
              "Take fire preventive measures such as the removal of flammable materials (oil, dust) in the vicinity and ensure that the work is monitored by a third person.",
          },
          {
            fieldKey: "workHandlingFire.isAssociatesQualified",
            requiredMsg:
              "This field is required when 'Work handling fire/Work' is Yes",
            label:
              "Ensure that associates are properly qualified (High place: special education, skill training course for the operation of vehicle for work at height, slinging work: skill training, handling fire: skill training course for gas welding, special education on arc welding, oxygen deficiency: work supervisor, special education",
          },
        ],
      },
      {
        radioButtonTitle: "8) Work involving risk of oxygen deficiency:",
        fieldKey: "workInvolvingRiskOfOxygen.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "workInvolvingRiskOfOxygen.measureOxygen",
            requiredMsg:
              "This field is required when 'Work handling fire/Work' is Yes",
            label:
              "Measure the oxygen concentration (work supervisor) and properly ventilate the work area.",
          },
          {
            fieldKey:
              "workInvolvingRiskOfOxygen.holdAnObserverAndWearProtectiveEquipment",
            requiredMsg:
              "This field is required when 'Work involving risk of oxygen deficiency' is Yes",
            label:
              "Hold an observer and wear personal protective equipment (air breathing apparatus, ropes) depending on the necessity.",
          },
          {
            fieldKey: "workInvolvingRiskOfOxygen.isAssociatesQualified",
            requiredMsg:
              "This field is required when 'Work involving risk of oxygen deficiency' is Yes",
            label:
              "Ensure that associates are properly qualified (High place: special education, skill training course for the operation of vehicle for work at height, slinging work: skill training, handling fire: skill training course for gas welding, special education on arc welding, oxygen deficiency: work supervisor, special education",
          },
        ],
      },
      {
        radioButtonTitle: `9) Work in high temperature areas (70°C or more):`,
        fieldKey: "workUsingHighTemp.IsAccepted",
        radioButtonCheckboxes: [
          {
            fieldKey: "workUsingHighTemp.isAssociatesWereSafetyTools",
            requiredMsg:
              "This field is required when 'Work in high temperature areas' is Yes",
            label:
              "Wear safety glasses, helmet with face shield, protective equipment (heat resistant gloves, arm covers, etc.)",
          },
        ],
      },
    ],
  },
];

const RadioButtonComponent = ({ register, errors, fieldKey, disabled }) => {
  const error = get(errors, fieldKey);
  return (
    <Grid lg={8}>
      <div className="d-flex">
        {radioButtonOptions?.map((type) => (
          <Form.Check
            key={type?.value}
            disabled={disabled}
            type="radio"
            className="m-1"
            {...type}
            {...register(fieldKey, {
              required: "This field is required",
            })}
          />
        ))}
      </div>
      {error && <FormHelperText error>{error?.message}</FormHelperText>}
    </Grid>
  );
};

const SubFieldTextInputComponent = ({
  control,
  errors,
  fieldProp = {
    fieldKey: "complexWork.otherTLDetails",
    requiredMsg: "This field is required",
    label: "1. Other TL details",
    type: "text",
  },
  disabled,
}) => {
  const error = get(errors, fieldProp?.fieldKey);

  return (
    <div>
      <div className="d-flex gap-2">
        <span>{fieldProp?.label}</span>
        &nbsp;
        <Controller
          name={fieldProp?.fieldKey}
          control={control}
          rules={{
            required: fieldProp?.requiredMsg,
          }}
          render={({ field }) => (
            <FormControlLabel
              disabled={disabled}
              control={<input {...field} checked={field.value} />}
            />
          )}
        />
      </div>
      {error && <FormHelperText error>{error?.message}</FormHelperText>}
    </div>
  );
};

const SubFieldCheckboxComponent = ({
  register,
  control,
  errors,
  fieldProp,
  radioButtonKey = "",
  disabled,
}) => {
  const radioButtonValue = useWatch({ name: radioButtonKey, control });
  if (!radioButtonValue || radioButtonValue === "No") return null;

  return (
    <div>
      <CheckBoxComponent
        register={register}
        control={control}
        errors={errors}
        fieldProp={fieldProp}
        disabled={disabled}
      />
    </div>
  );
};

const SubFieldComponent = ({
  fieldKey,
  subFields,
  subFieldType,
  radioButtonKey = "",
  register,
  control,
  errors,
  disabled,
}) => {
  const parentValue = useWatch({ name: fieldKey, control });
  if (!parentValue) return null;

  return (
    <div className="d-flex flex-wrap gap-1 p-5 pt-0 pb-0">
      {subFields?.map((subField) =>
        subFieldType === "text" ? (
          <SubFieldTextInputComponent
            fieldProp={subField}
            control={control}
            errors={errors}
            disabled={disabled}
          />
        ) : (
          <SubFieldCheckboxComponent
            radioButtonKey={radioButtonKey}
            register={register}
            control={control}
            errors={errors}
            fieldProp={subField}
            disabled={disabled}
          />
        ),
      )}
    </div>
  );
};

const CheckBoxComponent = ({
  register,
  control,
  errors,
  fieldProp = {
    fieldKey: "generalMaintainanceWork.protectiveEquipment",
    requiredMsg:
      "This field is required when 'General Maintainance Work' is Yes",
    label:
      "Wear personal protective equipment(Safety glasses, helmet, safety shoes)",
  },
  disabled,
}) => {
  const error = get(errors, fieldProp?.fieldKey);

  return (
    <>
      <div className="d-flex">
        <Controller
          name={fieldProp?.fieldKey}
          control={control}
          rules={{
            required: fieldProp?.requiredMsg,
          }}
          render={({ field }) => (
            <FormControlLabel
              disabled={disabled}
              control={<Checkbox {...field} checked={field.value} />}
              label={fieldProp?.label}
            />
          )}
        />
        {fieldProp?.radioButtonKey && (
          <RadioButtonComponent
            register={register}
            errors={errors}
            fieldKey={fieldProp?.radioButtonKey}
            disabled={disabled}
          />
        )}
      </div>
      {error && <FormHelperText error>{error?.message}</FormHelperText>}
      {fieldProp?.subFields && fieldProp?.subFields?.length > 0 && (
        <SubFieldComponent
          {...fieldProp}
          register={register}
          control={control}
          errors={errors}
          disabled={disabled}
        />
      )}
    </>
  );
};

const SafetyFormV2 = ({
  moduleType = "cm",
  machineParentHierarchy,
  params,
  otherFormSubmitParams,
  modelProp,
  handleUpdateSheet,
  OtherComponent = null,
}) => {
  const url = useMemo(() => `/${moduleType}/v1/safetyForm`, [moduleType]);

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: {
      isLoading,
      //  dirtyFields,
      errors,
    },
  } = useForm({
    defaultValues: async () => {
      if (!params?.requestSheetRef || moduleType === "pm") return {};

      const { isError, safetyForm } = await axiosGetOrDelete({
        url,
        axiosProps: {
          params,
        },
      });
      if (!isError) return safetyForm;
      return {};
    },
  });

  // const dirtyValues = (allValues) => {
  //   let newVal = {};
  //   Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
  //   return newVal;
  // };

  const handleSubmitSpareRequestForm = async (data) => {
    // if (watch("_id")) {
    //   if (Object.keys(dirtyFields).length === 0) return;
    //   data = dirtyValues(data);
    // } else {
    // params.cmSheetId = selectedRow?._id;
    // params.selectedYear = selectedYear;
    // }

    const response = await axiosPostOrPatch({
      url,
      // apiType: watch("_id") ? "patch" : "post",
      axiosProps: {
        params: {
          ...params,
          ...otherFormSubmitParams,
        },
      },
      axiosBody: data,
    });

    if (!response?.isError) {
      handleUpdateSheet && handleUpdateSheet(response?.isEditableRS);
      modelProp.onHide();
    }
  };

  return (
    <Modal
      {...modelProp}
      fullscreen
      aria-labelledby="contained-modal-title-vcenter"
      centered
      style={{ zIndex: 1060 }}
    >
      {isLoading ? (
        <h4>Loading....</h4>
      ) : (
        <>
          <Modal.Header className="d-flex justify-content-between">
            <Modal.Title id="contained-modal-title-vcenter">
              Safety Form
            </Modal.Title>
            <Button
              variant="secondary"
              onClick={() => modelProp.onHide()}
              sx={{
                backgroundColor: "#B02A37",
                color: "#F2F2F2",
                "&:hover": {
                  backgroundColor: "#B02A37",
                  cursor: "pointer",
                },
              }}
            >
              Close
            </Button>
          </Modal.Header>
          <Modal.Body>
            {OtherComponent && (
              <OtherComponent
                reset={reset}
                params={params}
                otherFormSubmitParams={otherFormSubmitParams}
              />
            )}
            <form onSubmit={handleSubmit(handleSubmitSpareRequestForm)}>
              <Grid container p={1} rowGap={2} className="border">
                <Grid
                  sm={12}
                  className="d-flex justify-content-between align-items-end"
                >
                  <Box width={"20%"}>
                    <BiPlusMedical size={55} />
                  </Box>
                  <Box className="text-center border-bottom" width={"40%"}>
                    <h4 className="fw-bold">
                      SAFETY CHECK-SHEET FOR MAINTENANCE
                    </h4>
                  </Box>
                  <Box
                    className="text-center border-bottom"
                    width={"fit-content"}
                  >
                    <h4 className="fw-bold" style={{ fontSize: "20px" }}>
                      Mfg. Div. Maintenance
                    </h4>
                  </Box>
                </Grid>
                <Grid sm={12}>
                  <Box className="d-flex border  p-1 align-items-center">
                    <Grid sm={4} fontWeight={650}>
                      Work Name:
                    </Grid>
                    <Grid sm={8}>
                      <TextField
                        size="small"
                        disabled={watch("_id")}
                        placeholder="Enter Work Name"
                        {...register("workName", {
                          required: "Work Name is required",
                        })}
                        error={!!errors.workName}
                        helperText={errors.workName?.message}
                      />
                    </Grid>
                    <Grid sm={4} fontWeight={650}>
                      Line Name:
                    </Grid>
                    <Grid sm={8}>{machineParentHierarchy?.line}</Grid>
                    <Grid sm={4} fontWeight={650}>
                      Machine No:
                    </Grid>
                    <Grid sm={8}>{machineParentHierarchy?.machineNo}</Grid>

                    <Grid sm={4} fontWeight={650}>
                      TM Signature:
                    </Grid>
                    {watch("safetyFormFilledUpBy") && (
                      <>
                        <Grid sm={8}>{watch("safetyFormFilledUpBy")}</Grid>
                      </>
                    )}
                    <Grid sm={4} fontWeight={650}>
                      TL Signature:
                    </Grid>
                    <Grid sm={8}></Grid>
                  </Box>
                  <Box className="d-flex border p-1 border-top-0 align-items-center">
                    <Grid sm={4} fontWeight={650}>
                      Process Name:
                    </Grid>
                    <Grid sm={4}>{machineParentHierarchy?.machineName}</Grid>
                  </Box>
                  <Box
                    className="d-flex border p-1 border-top-0 align-items-center"
                    fontWeight={600}
                  >
                    *Work instruction items (6 designated works should be
                    checked onsite before giving instruction.)
                  </Box>
                </Grid>
                {sectionWiseFormFields?.map(
                  ({ sectionTitle = "", sectionRadioButtons = [] }) => (
                    <Grid sm={12} className="border">
                      <Box className="text-center w-100 border-bottom">
                        <h4 style={{ fontSize: "20px" }}>{sectionTitle}</h4>
                      </Box>
                      {sectionRadioButtons?.map(
                        ({
                          radioButtonTitle = "",
                          fieldKey = "",
                          radioButtonCheckboxes = [],
                        }) => (
                          <>
                            <Box className="d-flex p-1 align-items-center">
                              <Grid lg={6} fontWeight={650}>
                                {radioButtonTitle}
                              </Grid>
                              <RadioButtonComponent
                                disabled={watch("_id")}
                                register={register}
                                errors={errors}
                                fieldKey={fieldKey}
                              />
                            </Box>
                            {watch(fieldKey) === "Yes" && (
                              <FormGroup>
                                {radioButtonCheckboxes?.map((fieldProp) => (
                                  <CheckBoxComponent
                                    disabled={watch("_id")}
                                    register={register}
                                    control={control}
                                    errors={errors}
                                    fieldProp={fieldProp}
                                  />
                                ))}
                              </FormGroup>
                            )}
                          </>
                        ),
                      )}
                    </Grid>
                  ),
                )}

                <Grid sm={12} className="border">
                  <Grid sm={12} className="border">
                    <Box className="d-flex p-1 align-items-center">
                      <h4>Safety is Paramount</h4>
                    </Box>
                  </Grid>
                </Grid>
                <Grid sm={12} className="border">
                  <Box className="d-flex p-1 align-items-center">
                    Risk prediction (KY) and preventive measures (one-point KY)
                    ※3: Operator conducts on site. Key risks: Is there any
                    potential risk? <br /> ※1: Work supervisor: Managerial class
                    personnel in charge of maintenance or designated
                    representative who gives instructions at work sites.
                  </Box>
                </Grid>
                <Grid sm={12} className="border">
                  <Box className="d-flex p-1 align-items-center">
                    <Grid lg={4} fontWeight={650}>
                      Key Risks:
                      <br />
                      <small style={{ fontWeight: 400 }}>
                        (Is there any potential risk?)
                      </small>
                    </Grid>
                    <Grid lg={8}>
                      <TextField
                        size="small"
                        disabled={watch("_id")}
                        placeholder="Enter Key Risks"
                        {...register("keyRisks", {
                          required:
                            watch("workInsideMachine.IsAccepted") === "Yes" ||
                            watch("highPressure.IsAccepted") === "Yes" ||
                            watch("workHandlingHeavyObj.IsAccepted") ===
                              "Yes" ||
                            watch("workAtHeight.IsAccepted") === "Yes" ||
                            watch("workAtHeight.isAssociatesQualified") ===
                              "true" ||
                            watch("workInvolvingRiskOfOxygen.IsAccepted") ===
                              "Yes" ||
                            watch("workUsingHighTemp.IsAccepted") === "Yes"
                              ? "Key Risks are required"
                              : false,
                        })}
                        error={!!errors.keyRisks}
                        helperText={errors.keyRisks?.message}
                      />
                    </Grid>
                    <Grid lg={4} fontWeight={650}>
                      Preventive Measures:
                      <br />
                      <small style={{ fontWeight: 400 }}>
                        (How can I/we ensure safety?)
                      </small>
                    </Grid>
                    <Grid lg={8}>
                      <TextField
                        size="small"
                        disabled={watch("_id")}
                        placeholder="Enter Preventive Measures"
                        {...register("preventiveMeasures", {
                          required:
                            watch("workInsideMachine.IsAccepted") === "Yes" ||
                            watch("highPressure.IsAccepted") === "Yes" ||
                            watch("workHandlingHeavyObj.IsAccepted") ===
                              "Yes" ||
                            watch("workAtHeight.IsAccepted") === "Yes" ||
                            watch("workAtHeight.isAssociatesQualified") ===
                              "true" ||
                            watch("workInvolvingRiskOfOxygen.IsAccepted") ===
                              "Yes" ||
                            watch("workUsingHighTemp.IsAccepted") === "Yes"
                              ? "Preventive Measures are required"
                              : false,
                        })}
                        error={!!errors.preventiveMeasures}
                        helperText={errors.preventiveMeasures?.message}
                      />
                    </Grid>
                  </Box>
                </Grid>
                <Grid>
                  <input
                    type="checkbox"
                    name="finalSafetyAcceptance"
                    {...register("finalSafetyAcceptance", {
                      required: "Final Safety Acceptance is required",
                    })}
                    id="finalSafetyAcceptance"
                    disabled={watch("_id")}
                  />
                  &ensp;
                  <span>
                    Self declaration: I have checked machine and fixed all
                    Safety Devices (Safety area curtain, Safety cover, Emergency
                    Switch, Safety plug, Door interlocks etc.) back to original
                    position @GENBA
                  </span>
                  {errors?.finalSafetyAcceptance && (
                    <FormHelperText error>
                      {errors?.finalSafetyAcceptance?.message}
                    </FormHelperText>
                  )}
                </Grid>
                {!watch("_id") && (
                  <Grid item xs={12} mt={2} className="text-center">
                    <Button variant="contained" type="submit">
                      Submit
                    </Button>
                  </Grid>
                )}
              </Grid>
            </form>
          </Modal.Body>
        </>
      )}
    </Modal>
  );
};

export default SafetyFormV2;
