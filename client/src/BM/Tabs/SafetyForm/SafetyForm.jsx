import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { BiPlusMedical } from "react-icons/bi";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Form, Modal } from "react-bootstrap";

const SafetyForm = ({
  id,
  lineName,
  machineNo,
  setSafetyFormModalOpen,
  safetyFormModalOpen,
}) => {
  const [safetyForm, setSafetyForm] = useState(null);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    register,
    setValue,
    formState: { errors },
  } = useForm({
    // defaultValues: {
    //   //   workName: "",
    //   generalMaintainanceWork: {
    //     IsAccepted:
    //       safetyForm?.generalMaintainanceWork?.IsAccepted === "true"
    //         ? "true"
    //         : "false",
    //     protectiveEquipment: false,
    //     postNecessaryWarnigs: false,
    //     powerAndAirOff: false,
    //   },
    //   workInsideMachine: {
    //     IsAccepted:
    //       safetyForm?.workInsideMachine?.IsAccepted === "true"
    //         ? "true"
    //         : "false",
    //     protectiveEquipment: false,
    //     hadMeeting: false,
    //   },
    //   highPressure: {
    //     IsAccepted:
    //       safetyForm?.highPressure?.IsAccepted === "true" ? "true" : "false",
    //     notOpenPressureLine: false,
    //     proper3SWork: false,
    //     isTrainedStaffAvailable: false,
    //   },
    //   workHandlingHeavyObj: {
    //     IsAccepted:
    //       safetyForm?.workHandlingHeavyObj?.IsAccepted === "true"
    //         ? "true"
    //         : "false",
    //     visuallyGuessWeight: false,
    //     prohibitSlingOpWithSingleWire: false,
    //     wearPersonalProtectiveEquipment: false,
    //     secureFootingAndHandPosition: false,
    //   },
    //   workAtHeight: {
    //     IsAccepted:
    //       safetyForm?.workAtHeight?.IsAccepted === "true" ? "true" : "false",
    //     postASignOfHighPlace: false,
    //     postASignToUseFire: false,
    //     secureFootingAndSafetyBelt: false,
    //   },
    //   workHandlingFire: {
    //     IsAccepted:
    //       safetyForm?.workHandlingFire?.IsAccepted === "true"
    //         ? "true"
    //         : "false",
    //     takeFirePrevention: false,
    //     measureOxygen: false,
    //     isAssociatesQualified: false,
    //   },
    //   involvingHandlingOfFlammableLiquid: {
    //     IsAccepted:
    //       safetyForm?.involvingHandlingOfFlammableLiquid?.IsAccepted === "true"
    //         ? "true"
    //         : "false",
    //     takeFirePrevention: false,
    //     measureOxygen: false,
    //     isAssociatesQualified: false,
    //   },
    //   workInvolvingRiskOfOxygen: {
    //     IsAccepted:
    //       safetyForm?.workInvolvingRiskOfOxygen?.IsAccepted === "true"
    //         ? "true"
    //         : "false",
    //     holdAnObserverAndWearProtectiveEquipment: false,
    //     isAssociatesQualified: false,
    //   },
    //   workUsingHighVoltage: {
    //     IsAccepted:
    //       safetyForm?.workUsingHighVoltage?.IsAccepted === "true"
    //         ? "true"
    //         : "false",
    //     isAssociatesQualified: false,
    //   },
    //   keyRisks: "",
    //   preventiveMeasures: "",
    // },
  });

  const workInsideMachineValue = watch("workInsideMachine.IsAccepted");
  const highPressureValue = watch("highPressure.IsAccepted");
  const workHandlingHeavyObjValue = watch("workHandlingHeavyObj.IsAccepted");
  const workAtHeightValue = watch("workAtHeight.IsAccepted");
  const workHandlingFireValue = watch("workHandlingFire.IsAccepted");
  const involvingHandlingOfFlammableLiquidValue = watch(
    "involvingHandlingOfFlammableLiquid.IsAccepted"
  );
  const workInvolvingRiskOfOxygenValue = watch(
    "workInvolvingRiskOfOxygen.IsAccepted"
  );
  const workUsingHighVoltageValue = watch("workUsingHighVoltage.IsAccepted");
  const generalMaintainanceWorkValue = watch(
    "generalMaintainanceWork.IsAccepted"
  );

  const getSafetyForm = async () => {
    try {
      const response = await axios.get(`/getSafetyForm/${id}`);
      if (response?.data?.safetyForm) {
        setSafetyForm(response?.data?.safetyForm);
        reset(response?.data?.safetyForm);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getSafetyForm();
  }, [safetyFormModalOpen]);

  const onSubmit = async (data) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const response = await axios.post(`/addSafetyForm/${id}`, data, config);
      toast.success(response.data.message);
      setSafetyFormModalOpen(false);
      reset();
    } catch (error) {
      toast.error("An error occurred while submitting the form.");
      console.error(error);
    }
  };

  return (
    <Modal
      show={safetyFormModalOpen}
      fullscreen
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <Modal.Title id="contained-modal-title-vcenter">
          Safety Form
        </Modal.Title>
        <Button
          variant="secondary"
          onClick={() => setSafetyFormModalOpen(false)}
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container p={1} rowGap={2} className="border">
            <Grid
              sm={12}
              className="d-flex justify-content-between align-items-end"
            >
              <Box width={"20%"}>
                <BiPlusMedical size={55} />
              </Box>
              <Box className="text-center border-bottom" width={"40%"}>
                <h4 className="fw-bold">SAFETY CHECKSHEET FOR MAINTENANCE</h4>
              </Box>
              <Box className="text-center border-bottom" width={"fit-content"}>
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
                    disabled={safetyForm}
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
                <Grid sm={8}>{lineName}</Grid>
                <Grid sm={4} fontWeight={650}>
                  Machine No:
                </Grid>
                <Grid sm={8}>{machineNo}</Grid>
              </Box>
              <Box
                className="d-flex border p-1 border-top-0 align-items-center"
                fontWeight={600}
              >
                * Work instruction items (8 High risk works should be checked
                onsite before giving instruction.)
              </Box>
            </Grid>
            <Grid sm={12} className="border">
              <Box className="text-center w-100 border-bottom">
                <h4 style={{ fontSize: "20px" }}>General Maintainance</h4>
              </Box>
              <Box className="d-flex p-1 align-items-center">
                <Grid lg={4} fontWeight={650}>
                  General Maintainance Work:
                </Grid>
                <Grid lg={8}>
                  <Controller
                    name="generalMaintainanceWork.IsAccepted"
                    control={control}
                    // disabled={safetyForm}
                    rules={{ required: "This field is required" }}
                    render={({ field }) => (
                      <Form.Group>
                        <Form.Check
                          inline
                          type="radio"
                          label="Yes"
                          value="true"
                          checked={field.value === "true"}
                          onChange={() => field.onChange("true")}
                          disabled={safetyForm}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="No"
                          value="false"
                          checked={field.value === "false"}
                          onChange={() => field.onChange("false")}
                          disabled={safetyForm}
                        />
                      </Form.Group>
                    )}
                  />
                  {errors.generalMaintainanceWork?.IsAccepted && (
                    <FormHelperText error>
                      {errors.generalMaintainanceWork.IsAccepted.message}
                    </FormHelperText>
                  )}
                </Grid>
              </Box>
              {generalMaintainanceWorkValue === "true" && (
                <FormGroup>
                  <Controller
                    name="generalMaintainanceWork.protectiveEquipment"
                    control={control}
                    rules={{
                      required:
                        "This field is required when 'General Maintainance Work' is Yes",
                    }}
                    render={({ field }) => (
                      <FormControlLabel
                        disabled={safetyForm}
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Wear personal protective equipment(Safety glasses, safety shoes)"
                      />
                    )}
                  />
                  {errors.generalMaintainanceWork?.protectiveEquipment && (
                    <FormHelperText error>
                      {
                        errors.generalMaintainanceWork.protectiveEquipment
                          .message
                      }
                    </FormHelperText>
                  )}
                  <Controller
                    name="generalMaintainanceWork.postNecessaryWarnigs"
                    control={control}
                    rules={{
                      required:
                        "This field is required when 'Work Inside Machine' is Yes",
                    }}
                    render={({ field }) => (
                      <FormControlLabel
                        disabled={safetyForm}
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Post necessary warning signs(Under repair, Do NOT turn on, etc.)"
                      />
                    )}
                  />
                  {errors.generalMaintainanceWork?.postNecessaryWarnigs && (
                    <FormHelperText error>
                      {
                        errors.generalMaintainanceWork.postNecessaryWarnigs
                          .message
                      }
                    </FormHelperText>
                  )}
                  <Controller
                    name="generalMaintainanceWork.powerAndAirOff"
                    control={control}
                    rules={{
                      required:
                        "This field is required when 'Work Inside Machine' is Yes",
                    }}
                    render={({ field }) => (
                      <FormControlLabel
                        disabled={safetyForm}
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Ensure that the power and air is OFF and no residual pressure, inertia, or voltage in the control panel is present."
                      />
                    )}
                  />
                  {errors.generalMaintainanceWork?.powerAndAirOff && (
                    <FormHelperText error>
                      {errors.generalMaintainanceWork.powerAndAirOff.message}
                    </FormHelperText>
                  )}
                </FormGroup>
              )}
            </Grid>
            <Grid sm={12} className="border">
              <Box className="text-center w-100 border-bottom">
                <h4 style={{ fontSize: "20px" }}>
                  High Risk Works (Work in pairs)
                </h4>
              </Box>
              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    Work Inside Machine:
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="workInsideMachine.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.workInsideMachine?.IsAccepted && (
                      <FormHelperText error>
                        {errors.workInsideMachine.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {workInsideMachineValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="workInsideMachine.protectiveEquipment"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work Inside Machine' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Hold an observer and wear personal protective equipment (helmet, safety glasses) depending on the necessity."
                        />
                      )}
                    />
                    {errors.workInsideMachine?.protectiveEquipment && (
                      <FormHelperText error>
                        {errors.workInsideMachine.protectiveEquipment.message}
                      </FormHelperText>
                    )}
                    <Controller
                      name="workInsideMachine.hadMeeting"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work Inside Machine' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Hold a meeting before work (to confirm the details, procedures, steps, repetition.)"
                        />
                      )}
                    />
                    {errors.workInsideMachine?.hadMeeting && (
                      <FormHelperText error>
                        {errors.workInsideMachine.hadMeeting.message}
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    High Pressure (Liquid 30 Mpa, Gas 1 mpa):
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="highPressure.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.highPressure?.IsAccepted && (
                      <FormHelperText error>
                        {errors.highPressure.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {highPressureValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="highPressure.notOpenPressureLine"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'High Pressure' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Don't Open Pressure Line during Running."
                        />
                      )}
                    />
                    {errors.highPressure?.notOpenPressureLine && (
                      <FormHelperText error>
                        {errors.highPressure.notOpenPressureLine.message}
                      </FormHelperText>
                    )}
                    <Controller
                      name="highPressure.proper3SWork"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'High Pressure' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Do the Proper 3S for Work"
                        />
                      )}
                    />
                    {errors.highPressure?.proper3SWork && (
                      <FormHelperText error>
                        {errors.highPressure.proper3SWork.message}
                      </FormHelperText>
                    )}
                    <Controller
                      name="highPressure.isTrainedStaffAvailable"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'High Pressure' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Check Trained Staff should available."
                        />
                      )}
                    />
                    {errors.highPressure?.isTrainedStaffAvailable && (
                      <FormHelperText error>
                        {errors.highPressure.isTrainedStaffAvailable.message}
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    Work handling heavy objects ({">"}20 kg):
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="workHandlingHeavyObj.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.workHandlingHeavyObj?.IsAccepted && (
                      <FormHelperText error>
                        {errors.workHandlingHeavyObj.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {workHandlingHeavyObjValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="workHandlingHeavyObj.visuallyGuessWeight"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work handling heavy objects' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Visually guess the weight to use appropriate lifting slings, tools, conveying equipment, etc."
                        />
                      )}
                    />
                    {errors.workHandlingHeavyObj?.visuallyGuessWeight && (
                      <FormHelperText error>
                        {
                          errors.workHandlingHeavyObj.visuallyGuessWeight
                            .message
                        }
                      </FormHelperText>
                    )}
                    <Controller
                      name="workHandlingHeavyObj.prohibitSlingOpWithSingleWire"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work handling heavy objects' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Prohibit to use sling operation using single wire. If it is necessary to do this, use a hook bolt."
                        />
                      )}
                    />
                    {errors.workHandlingHeavyObj
                      ?.prohibitSlingOpWithSingleWire && (
                      <FormHelperText error>
                        {
                          errors.workHandlingHeavyObj
                            .prohibitSlingOpWithSingleWire.message
                        }
                      </FormHelperText>
                    )}
                    <Controller
                      name="workHandlingHeavyObj.wearPersonalProtectiveEquipment"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work handling heavy objects' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Wear personal protective equipment (helmet, safety belt/harness, high voltage rubber gloves, boots)"
                        />
                      )}
                    />
                    {errors.workHandlingHeavyObj
                      ?.wearPersonalProtectiveEquipment && (
                      <FormHelperText error>
                        {
                          errors.workHandlingHeavyObj
                            .wearPersonalProtectiveEquipment.message
                        }
                      </FormHelperText>
                    )}
                    <Controller
                      name="workHandlingHeavyObj.secureFootingAndHandPosition"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work handling heavy objects' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Secure footing and hand position (Check that there is no risk of hand being caught."
                        />
                      )}
                    />
                    {errors.workHandlingHeavyObj
                      ?.secureFootingAndHandPosition && (
                      <FormHelperText error>
                        {
                          errors.workHandlingHeavyObj
                            .secureFootingAndHandPosition.message
                        }
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    Work at height ({">"}2 metres):
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="workAtHeight.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.workAtHeight?.IsAccepted && (
                      <FormHelperText error>
                        {errors.workAtHeight.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {workAtHeightValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="workAtHeight.postASignOfHighPlace"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work at height' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Post a sign indicating that high-place work is in progress or high voltage work is in progress"
                        />
                      )}
                    />
                    {errors.workAtHeight?.postASignOfHighPlace && (
                      <FormHelperText error>
                        {errors.workAtHeight.postASignOfHighPlace.message}
                      </FormHelperText>
                    )}
                    <Controller
                      name="workAtHeight.postASignToUseFire"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work at height' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Post a sign indicating the use of fire is permitted. Check that there is no remaining fire in 30 minutes after operations."
                        />
                      )}
                    />
                    {errors.workAtHeight?.postASignToUseFire && (
                      <FormHelperText error>
                        {errors.workAtHeight.postASignToUseFire.message}
                      </FormHelperText>
                    )}
                    <Controller
                      name="workAtHeight.secureFootingAndSafetyBelt"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work at height' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Secure footing and observe to use safety belt/harness."
                        />
                      )}
                    />
                    {errors.workAtHeight?.secureFootingAndSafetyBelt && (
                      <FormHelperText error>
                        {errors.workAtHeight.secureFootingAndSafetyBelt.message}
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    Work handling fire/Work:
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="workHandlingFire.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.workHandlingFire?.IsAccepted && (
                      <FormHelperText error>
                        {errors.workHandlingFire.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {workHandlingFireValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="workHandlingFire.takeFirePrevention"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work handling fire/Work' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Take fire preventive measures such as the removal of flammable materials (oil, dust) in the vicinity and ensure that the work is monitored by a third person."
                        />
                      )}
                    />
                    {errors.workHandlingFire?.takeFirePrevention && (
                      <FormHelperText error>
                        {errors.workHandlingFire.takeFirePrevention.message}
                      </FormHelperText>
                    )}
                    <Controller
                      name="workHandlingFire.measureOxygen"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work handling fire/Work' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Measure the oxygen concentration (work supervisor) and properly ventilate the work area."
                        />
                      )}
                    />
                    {errors.workHandlingFire?.measureOxygen && (
                      <FormHelperText error>
                        {errors.workHandlingFire.measureOxygen.message}
                      </FormHelperText>
                    )}
                    <Controller
                      name="workHandlingFire.isAssociatesQualified"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work handling fire/Work' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
                        />
                      )}
                    />
                    {errors.workHandlingFire?.isAssociatesQualified && (
                      <FormHelperText error>
                        {errors.workHandlingFire.isAssociatesQualified.message}
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    Involving handling of flammable liquid:
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="involvingHandlingOfFlammableLiquid.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.involvingHandlingOfFlammableLiquid?.IsAccepted && (
                      <FormHelperText error>
                        {
                          errors.involvingHandlingOfFlammableLiquid.IsAccepted
                            .message
                        }
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {involvingHandlingOfFlammableLiquidValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="involvingHandlingOfFlammableLiquid.takeFirePrevention"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Involving handling of flammable liquid' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Take fire preventive measures such as the removal of flammable materials (oil, dust) in the vicinity and ensure that the work is monitored by a third person."
                        />
                      )}
                    />
                    {errors.involvingHandlingOfFlammableLiquid
                      ?.takeFirePrevention && (
                      <FormHelperText error>
                        {
                          errors.involvingHandlingOfFlammableLiquid
                            .takeFirePrevention.message
                        }
                      </FormHelperText>
                    )}
                    <Controller
                      name="involvingHandlingOfFlammableLiquid.measureOxygen"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Involving handling of flammable liquid' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Measure the oxygen concentration (work supervisor) and properly ventilate the work area."
                        />
                      )}
                    />
                    {errors.involvingHandlingOfFlammableLiquid
                      ?.measureOxygen && (
                      <FormHelperText error>
                        {
                          errors.involvingHandlingOfFlammableLiquid
                            .measureOxygen.message
                        }
                      </FormHelperText>
                    )}
                    <Controller
                      name="involvingHandlingOfFlammableLiquid.isAssociatesQualified"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Involving handling of flammable liquid' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
                        />
                      )}
                    />
                    {errors.involvingHandlingOfFlammableLiquid
                      ?.isAssociatesQualified && (
                      <FormHelperText error>
                        {
                          errors.involvingHandlingOfFlammableLiquid
                            .isAssociatesQualified.message
                        }
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    Work involving risk of oxygen deficiency:
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="workInvolvingRiskOfOxygen.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.workInvolvingRiskOfOxygen?.IsAccepted && (
                      <FormHelperText error>
                        {errors.workInvolvingRiskOfOxygen.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {workInvolvingRiskOfOxygenValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="workInvolvingRiskOfOxygen.holdAnObserverAndWearProtectiveEquipment"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work involving risk of oxygen deficiency' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Hold an observer and wear personal protective equipment (air breathing apparatus, ropes) depending on the necessity."
                        />
                      )}
                    />
                    {errors.workInvolvingRiskOfOxygen
                      ?.holdAnObserverAndWearProtectiveEquipment && (
                      <FormHelperText error>
                        {
                          errors.workInvolvingRiskOfOxygen
                            .holdAnObserverAndWearProtectiveEquipment.message
                        }
                      </FormHelperText>
                    )}
                    <Controller
                      name="workInvolvingRiskOfOxygen.isAssociatesQualified"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work involving risk of oxygen deficiency' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
                        />
                      )}
                    />
                    {errors.workInvolvingRiskOfOxygen
                      ?.isAssociatesQualified && (
                      <FormHelperText error>
                        {
                          errors.workInvolvingRiskOfOxygen.isAssociatesQualified
                            .message
                        }
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    Work using high voltage electric device:
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="workUsingHighVoltage.IsAccepted"
                      control={control}
                      rules={{ required: "This field is required" }}
                      render={({ field }) => (
                        <Form.Group>
                          <Form.Check
                            inline
                            type="radio"
                            label="Yes"
                            value="true"
                            checked={field.value === "true"}
                            onChange={() => field.onChange("true")}
                            disabled={safetyForm}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="No"
                            value="false"
                            checked={field.value === "false"}
                            onChange={() => field.onChange("false")}
                            disabled={safetyForm}
                          />
                        </Form.Group>
                      )}
                    />
                    {errors.workUsingHighVoltage?.IsAccepted && (
                      <FormHelperText error>
                        {errors.workUsingHighVoltage.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {workUsingHighVoltageValue === "true" && (
                  <FormGroup>
                    <Controller
                      name="workUsingHighVoltage.isAssociatesQualified"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work using high voltage electric device' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
                        />
                      )}
                    />
                    {errors.workUsingHighVoltage?.isAssociatesQualified && (
                      <FormHelperText error>
                        {
                          errors.workUsingHighVoltage.isAssociatesQualified
                            .message
                        }
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>
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
                    disabled={safetyForm}
                    placeholder="Enter Key Risks"
                    {...register("keyRisks", {
                      required: "Key Risks are required",
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
                    disabled={safetyForm}
                    placeholder="Enter Preventive Measures"
                    {...register("preventiveMeasures", {
                      required: "Preventive Measures are required",
                    })}
                    error={!!errors.preventiveMeasures}
                    helperText={errors.preventiveMeasures?.message}
                  />
                </Grid>
              </Box>
            </Grid>
            {!safetyForm && (
              <Grid item xs={12} mt={2} className="text-center">
                <Button variant="contained" type="submit">
                  Submit
                </Button>
              </Grid>
            )}
          </Grid>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default SafetyForm;
