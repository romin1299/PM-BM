// import {
//   Box,
//   Button,
//   Checkbox,
//   FormControl,
//   FormControlLabel,
//   FormGroup,
//   Grid,
//   Radio,
//   RadioGroup,
//   TextField,
// } from "@mui/material";
// import axios from "axios";
// import React, { useState } from "react";
// import { Controller, useForm } from "react-hook-form";
// import { toast } from "react-toastify";

// const SafetyForm = ({ id }) => {
//   const { handleSubmit, control, reset, register } = useForm({
//     // defaultValues: {
//     //   workInsideMachine: {
//     //     protectiveEquipment: false,
//     //     hadMeeting: false,
//     //     IsAccepted: "No",
//     //   },
//     //   highPressure: {
//     //     notOpenPressureLine: false,
//     //     proper3SWork: false,
//     //     isTrainedStaffAvailable: false,
//     //     IsAccepted: "No",
//     //   },
//     //   workHandlingHeavyObj: {
//     //     visuallyGuessWeight: false,
//     //     prohibitSlingOpWithSingleWire: false,
//     //     wearPersonalProtectiveEquipment: false,
//     //     secureFootingAndHandPosition: false,
//     //     IsAccepted: "No",
//     //   },
//     //   workAtHeight: {
//     //     postASignOfHighPlace: false,
//     //     postASignToUseFire: false,
//     //     secureFootingAndSafetyBelt: false,
//     //     IsAccepted: "No",
//     //   },
//     //   workHandlingFire: {
//     //     takeFirePrevention: false,
//     //     measureOxygen: false,
//     //     isAssociatesQualified: false,
//     //     IsAccepted: "No",
//     //   },
//     //   involvingHandlingOfFlammableLiquid: {
//     //     takeFirePrevention: false,
//     //     measureOxygen: false,
//     //     isAssociatesQualified: false,
//     //     IsAccepted: "No",
//     //   },
//     //   workInvolvingRiskOfOxygen: {
//     //     holdAnObserverAndWearProtectiveEquipment: false,
//     //     isAssociatesQualified: false,
//     //     IsAccepted: "No",
//     //   },
//     //   workUsingHighVoltage: {
//     //     isAssociatesQualified: false,
//     //     IsAccepted: "No",
//     //   },
//     // },
//   });
//   const [workInsideMachine, setWorkInsideMachine] = useState(false);
//   const [highPressure, setHighPressure] = useState(false);
//   const [workHandlingHeavyObj, setorkHandlingHeavyObj] = useState(false);
//   const [workAtHeight, setWorkAtHeight] = useState(false);
//   const [workHandlingFire, setWorkHandlingFire] = useState(false);
//   const [workInvolvingRiskOfOxygen, setWorkInvolvingRiskOfOxygen] =
//     useState(false);
//   const [
//     involvingHandlingOfFlammableLiquid,
//     setInvolvingHandlingOfFlammableLiquid,
//   ] = useState(false);
//   const [workUsingHighVoltage, setWorkUsingHighVoltage] = useState(false);

//   const onSubmit = async (data) => {
//     console.log(data);
//     try {
//       const config = {
//         headers: {
//           "Content-type": "application/json",
//         },
//       };
//       const response = await axios.post(`/addSafetyForm/${id}`, data, config);
//       toast.success(response.data.message);
//       reset();
//       setWorkInsideMachine(false);
//       setHighPressure(false);
//       setorkHandlingHeavyObj(false);
//       setWorkAtHeight(false);
//       setWorkHandlingFire(false);
//       setWorkInvolvingRiskOfOxygen(false);
//       setInvolvingHandlingOfFlammableLiquid(false);
//       setWorkUsingHighVoltage(false);
//     } catch (error) {}
//     // Here you can handle the data, for example, send it to the server.
//   };
//   return (
//     <form onSubmit={handleSubmit(onSubmit)}>
//       <Grid container p={1} rowGap={2}>
//         <Box className="text-center w-100 border-bottom">
//           <h4>SAFETY FORM</h4>
//         </Box>
//         <Grid sm={12} className="border">
//           <Box className="d-flex p-1 align-items-center">
//             <Grid lg={4} fontWeight={650}>
//               Work Name:
//             </Grid>
//             <Grid lg={8}>
//               <TextField
//                 size="small"
//                 placeholder="Enter Work Name"
//                 {...register("workName")}
//               />
//             </Grid>
//             <Grid lg={4} fontWeight={650}>
//               Line Name:
//             </Grid>
//             <Grid lg={8}>"Dummy"</Grid>
//             <Grid lg={4} fontWeight={650}>
//               Machine No:
//             </Grid>
//             <Grid lg={8}>"Dummy"</Grid>
//           </Box>
//         </Grid>
//         <Grid lg={4} mt={1} fontWeight={650}>
//           Work Inside Machine:
//         </Grid>

