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
  machineName,
  setSafetyFormModalOpen,
  safetyFormModalOpen,
  machineSafetyCheckedByMTD,
}) => {
  const [safetyForm, setSafetyForm] = useState(null);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    register,
    formState: { errors },
  } = useForm({
    values: {
      processName: machineName,
    },
  });

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
      <Modal.Header className="d-flex justify-content-between">
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
                <h4 className="fw-bold">SAFETY CHECK-SHEET FOR MAINTENANCE</h4>
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

                <Grid sm={4} fontWeight={650}>
                  TM Signature:
                </Grid>
                {safetyForm?.safetyFormFilledUpBy && (
                  <>
                    <Grid sm={8}>{safetyForm?.safetyFormFilledUpBy}</Grid>
                  </>
                )}
                <Grid sm={4} fontWeight={650}>
                  TL Signature:
                </Grid>
                {machineSafetyCheckedByMTD?.tm_name && (
                  <>
                    <Grid sm={8}>{machineSafetyCheckedByMTD?.tm_name}</Grid>
                  </>
                )}
              </Box>
              <Box className="d-flex border p-1 border-top-0 align-items-center">
                <Grid sm={4} fontWeight={650}>
                  Process Name:
                </Grid>
                <Grid sm={4}>{watch("processName")}</Grid>
              </Box>
              <Box
                className="d-flex border p-1 border-top-0 align-items-center"
                fontWeight={600}
              >
                *Work instruction items (6 designated works should be checked
                onsite before giving instruction.)
              </Box>
            </Grid>
            <Grid sm={12} className="border">
              <Box className="text-center w-100 border-bottom">
                <h4 style={{ fontSize: "20px" }}>General Maintainance</h4>
              </Box>
              <Box className="d-flex p-1 align-items-center">
                <Grid lg={4} fontWeight={650}>
                  1) General Maintainance Work (Check by operators onsite):
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
              {watch("generalMaintainanceWork.IsAccepted") === "true" && (
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
                        label="Wear personal protective equipment(Safety glasses, helmet, safety shoes)"
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
                  6 Designated Works (Work in pairs)
                </h4>
              </Box>
              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    2) Work Team:
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
                {watch("workInsideMachine.IsAccepted") === "true" && (
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
                          label="Determine a leader. (Leader's name)"
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
                          "This field is required when 'Work Team' is Yes",
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
                    3) Work bypassing safety devices:
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
                {watch("highPressure.IsAccepted") === "true" && (
                  <FormGroup>
                    <Controller
                      name="highPressure.notOpenPressureLine"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'bypassing safety devices' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Issue a permission of bypassing safety devices."
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
                          label="Observe alternative safety measure and restore the safety device after the work."
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
                          label="Insert a safety block (to prevent the machine from moving due to its own weight.)"
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
                    4) Work handling heavy objects:
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
                {watch("workHandlingHeavyObj.IsAccepted") === "true" && (
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
                    5) Work at height ({">"}2 metres):
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
                {watch("workAtHeight.IsAccepted") === "true" && (
                  <FormGroup>
                    <Controller
                      name="workAtHeight.wearPersonalProtectiveEquipment"
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
                          label="Wear personal protective equipment (helmet, safety belt/harness)."
                        />
                      )}
                    />
                    {errors.workAtHeight?.wearPersonalProtectiveEquipment && (
                      <FormHelperText error>
                        {
                          errors.workAtHeight.wearPersonalProtectiveEquipment
                            .message
                        }
                      </FormHelperText>
                    )}
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
                          label="Post a sign indicating that high-place work is in progress."
                        />
                      )}
                    />
                    {errors.workAtHeight?.postASignOfHighPlace && (
                      <FormHelperText error>
                        {errors.workAtHeight.postASignOfHighPlace.message}
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
                    <Controller
                      name="workAtHeight.isAssociatesQualified"
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
                          label="Ensure that associates are properly qualified (High place: special education, skill training course for the operation of vehicle for work at height, slinging work: skill training, handling fire: skill training course for gas welding, special education on arc welding, oxygen deficiency: work supervisor, special education"
                        />
                      )}
                    />
                    {errors.workAtHeight?.isAssociatesQualified && (
                      <FormHelperText error>
                        {errors.workAtHeight.isAssociatesQualified.message}
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    6) Work handling fire/Work:
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
                {watch("workHandlingFire.IsAccepted") === "true" && (
                  <FormGroup>
                    <Controller
                      name="workHandlingFire.postASignToUseFire"
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
                    {errors.workHandlingFire?.postASignToUseFire && (
                      <FormHelperText error>
                        {errors.workHandlingFire.postASignToUseFire.message}
                      </FormHelperText>
                    )}
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
                          label="Ensure that associates are properly qualified (High place: special education, skill training course for the operation of vehicle for work at height, slinging work: skill training, handling fire: skill training course for gas welding, special education on arc welding, oxygen deficiency: work supervisor, special education"
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

              {/* <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    6) Involving handling of flammable liquid:
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
              </Grid> */}

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <Grid lg={4} fontWeight={650}>
                    7) Work involving risk of oxygen deficiency:
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
                {watch("workInvolvingRiskOfOxygen.IsAccepted") === "true" && (
                  <FormGroup>
                    <Controller
                      name="workInvolvingRiskOfOxygen.measureOxygen"
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
                    {errors.workInvolvingRiskOfOxygen?.measureOxygen && (
                      <FormHelperText error>
                        {errors.workInvolvingRiskOfOxygen.measureOxygen.message}
                      </FormHelperText>
                    )}
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
                          label="Ensure that associates are properly qualified (High place: special education, skill training course for the operation of vehicle for work at height, slinging work: skill training, handling fire: skill training course for gas welding, special education on arc welding, oxygen deficiency: work supervisor, special education"
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
                    8) Work in high temperature areas (70 &deg;C or more):
                  </Grid>
                  <Grid lg={8}>
                    <Controller
                      name="workUsingHighTemp.IsAccepted"
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
                    {errors.workUsingHighTemp?.IsAccepted && (
                      <FormHelperText error>
                        {errors.workUsingHighTemp.IsAccepted.message}
                      </FormHelperText>
                    )}
                  </Grid>
                </Box>
                {watch("workUsingHighTemp.IsAccepted") === "true" && (
                  <FormGroup>
                    <Controller
                      name="workUsingHighTemp.isAssociatesWereSafetyTools"
                      control={control}
                      rules={{
                        required:
                          "This field is required when 'Work in high temperature areas' is Yes",
                      }}
                      render={({ field }) => (
                        <FormControlLabel
                          disabled={safetyForm}
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Wear safety glasses, helmet with face shield, protective equipment (heat resistant gloves, arm covers, etc.)"
                        />
                      )}
                    />
                    {errors.workUsingHighTemp?.isAssociatesWereSafetyTools && (
                      <FormHelperText error>
                        {
                          errors.workUsingHighTemp.isAssociatesWereSafetyTools
                            .message
                        }
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Grid>

              <Grid sm={12} className="border">
                <Box className="d-flex p-1 align-items-center">
                  <h4>Safety is Paramount</h4>
                </Box>
              </Grid>
            </Grid>
            <Grid sm={12} className="border">
              <Box className="d-flex p-1 align-items-center">
                Risk prediction (KY) and preventive measures (one-point KY) ※3:
                Operator conducts on site. Key risks: Is there any potential
                risk? <br /> ※1: Work supervisor: Managerial class personnel in
                charge of maintenance or designated representative who gives
                instructions at work sites.
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
                    disabled={safetyForm}
                    placeholder="Enter Key Risks"
                    {...register("keyRisks", {
                      required:
                        watch("workInsideMachine.IsAccepted") === "true" ||
                        watch("highPressure.IsAccepted") === "true" ||
                        watch("workHandlingHeavyObj.IsAccepted") === "true" ||
                        watch("workAtHeight.IsAccepted") === "true" ||
                        watch("workAtHeight.isAssociatesQualified") ===
                          "true" ||
                        watch("workInvolvingRiskOfOxygen.IsAccepted") ===
                          "true" ||
                        watch("workUsingHighTemp.IsAccepted") === "true"
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
                    disabled={safetyForm}
                    placeholder="Enter Preventive Measures"
                    {...register("preventiveMeasures", {
                      required:
                        watch("workInsideMachine.IsAccepted") === "true" ||
                        watch("highPressure.IsAccepted") === "true" ||
                        watch("workHandlingHeavyObj.IsAccepted") === "true" ||
                        watch("workAtHeight.IsAccepted") === "true" ||
                        watch("workAtHeight.isAssociatesQualified") ===
                          "true" ||
                        watch("workInvolvingRiskOfOxygen.IsAccepted") ===
                          "true" ||
                        watch("workUsingHighTemp.IsAccepted") === "true"
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
                disabled={safetyForm}
              />
              &ensp;
              <span>
                Self declaration: I have checked machine and fixed all Safety
                Devices (Safety area curtain, Safety cover, Emergency Switch,
                Safety plug, Door interlocks etc.) back to original position
                @GENBA
              </span>
              {errors?.finalSafetyAcceptance && (
                <FormHelperText error>
                  {errors?.finalSafetyAcceptance?.message}
                </FormHelperText>
              )}
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