//         <Grid lg={8} className="d-flex" gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="workInsideMachine.IsAccepted"
//                 onChange={(e) => {
//                   setWorkInsideMachine(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>
//         {workInsideMachine === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="workInsideMachine.protectiveEquipment"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Hold an observer and wear personal protective equipment (helmet, safety glasses) depending on the necessity."
//                   />
//                 )}
//               />
//               <Controller
//                 name="workInsideMachine.hadMeeting"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Hold a meeting before work (to confirm the details, procedures, steps, repetition.)"
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}

//         <Grid lg={4} mt={1} fontWeight={650}>
//           High Pressure (Liquid 30 Mpa, Gas 1 mpa)
//         </Grid>

//         <Grid lg={8} className="d-flex " gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="highPressure.IsAccepted"
//                 onChange={(e) => {
//                   setHighPressure(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>

//         {highPressure === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="highPressure.notOpenPressureLine"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Don't Open Pressure Line during Running."
//                   />
//                 )}
//               />
//               <Controller
//                 name="highPressure.proper3SWork"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Do the Proper 3S for Work"
//                   />
//                 )}
//               />
//               <Controller
//                 name="highPressure.isTrainedStaffAvailable"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Check Trained Staff should available."
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}

//         <Grid lg={4} mt={1} fontWeight={650}>
//           Work handling heavy objects ({">"}20 kg):
//         </Grid>

//         <Grid lg={8} className="d-flex " gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="workHandlingHeavyObj.IsAccepted"
//                 onChange={(e) => {
//                   setorkHandlingHeavyObj(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>

//         {workHandlingHeavyObj === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="workHandlingHeavyObj.visuallyGuessWeight"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Visually guess the weight to use appropriate lifting slings, tools, conveying equipment, etc."
//                   />
//                 )}
//               />
//               <Controller
//                 name="workHandlingHeavyObj.prohibitSlingOpWithSingleWire"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Prohibit to use sling operation using single wire. If it is necessary to do this, use a hook bolt."
//                   />
//                 )}
//               />
//               <Controller
//                 name="workHandlingHeavyObj.wearPersonalProtectiveEquipment"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Wear personal protective equipment (helmet, safety belt/harness, high voltage rubber gloves, boots)"
//                   />
//                 )}
//               />
//               <Controller
//                 name="workHandlingHeavyObj.secureFootingAndHandPosition"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Secure footing and hand position (Check that there is no risk of hand being caught."
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}

//         <Grid lg={4} mt={1} fontWeight={650}>
//           Work at height ({">"}2 metres)
//         </Grid>

//         <Grid lg={8} className="d-flex " gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="workAtHeight.IsAccepted"
//                 onChange={(e) => {
//                   setWorkAtHeight(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>

//         {workAtHeight === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="workAtHeight.postASignOfHighPlace"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Post a sign indicating that high-place work is in progress or high voltage work is in progress"
//                   />
//                 )}
//               />
//               <Controller
//                 name="workAtHeight.postASignToUseFire"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Post a sign indicating the use of fire is permitted. Check that there is no remaining fire in 30 minutes after operations."
//                   />
//                 )}
//               />
//               <Controller
//                 name="workAtHeight.secureFootingAndSafetyBelt"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Secure footing and observe to use safety belt/harness."
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}
//         <Grid lg={4} mt={1} fontWeight={650}>
//           Work handling fire/Work:
//         </Grid>

//         <Grid lg={8} className="d-flex " gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="workHandlingFire.IsAccepted"
//                 onChange={(e) => {
//                   setWorkHandlingFire(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>
//         {workHandlingFire === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="workHandlingFire.takeFirePrevention"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Take fire preventive measures such as the removal of flammable materials (oil, dust) in the vicinity and ensure that the work is monitored by a third person."
//                   />
//                 )}
//               />
//               <Controller
//                 name="workHandlingFire.measureOxygen"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Measure the oxygen concentration (work supervisor) and properly ventilate the work area."
//                   />
//                 )}
//               />
//               <Controller
//                 name="workHandlingFire.isAssociatesQualified"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}

//         <Grid lg={4} mt={1} fontWeight={650}>
//           Involving handling of flammable liquid:
//         </Grid>

//         <Grid lg={8} className="d-flex " gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="involvingHandlingOfFlammableLiquid.IsAccepted"
//                 onChange={(e) => {
//                   setInvolvingHandlingOfFlammableLiquid(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>

//         {involvingHandlingOfFlammableLiquid === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="involvingHandlingOfFlammableLiquid.takeFirePrevention"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Take fire preventive measures such as the removal of flammable materials (oil, dust) in the vicinity and ensure that the work is monitored by a third person."
//                   />
//                 )}
//               />
//               <Controller
//                 name="involvingHandlingOfFlammableLiquid.measureOxygen"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Measure the oxygen concentration (work supervisor) and properly ventilate the work area."
//                   />
//                 )}
//               />
//               <Controller
//                 name="involvingHandlingOfFlammableLiquid.isAssociatesQualified"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}
//         <Grid lg={4} mt={1} fontWeight={650}>
//           Work involving risk of oxygen deficiency:
//         </Grid>

//         <Grid lg={8} className="d-flex " gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="workInvolvingRiskOfOxygen.IsAccepted"
//                 onChange={(e) => {
//                   setWorkInvolvingRiskOfOxygen(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>
//         {workInvolvingRiskOfOxygen === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="workInvolvingRiskOfOxygen.holdAnObserverAndWearProtectiveEquipment"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Hold an observer and wear personal protective equipment (air breathing apparatus, ropes) depending on the necessity."
//                   />
//                 )}
//               />
//               <Controller
//                 name="workInvolvingRiskOfOxygen.isAssociatesQualified"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}
//         <Grid lg={4} mt={1} fontWeight={650}>
//           Work using high voltage electric device:
//         </Grid>

//         <Grid lg={8} className="d-flex " gap={2}>
//           <Box>
//             <FormControl>
//               <RadioGroup
//                 row
//                 name="workUsingHighVoltage.IsAccepted"
//                 onChange={(e) => {
//                   setWorkUsingHighVoltage(e.target.value);
//                 }}
//               >
//                 <FormControlLabel
//                   value={true}
//                   control={<Radio size="small" />}
//                   label="Yes"
//                 />
//                 <FormControlLabel
//                   value={false}
//                   control={<Radio size="small" />}
//                   label="No"
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Box>
//         </Grid>

//         {workUsingHighVoltage === "true" && (
//           <Grid lg={12}>
//             <FormGroup>
//               <Controller
//                 name="workUsingHighVoltage.isAssociatesQualified"
//                 control={control}
//                 render={({ field }) => (
//                   <FormControlLabel
//                     control={<Checkbox {...field} checked={field.value} />}
//                     label="Ensure that associates are properly qualified (High place skill training, electric wire skill training, high voltage special education)."
//                   />
//                 )}
//               />
//             </FormGroup>
//           </Grid>
//         )}

//         <Grid sm={12}>
//           <Box className="border border-bottom-1 p-1 mb-2">
//             <p className="m-0 p-0" style={{ fontWeight: 550 }}>
//               ※ Risk prediction(KY) and preventive measures(one-point KY**){" "}
//               <br />※ 3 TM conducts on site.
//               <br /> ※ 1 Person appointed by the Manager who gives instructions
//               at work sites (In case of 8 high risk operation).
//             </p>
//           </Box>
//           <Box className="d-flex border p-1 align-items-center">
//             <Grid lg={4} fontWeight={650}>
//               Key Risks:
//               <br />
//               <small style={{ fontWeight: 400 }}>
//                 (Is there any potential risk?)
//               </small>
//             </Grid>
//             <Grid lg={8}>
//               <TextField size="small" placeholder="Enter Key Risks" />
//             </Grid>
//             <Grid lg={4} fontWeight={650}>
//               Preventive Measures:
//               <br />
//               <small style={{ fontWeight: 400 }}>
//                 (How can I/we ensure safety?)
//               </small>
//             </Grid>
//             <Grid lg={8}>
//               <TextField size="small" placeholder="Enter Preventive Measures" />
//             </Grid>
//           </Box>
//         </Grid>
//         <Grid item xs={12} mt={2} className="text-center">
//           <Button variant="contained" type="submit">
//             Submit
//           </Button>
//         </Grid>
//       </Grid>
//     </form>
//   );
// };

// export default SafetyForm;