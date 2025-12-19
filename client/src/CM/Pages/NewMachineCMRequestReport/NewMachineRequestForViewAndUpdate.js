import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col, Table, Form, Card, Modal } from "react-bootstrap";
import { FormControl, FormLabel, Button, Tooltip } from "@mui/material";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import PartList from "../../../BM/Tabs/SubComponents/PartList";
import RoutingContext from "../../../context/routing/RoutingContext";
/*
  Replace these with your actual components:
  - Multiselect: the multiselect you used earlier (displayValue: 'tm_name')
  - SparePartsComponent: your existing spare part UI which reads/writes filledByMTD_User.changedParts
  - PhotoPreviewUploader: optional helper to preview/remove selected files (not required)
*/
import Multiselect from "multiselect-react-dropdown"; // or your path
import moment from "moment";
import ShiftInputField from "../../Components/ReqestSheetOfCM/RSComponents/ShiftInputField";
import DropdownComponent from "../../Components/ReqestSheetOfCM/RSComponents/UserApprovalSelectFields/DropdownComponent";
import SupportingTMInputField from "../../Components/ReqestSheetOfCM/RSComponents/SupportingTMInputField";
import SendForApprovalRadioButtons from "../../Components/ReqestSheetOfCM/RSComponents/SendForApprovalRadioButtons";
import ApproveOrRejectComponent from "../../Components/ReqestSheetOfCM/RSComponents/ApproveOrRejectComponent";
// import SparePartsComponent from "./SparePartsComponent";

const API_BASE = "/jobs"; // change if needed

const calculateHours = (from, to) => {
  if (!from || !to) return 0;

  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);

  const start = fh * 60 + fm;
  const end = th * 60 + tm;

  // Handle overnight shifts (e.g., 22:00 → 02:00)
  const diffMinutes = end >= start ? end - start : 24 * 60 - start + end;

  // Convert to hours and round to 2 decimals
  return parseFloat((diffMinutes / 60).toFixed(2));
};

// ------------------- SubJobTable (full-width table for sub jobs) -------------------
function SubJobTable({
  parentIndex,
  control,
  register,
  setValue,
  getValues,
  usersList,
}) {
  const name = `filledByMTD_User.job_details.job_content.${parentIndex}.sub_job_content`;
  const { fields, append, remove } = useFieldArray({ control, name });

  const handleFilesChange = (subIndex, e) => {
    const files = Array.from(e.target.files || []);
    setValue(`${name}.${subIndex}.attachedPhotosByMTD`, files, {
      shouldDirty: true,
    });
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <Table bordered size="sm" className="mb-2">
        <thead className="table-light text-center align-middle">
          <tr>
            <th style={{ width: "2%" }}>Sr</th>
            <th style={{ width: "25%" }}>Sub Job Content</th>{" "}
            {/* Increased width */}
            {/* <th style={{ width: "2%" }}>Expected Time (hrs)</th> */}
            <th style={{ width: "80px" }}>Date</th>
            <th style={{ width: "80px" }}>From</th>
            <th style={{ width: "80px" }}>To</th>
            <th style={{ width: "6%" }}>Time</th>
            <th style={{ width: "5%" }}>%</th>
            <th style={{ width: "8%" }}>Done By (multi)</th>
            <th style={{ width: "15%" }}>Remarks</th>
            <th style={{ width: "80px" }}>Photos</th>
            <th style={{ width: "120px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f, sIdx) => {
            const base = `${name}.${sIdx}`;
            const attachedPath = `${base}.attachedPhotosByMTD`;
            const currentFiles = getValues(attachedPath) || [];
            return (
              <tr key={f.id}>
                <td className="text-center">{sIdx + 1}</td>
                <td>
                  <Form.Control
                    {...register(`${base}.child_job_name`, { required: false })}
                    size="sm"
                    defaultValue={f.child_job_name || ""}
                  />
                </td>
                <td>
                  <Form.Control
                    type="date"
                    {...register(`${base}.date`)}
                    size="sm"
                    defaultValue={f.date || ""}
                  />
                </td>
                <td>
                  <Form.Control
                    type="time"
                    {...register(`${base}.from`)}
                    size="sm"
                    defaultValue={f.from || ""}
                    onChange={(e) => {
                      const start = e.target.value;
                      const end = getValues(`${base}.to`);
                      if (start && end) {
                        const diff = calculateHours(start, end);
                        setValue(`${base}.time_taken`, diff);
                      }
                    }}
                  />
                </td>
                <td>
                  <Form.Control
                    type="time"
                    {...register(`${base}.to`)}
                    size="sm"
                    defaultValue={f.to || ""}
                    onChange={(e) => {
                      const start = getValues(`${base}.from`);
                      const end = e.target.value;
                      if (start && end) {
                        const diff = calculateHours(start, end);
                        setValue(`${base}.time_taken`, diff);
                      }
                    }}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    className="form-control"
                    {...register(`${base}.time_taken`)}
                    size="sm"
                    readOnly
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    {...register(`${base}.percentage`)}
                    size="sm"
                    defaultValue={f.percentage ?? 0}
                  />
                </td>
                <td>
                  <Controller
                    control={control}
                    name={`${base}.doneBy`}
                    defaultValue={f.doneBy || []}
                    render={({ field }) => (
                      <Multiselect
                        {...field}
                        options={usersList}
                        displayValue="tm_name"
                        onSelect={(selectedList) =>
                          field.onChange(selectedList)
                        }
                        onRemove={(selectedList) =>
                          field.onChange(selectedList)
                        }
                        selectedValues={field.value || []}
                        style={{ multiselectContainer: { width: "10rem" } }}
                      />
                    )}
                  />
                </td>
                <td>
                  <Form.Control
                    {...register(`${base}.remarks`)}
                    size="sm"
                    defaultValue={f.remarks || ""}
                  />
                </td>
                <td>
                  <Form.Control
                    type="file"
                    multiple
                    size="sm"
                    onChange={(e) => handleFilesChange(sIdx, e)}
                  />
                  {/* list names and allow removal */}
                  <div className="mt-1">
                    {(currentFiles || []).map((file, fi) => (
                      <div key={fi} className="d-flex align-items-center">
                        <small className="me-2">{file.name || file}</small>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            const arr = (getValues(attachedPath) || []).slice();
                            arr.splice(fi, 1);
                            setValue(attachedPath, arr, { shouldDirty: true });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(sIdx)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}

          <tr>
            <td colSpan={10} className="text-center">
              <Button
                variant="success"
                size="sm"
                onClick={() =>
                  append({
                    child_job_name: "",
                    date: "",
                    from: "",
                    to: "",
                    time_taken: 0,
                    percentage: 0,
                    doneBy: [],
                    remarks: "",
                    attachedPhotosByMTD: [],
                  })
                }
              >
                + Add Sub Content
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

// ------------------- Parent Job Table (with accordion to show sub table) -------------------
function JobDetailsTable({
  control,
  register,
  setValue,
  getValues,
  watch,
  usersList,
}) {
  const { fields: jobContentFields } = useFieldArray({
    control,
    name: "filledByMTD_User.job_details.job_content",
  });

  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggle = (i) => setExpandedIndex(expandedIndex === i ? null : i);

  const handleParentFiles = (idx, e) => {
    const files = Array.from(e.target.files || []);
    setValue(
      `filledByMTD_User.job_details.job_content.${idx}.attachedPhotosByMTD`,
      files,
      { shouldDirty: true }
    );
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <Table bordered size="sm">
        <thead className="table-light text-center align-middle">
          <tr>
            <th style={{ width: "2%" }}>Sr</th>
            <th style={{ width: "25%" }}>Job Content</th>{" "}
            {/* Increased width */}
            {/* <th style={{ width: "2%" }}>Expected Time (hrs)</th> */}
            <th style={{ width: "80px" }}>Date</th>
            <th style={{ width: "80px" }}>From</th>
            <th style={{ width: "80px" }}>To</th>
            <th style={{ width: "6%" }}>Time</th>
            <th style={{ width: "5%" }}>%</th>
            <th style={{ width: "8%" }}>Done By (multi)</th>
            <th style={{ width: "15%" }}>Remarks</th>
            <th style={{ width: "80px" }}>Photos</th>
            <th style={{ width: "120px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {jobContentFields.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                No parent content. Select a Job template to load.
              </td>
            </tr>
          )}

          {jobContentFields.map((p, idx) => {
            const attachedPath = `filledByMTD_User.job_details.job_content.${idx}.attachedPhotosByMTD`;
            const currentFiles = getValues(attachedPath) || [];

            return (
              <React.Fragment key={p.id}>
                <tr>
                  <td className="text-center">{idx + 1}</td>

                  <td>
                    <Form.Control
                      type="text"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.parent_job_name`,
                        { required: false }
                      )}
                      defaultValue={p.parent_job_name || ""}
                      size="sm"
                    />
                  </td>

                  {/* <td>
                    <Form.Control
                      type="number"
                      className="form-control"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.expectedTime`
                      )}
                      size="sm"
                      defaultValue={p.expectedTime ?? ""}
                    />
                  </td> */}
                  <td>
                    <Form.Control
                      type="date"
                      className="form-control"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.date`,
                        { required: "Date is required" }
                      )}
                      size="sm"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="time"
                      className="form-control"
                      size="sm"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.from`,
                        { required: "Start time required" }
                      )}
                      onChange={(e) => {
                        const start = e.target.value;
                        const end = getValues(
                          `filledByMTD_User.job_details.job_content.${idx}.to`
                        );
                        if (start && end) {
                          const diff = calculateHours(start, end);
                          setValue(
                            `filledByMTD_User.job_details.job_content.${idx}.time_taken`,
                            diff
                          );
                        }
                      }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="time"
                      className="form-control"
                      size="sm"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.to`,
                        { required: "End time required" }
                      )}
                      onChange={(e) => {
                        const end = e.target.value;
                        const start = getValues(
                          `filledByMTD_User.job_details.job_content.${idx}.from`
                        );
                        if (start && end) {
                          const diff = calculateHours(start, end);
                          setValue(
                            `filledByMTD_User.job_details.job_content.${idx}.time_taken`,
                            diff
                          );
                        }
                      }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      className="form-control"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.time_taken`
                      )}
                      size="sm"
                      readOnly
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      className="form-control"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.percentage`
                      )}
                      size="sm"
                      defaultValue={p.percentage ?? ""}
                    />
                  </td>

                  <td>
                    <Controller
                      control={control}
                      size="sm"
                      name={`filledByMTD_User.job_details.job_content.${idx}.doneBy`}
                      defaultValue={p.doneBy || []}
                      render={({ field }) => (
                        <Multiselect
                          {...field}
                          options={usersList}
                          displayValue="tm_name"
                          onSelect={(selectedList) =>
                            field.onChange(selectedList)
                          }
                          onRemove={(selectedList) =>
                            field.onChange(selectedList)
                          }
                          selectedValues={field.value || []}
                          style={{ multiselectContainer: { width: "10rem" } }}
                        />
                      )}
                    />
                  </td>

                  <td>
                    <Form.Control
                      type="text"
                      className="form-control"
                      {...register(
                        `filledByMTD_User.job_details.job_content.${idx}.remarks`
                      )}
                      size="sm"
                      defaultValue={p.remarks || ""}
                    />
                  </td>

                  <td>
                    <Form.Control
                      type="file"
                      className="form-control"
                      multiple
                      size="sm"
                      onChange={(e) => handleParentFiles(idx, e)}
                    />
                    <div className="mt-1">
                      {currentFiles.map((file, fi) => (
                        <div key={fi} className="d-flex align-items-center">
                          <small className="me-2">{file.name || file}</small>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              const arr = (
                                getValues(attachedPath) || []
                              ).slice();
                              arr.splice(fi, 1);
                              setValue(attachedPath, arr, {
                                shouldDirty: true,
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td>
                    <div className="d-flex flex-column">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mb-1"
                        onClick={() => toggle(idx)}
                      >
                        {expandedIndex === idx
                          ? "Hide Sub Jobs"
                          : "Manage Sub Jobs"}
                      </Button>
                      {/* <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeParent(idx)}
                      >
                        Delete
                      </Button> */}
                    </div>
                  </td>
                </tr>

                {/* full-width sub table row */}
                {expandedIndex === idx && (
                  <tr>
                    <td colSpan={11} className="p-0 bg-light">
                      <div>
                        <h6 className="mb-2 text">Sub Job Content Details :</h6>
                        <SubJobTable
                          parentIndex={idx}
                          control={control}
                          register={register}
                          setValue={setValue}
                          getValues={getValues}
                          usersList={usersList}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {/* <tr>
            <td colSpan={7} className="text-center">
              <Button variant="outline-primary" size="sm" onClick={() => appendParent({
                parent_job_name: "",
                expectedTime: 0,
                date: "",
                from: "",
                to: "",
                time_taken: 0,
                percentage: 0,
                doneBy: [],
                remarks: "",
                attachedPhotosByMTD: [],
                sub_job_content: [],
              })}>
                + Add Parent Job
              </Button>
            </td>
          </tr> */}
        </tbody>
      </Table>
    </div>
  );
}

// ------------------- MAIN COMPONENT -------------------
export default function NewMachineRequestForViewAndUpdate({
  handlePopupStatus,
  selectedYear,
  isEditable,
  newMachineCmReqSheetView,
  selectedRowRequestSheetId,
  machine_code,
  isOtherFieldsEditableOrNot,
}) {
  const navigate = useNavigate();
  const params = useParams(); // contains machine_code and currentYear maybe
  // const machine_code = params?.machine_code;
  // const selectedYear = params?.selectedYear;
  const context = useContext(RoutingContext);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    trigger,
    setError,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm({
    defaultValues: async () => {
      if (!selectedRowRequestSheetId) {
        return {
          requestSheetNoOfNewMachineCM: "",
          newMachineRequestFilledByPED: {
            scopeOfCM: "",
            requestOn: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
            requiredOn: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
            modificationWork: [],
            purposeOfCM: "",
            riskAssessment: "No",
            safetyRelated: "No",
            qualityRelated: "No",
          },
          filledByMTD_User: {
            jobForNewMachineCM: "",
            job_details: {
              job_name: "",
              job_content: [],
            },
          },
          isJobFinished: "No",
        };
      }

      // Fetch existing data
      try {
        const response = await axios.get(
          `/newMachineCM-requestSheets/${selectedRowRequestSheetId}`
        );
        const data = response.data?.requestSheet;
        return data;
      } catch (err) {
        console.error("Failed to fetch data", err);
        return {}; // Return empty object on error
      }
    },
  });

  // top-level arrays
  const {
    fields: modWorkFields,
    append: addModWork,
    remove: removeModWork,
  } = useFieldArray({
    control,
    name: "newMachineRequestFilledByPED.modificationWork",
  });

  // job_content array handled inside JobDetailsTable; we still use useFieldArray in that child via control

  // local lists (jobs, users, machines)
  const [jobsList, setJobsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [machineDetails, setMachineDetails] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);

  // load initial data
  useEffect(() => {
    const fetch = async () => {
      try {
        const [job, userList] = await Promise.all([
          axios.get(`${API_BASE}`),
          // axios.get(
          //   `/getMachineDetailsOnScanningRequest/?machine_code=${machine_code}&&current_year=${selectedYear}`
          // ),
          axios.get(`/getApprovalUserList`),
        ]);
        setJobsList(job?.data || []);
        setUsersList(
          userList?.data?.userList
          // requestSheetApprovalList?.data?.requestSheetApprovalList || []
        );
        // setMachineDetails(requestSheetApprovalList?.data?.machine);
      } catch (err) {
        console.error("Fetch init failed", err);
      }
    };
    fetch();
  }, []);

  // when job selected -> fetch job content and deep copy into job_details.job_content
  const jobId = watch("filledByMTD_User.jobForNewMachineCM");
  useEffect(() => {
    if (!jobId) return;
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/${jobId}`);
        const job = res.data;
        // deep copy with empty common fields for form editing
        const copied = (job.job_content || []).map((p) => ({
          parent_job_name: p.parent_job_name,
          expectedTime: p.expectedTime,
          date: "",
          from: "",
          to: "",
          time_taken: 0,
          percentage: 0,
          doneBy: [],
          remarks: "",
          attachedPhotosByMTD: [],
          sub_job_content: (p.sub_job_content || []).map((s) => ({
            child_job_name: s.child_job_name,
            date: "",
            from: "",
            to: "",
            time_taken: 0,
            percentage: 0,
            doneBy: [],
            remarks: "",
            attachedPhotosByMTD: [],
          })),
        }));
        setValue("filledByMTD_User.job_details.job_name", job.job_name || "");
        setValue("filledByMTD_User.job_details.job_content", copied);
      } catch (err) {
        console.error("Failed to fetch job details", err);
        setValue("filledByMTD_User.job_details.job_content", []);
      }
    };
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // extract only dirty fields from payload
  const extractDirty = (values) => {
    let newVal = {};

    const objValueMappingFunction = (dirtyFields, key, allValues) => {
      const dirty = dirtyFields[key];

      // 🛑 If the key has nested dirty fields, ALWAYS send full object
      if (typeof dirty === "object") {
        return { [key]: { ...allValues[key] } };
      }

      // primitive change (fallback)
      return { [key]: allValues[key] };
    };

    Object.keys(dirtyFields)?.forEach((key) => {
      // Object case (fields inside changed)
      if (typeof values[key] === "object") {
        newVal = {
          ...newVal,
          ...objValueMappingFunction(dirtyFields, key, values),
        };
      } else {
        // primitive case
        newVal[key] = values[key];
      }
    });

    return newVal;
  };

  const onSubmit = async (payload) => {
    try {
      // 🔥 build only changed fields
      const changedPayload = extractDirty(payload);
      const fd = new FormData();
      fd.append("payload", JSON.stringify(changedPayload));
      // 🔥 Files must ALWAYS be included if they exist
      const jobContents =
        payload?.filledByMTD_User?.job_details?.job_content || [];
      if (jobContents?.length > 0)
        jobContents.forEach((job, i) => {
          (job.attachedPhotosByMTD || []).forEach((file, j) => {
            if (file instanceof File) {
              fd.append(
                `filledByMTD_User.job_details.job_content[${i}].attachedPhotosByMTD[${j}]`,
                file
              );
            }
          });
          (job.sub_job_content || []).forEach((sub, k) => {
            (sub.attachedPhotosByMTD || []).forEach((file, m) => {
              if (file instanceof File) {
                fd.append(
                  `filledByMTD_User.job_details.job_content[${i}].sub_job_content[${k}].attachedPhotosByMTD[${m}]`,
                  file
                );
              }
            });
          });
        });
      const res = await axios.post(
        `/newMachineCM-requestSheets/?machineRef=${
          machineDetails?._id || watch("machineId")
        }&_id=${watch(
          "_id"
        )}&isOtherFieldsEditableOrNot=${isOtherFieldsEditableOrNot}&statusOfNewRequestOfCM=${watch(
          "statusOfNewRequestOfCM"
        )}&getDataForApprovalDashboard=${watch("getDataForApprovalDashboard")}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res?.data) navigate(-1);
    } catch (err) {
      console.error("Submit failed", err);
      alert("Failed to submit request sheet.");
    }
  };

  //multi user assign (MTD TL/HOSS)
  // const isEditable = watch(
  //   "filledByMTD_User.modificationWork_AssignedMTD_TL"
  // )?.some((assignedUser) => assignedUser._id === context?._id);

  return (
    <div className="border border-dark">
      <Modal
        show={newMachineCmReqSheetView}
        fullscreen
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header className="d-flex justify-content-between">
          <Modal.Title id="contained-modal-title-vcenter">
            NEW MACHINE MODIFICATION REQUEST SHEET (CM)
          </Modal.Title>
          <Button
            variant="secondary"
            onClick={handlePopupStatus}
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
          <Container fluid className="p-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* machine header */}
              <Table bordered size="sm" className="m-3">
                <tbody>
                  <tr>
                    <th style={{ width: "18%" }}>Machine Name</th>
                    <td>{watch("machineName") || "-"}</td>
                    <th>Machine Code</th>
                    <td>{machine_code || "-"}</td>
                    <th>Department / Line</th>
                    <td>
                      {watch("cell") || "-"}/{watch("line") || "-"}
                    </td>
                  </tr>
                </tbody>
              </Table>

              {/* PED section */}
              <Card className="m-3">
                <Card.Header className="fw-bold bg-light">
                  To be Filled by Requested Department (PED)
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col md={4}>
                      <Form.Label>Request Sheet No</Form.Label>
                      <Form.Control
                        // {...register("requestSheetNoOfNewMachineCM")}
                        value={watch("requestSheetNoOfNewMachineCM")}
                        size="sm"
                        readOnly
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label>Scope of CM</Form.Label>
                      <Form.Control
                        {...register("newMachineRequestFilledByPED.scopeOfCM")}
                        size="sm"
                        readOnly={
                          isOtherFieldsEditableOrNot !== "No" || !isEditable
                        }
                      />
                    </Col>
                    <Col md={4}>
                      <ShiftInputField
                        dateAndTime={watch(
                          "newMachineRequestFilledByPED.requestOn"
                        )}
                        shiftOfBM={watch(
                          "newMachineRequestFilledByPED.shiftOfNewCM"
                        )}
                        setValue={setValue}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-2">
                    <Col md={2}>
                      <Form.Label>Request On</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        {...register("newMachineRequestFilledByPED.requestOn")}
                        size="sm"
                        readOnly={
                          isOtherFieldsEditableOrNot !== "No" || !isEditable
                        }
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Label>Required On</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        {...register("newMachineRequestFilledByPED.requiredOn")}
                        size="sm"
                        readOnly={
                          isOtherFieldsEditableOrNot !== "No" || !isEditable
                        }
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Label>Prepared By (PED TL)</Form.Label>
                      <Form.Control
                        // {...register(
                        //   "newMachineRequestFilledByPED.preparedByPED_TL"
                        // )}
                        size="sm"
                        disabled
                        value={watch(
                          "newMachineRequestFilledByPED.preparedByPED_TL.tm_name"
                        )}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Label>Checked By (PED HOS)</Form.Label>
                      {["Generated", "Rejected"]?.includes(
                        watch("statusOfNewRequestOfCM")
                      ) && isEditable ? (
                        //   ||
                        // isOtherFieldsEditableOrNot === "Yes"
                        <DropdownComponent
                          requiredMSG={isEditable ? "Please select" : false}
                          isEditable={
                            isOtherFieldsEditableOrNot === "Yes" || isEditable
                          }
                          setValue={setValue}
                          // title="Select PED HOS:"
                          userDropdown={usersList?.PEDHOSList}
                          label="Select PED HOS"
                          formKey="PED_Filled_CheckedBy_PED_HOS.checkedByPED_HOS"
                          register={register}
                          watch={watch}
                        />
                      ) : (
                        <>
                          <br />
                          <Form.Control
                            size="sm"
                            disabled
                            value={
                              (watch(
                                "PED_Filled_CheckedBy_PED_HOS.checkedByPED_HOS.tm_name"
                              ) || "") +
                              " - " +
                              (watch(
                                "PED_Filled_CheckedBy_PED_HOS.checkedByPED_HOS.approvalStatus"
                              ) || "")
                            }
                          />
                        </>
                      )}
                      {errors?.PED_Filled_CheckedBy_PED_HOS?.checkedByPED_HOS?.[
                        `userRef`
                      ] && (
                        <p className="text-error">
                          {
                            errors?.PED_Filled_CheckedBy_PED_HOS
                              ?.checkedByPED_HOS?.[`userRef`]?.message
                          }
                        </p>
                      )}
                    </Col>

                    <Col md={2}>
                      <Form.Label>Approved By (PED HOD)</Form.Label>
                      {["Generated", "Rejected"]?.includes(
                        watch("statusOfNewRequestOfCM")
                      ) && isEditable ? (
                        //   ||
                        // isOtherFieldsEditableOrNot === "Yes"
                        <DropdownComponent
                          requiredMSG={isEditable ? "Please select" : false}
                          isEditable={
                            isOtherFieldsEditableOrNot !== "No" || isEditable
                          }
                          setValue={setValue}
                          // title="Select PED HOS:"
                          userDropdown={usersList?.PEDHODList}
                          label="Select PED HOD"
                          formKey="PED_Filled_ApprovedBy_PED_HOD.approvedByPED_HOD"
                          register={register}
                          watch={watch}
                        />
                      ) : (
                        <>
                          <br />
                          <Form.Control
                            size="sm"
                            disabled
                            value={
                              (watch(
                                "PED_Filled_ApprovedBy_PED_HOD.approvedByPED_HOD.tm_name"
                              ) || "") +
                              " - " +
                              (watch(
                                "PED_Filled_ApprovedBy_PED_HOD.approvedByPED_HOD.approvalStatus"
                              ) || "")
                            }
                          />
                        </>
                      )}
                      {errors?.PED_Filled_ApprovedBy_PED_HOD
                        ?.approvedByPED_HOD?.[`userRef`] && (
                        <p className="text-error">
                          {
                            errors?.PED_Filled_ApprovedBy_PED_HOD
                              ?.approvedByPED_HOD?.[`userRef`]?.message
                          }
                        </p>
                      )}
                    </Col>
                  </Row>

                  {/* modificationWork dynamic */}
                  <Row>
                    <Col md={4}>
                      <Table bordered size="sm">
                        <thead className="table-light">
                          <tr>
                            <th>Sr</th>
                            <th>MODIFICATION WORK REQUEST (With Concept)</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modWorkFields.map((m, mi) => (
                            <tr key={m.id}>
                              <td>{mi + 1}</td>
                              <td>
                                <Form.Control
                                  as="textarea"
                                  {...register(
                                    `newMachineRequestFilledByPED.modificationWork.${mi}.modificationConcept`
                                  )}
                                  size="sm"
                                />
                              </td>
                              <td>
                                <Button
                                  variant="contained"
                                  size="sm"
                                  onClick={() => removeModWork(mi)}
                                  color="error"
                                  disabled={
                                    isOtherFieldsEditableOrNot !== "No" ||
                                    !isEditable
                                  }
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={3} className="text-center">
                              <Button
                                variant="contained"
                                size="sm"
                                onClick={() =>
                                  addModWork({ modificationConcept: "" })
                                }
                                disabled={
                                  isOtherFieldsEditableOrNot !== "No" ||
                                  !isEditable
                                }
                              >
                                + Add Concept
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={2}>
                      <Form.Label>Purpose of CM</Form.Label>
                      <Form.Control
                        {...register(
                          "newMachineRequestFilledByPED.purposeOfCM"
                        )}
                        readOnly={isOtherFieldsEditableOrNot !== "No"}
                        size="sm"
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Label>Risk Assessment</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          label="Yes"
                          type="radio"
                          value="Yes"
                          disabled={
                            isOtherFieldsEditableOrNot !== "No" || !isEditable
                          }
                          {...register(
                            "newMachineRequestFilledByPED.riskAssessment"
                          )}
                        />
                        <Form.Check
                          inline
                          label="No"
                          type="radio"
                          value="No"
                          disabled={
                            isOtherFieldsEditableOrNot !== "No" || !isEditable
                          }
                          {...register(
                            "newMachineRequestFilledByPED.riskAssessment"
                          )}
                        />
                      </div>
                    </Col>
                    <Col md={2}>
                      <Form.Label>Safety Related</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          label="Yes"
                          type="radio"
                          value="Yes"
                          disabled={
                            isOtherFieldsEditableOrNot !== "No" || !isEditable
                          }
                          {...register(
                            "newMachineRequestFilledByPED.safetyRelated"
                          )}
                        />
                        <Form.Check
                          inline
                          label="No"
                          type="radio"
                          value="No"
                          disabled={
                            isOtherFieldsEditableOrNot !== "No" || !isEditable
                          }
                          {...register(
                            "newMachineRequestFilledByPED.safetyRelated"
                          )}
                        />
                      </div>
                    </Col>
                    <Col md={2}>
                      <Form.Label>Quality Related</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          label="Yes"
                          type="radio"
                          value="Yes"
                          disabled={
                            isOtherFieldsEditableOrNot !== "No" || !isEditable
                          }
                          {...register(
                            "newMachineRequestFilledByPED.qualityRelated"
                          )}
                        />
                        <Form.Check
                          inline
                          label="No"
                          type="radio"
                          value="No"
                          disabled={
                            isOtherFieldsEditableOrNot !== "No" || !isEditable
                          }
                          {...register(
                            "newMachineRequestFilledByPED.qualityRelated"
                          )}
                        />
                      </div>
                    </Col>
                  </Row>

                  {/* <Row className="mb-2">
              <Col md={3}>
                <Form.Label>Purpose of CM</Form.Label>
                <Form.Control
                  {...register("newMachineRequestFilledByPED.purposeOfCM")}
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Label>Risk Assessment</Form.Label>
                <div>
                  <Form.Check
                    inline
                    label="Yes"
                    type="radio"
                    value="Yes"
                    {...register("newMachineRequestFilledByPED.riskAssessment")}
                  />
                  <Form.Check
                    inline
                    label="No"
                    type="radio"
                    value="No"
                    {...register("newMachineRequestFilledByPED.riskAssessment")}
                  />
                </div>
              </Col>
              <Col md={2}>
                <Form.Label>Safety Related</Form.Label>
                <div>
                  <Form.Check
                    inline
                    label="Yes"
                    type="radio"
                    value="Yes"
                    {...register("newMachineRequestFilledByPED.safetyRelated")}
                  />
                  <Form.Check
                    inline
                    label="No"
                    type="radio"
                    value="No"
                    {...register("newMachineRequestFilledByPED.safetyRelated")}
                  />
                </div>
              </Col>
              <Col md={2}>
                <Form.Label>Quality Related</Form.Label>
                <div>
                  <Form.Check
                    inline
                    label="Yes"
                    type="radio"
                    value="Yes"
                    {...register("newMachineRequestFilledByPED.qualityRelated")}
                  />
                  <Form.Check
                    inline
                    label="No"
                    type="radio"
                    value="No"
                    {...register("newMachineRequestFilledByPED.qualityRelated")}
                  />
                </div>
              </Col>
              <Col md={3}>
                <ShiftInputField
                  dateAndTime={watch("newMachineRequestFilledByPED.requestOn")}
                  shiftOfBM={watch("shiftOfBM")}
                  setValue={setValue}
                />
              </Col>
            </Row> */}
                </Card.Body>
              </Card>
              <Card className="m-3">
                <Row>
                  <Col sm={6} md={4}>
                    <Card.Header className="fw-bold bg-light">
                      MODIFICATION WORK APPROVAL FROM MTD
                    </Card.Header>
                  </Col>
                  <Col sm={6} md={3} className="d-flex align-items-center">
                    <Form.Label>MTD TL/HOSS</Form.Label>
                    <Controller
                      name="supportingTM"
                      control={control}
                      render={({ field }) => (
                        <Multiselect
                          {...field}
                          displayValue="tm_name"
                          className="col-9 "
                          disable={
                            isOtherFieldsEditableOrNot === "Yes" ||
                            (context?.tm_department !== "MTD" &&
                              context?.tm_grade !== "HOS")
                          }
                          options={usersList?.MTDTLList} // Options to display in the dropdown
                          // selectedValues={departmentList} // Preselected value to persist in dropdown
                          onSelect={async (selectedList) => {
                            setValue(
                              "filledByMTD_User.modificationWork_AssignedMTD_TL",
                              selectedList,
                              { shouldDirty: true }
                            );
                          }} // Function will trigger on select event
                          onRemove={async (selectedList) => {
                            setValue(
                              "filledByMTD_User.modificationWork_AssignedMTD_TL",
                              selectedList,
                              { shouldDirty: true }
                            );
                          }} // Function will trigger on remove event
                          style={{
                            multiselectContainer: {
                              width: "15rem",
                            },
                          }}
                          selectedValues={watch(
                            "filledByMTD_User.modificationWork_AssignedMTD_TL"
                          )}
                        />
                      )}
                    />
                  </Col>
                  <Col sm={6} md={2}>
                    <Form.Label>MTD HOS</Form.Label>
                    {["Generated", "Rejected"]?.includes(
                      watch("statusOfNewRequestOfCM")
                    ) && isEditable ? (
                      <DropdownComponent
                        requiredMSG={false ? "Please select" : false}
                        isEditable={
                          isEditable || isOtherFieldsEditableOrNot === "Yes"
                        }
                        setValue={setValue}
                        // title="Select PED HOS:"
                        userDropdown={usersList?.MTDHOSList}
                        label="Select MTD HOS"
                        formKey="MTD_Modification_ApprovedByMTD_HOS.modificationWork_ApprovedByMTD_HOS"
                        register={register}
                        watch={watch}
                      />
                    ) : (
                      <>
                        <br />
                        <Form.Control
                          size="sm"
                          disabled
                          value={
                            (watch(
                              "MTD_Modification_ApprovedByMTD_HOS.modificationWork_ApprovedByMTD_HOS.tm_name"
                            ) || "") +
                            " - " +
                            (watch(
                              "MTD_Modification_ApprovedByMTD_HOS.modificationWork_ApprovedByMTD_HOS.approvalStatus"
                            ) || "")
                          }
                        />
                      </>
                    )}
                    {errors?.MTD_Modification_ApprovedByMTD_HOS
                      ?.modificationWork_ApprovedByMTD_HOS?.[`userRef`] && (
                      <p className="text-error">
                        {
                          errors?.MTD_Modification_ApprovedByMTD_HOS
                            ?.modificationWork_ApprovedByMTD_HOS?.[`userRef`]
                            ?.message
                        }
                      </p>
                    )}
                  </Col>
                  <Col sm={6} md={2}>
                    <Form.Label>MTD HOD</Form.Label>
                    {(["Generated", "Rejected"]?.includes(
                      watch("statusOfNewRequestOfCM")
                    ) &&
                      isEditable) ||
                    (context?.tm_department === "MTD" &&
                      context?.tm_grade === "HOS") ? (
                      <DropdownComponent
                        requiredMSG={false ? "Please select" : false}
                        isEditable={
                          isEditable || isOtherFieldsEditableOrNot === "Yes"
                        }
                        setValue={setValue}
                        // title="Select PED HOS:"
                        userDropdown={usersList?.MTDHODList}
                        label="Select MTD HOD"
                        formKey="MTD_Modification_ApprovedByMTD_HOD.modificationWork_ApprovedByMTD_HOD"
                        register={register}
                        watch={watch}
                      />
                    ) : (
                      <>
                        <br />
                        <Form.Control
                          size="sm"
                          disabled
                          value={
                            (watch(
                              "MTD_Modification_ApprovedByMTD_HOD.modificationWork_ApprovedByMTD_HOD.tm_name"
                            ) || "") +
                            " - " +
                            (watch(
                              "MTD_Modification_ApprovedByMTD_HOD.modificationWork_ApprovedByMTD_HOD.approvalStatus"
                            ) || "")
                          }
                        />
                      </>
                    )}
                    {errors?.MTD_Modification_ApprovedByMTD_HOD
                      ?.modificationWork_ApprovedByMTD_HOD?.[`userRef`] && (
                      <p className="text-error">
                        {
                          errors?.MTD_Modification_ApprovedByMTD_HOD
                            ?.modificationWork_ApprovedByMTD_HOD?.[`userRef`]
                            ?.message
                        }
                      </p>
                    )}
                  </Col>
                </Row>
              </Card>

              {/* MTD SECTION */}
              <Card className="m-3">
                <Card.Header className="fw-bold bg-light">
                  MODIFICATION WORK REPORT ( To be filled by MTD)
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col md={3}>
                      <Form.Label>Select Job</Form.Label>
                      <Form.Select
                        disabled={!isEditable}
                        {...register("filledByMTD_User.jobForNewMachineCM")}
                        size="sm"
                      >
                        <option value="">-- Select Job --</option>
                        {jobsList?.map((j) => (
                          <option key={j._id} value={j._id}>
                            {j.job_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <JobDetailsTable
                    control={control}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    watch={watch}
                    usersList={usersList?.MTDTLList}
                  />
                </Card.Body>
              </Card>

              {/* MODIFICATION WORK REPORT (To be filled by MTD) */}
              {/* <Card className="m-3">
          <Card.Header className="fw-bold bg-light">
            MODIFICATION WORK REPORT (To be filled by MTD)
          </Card.Header>
          <Card.Body>
            <Row className="mb-2">
              <Col md={2}>
                <Form.Label>Work Started (Date)</Form.Label>
                <Form.Control
                  type="date"
                  {...register("filledByMTD_User.workStartedDate")}
                  size="sm"
                />
              </Col>
              <Col md={1}>
                <Form.Label>Time</Form.Label>
                <Form.Control
                  type="time"
                  {...register("filledByMTD_User.workStartedTime")}
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Label>Work Ended (Date)</Form.Label>
                <Form.Control
                  type="date"
                  {...register("filledByMTD_User.workEndedDate")}
                  size="sm"
                />
              </Col>
              <Col md={1}>
                <Form.Label>Time</Form.Label>
                <Form.Control
                  type="time"
                  {...register("filledByMTD_User.workEndedTime")}
                  size="sm"
                />
              </Col>
              <Col md={6}>
                <Form.Label>Attended By</Form.Label>
                <Form.Select
                  {...register("filledByMTD_User.attendedBy")}
                  size="sm"
                >
                  <option value="">Select</option>
                  {usersList?.mtdTL?.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.tm_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <Row className="mb-2">
              <Col>
                <Form.Label>Modification Work Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  {...register("filledByMTD_User.modificationWorkDescription")}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card> */}

              {/* Spare parts placeholder */}
              <Card className="m-3">
                <Card.Header className="fw-bold bg-light">
                  SPARE PARTS
                </Card.Header>
                <Card.Body>
                  {/* Replace with your spare part component which reads/writes filledByMTD_User.changedParts */}
                  <div>
                    <PartList
                      parts={parts}
                      setParts={setParts}
                      isEditable={isEditable}
                    />
                  </div>
                </Card.Body>
              </Card>

              {/* Confirmation & Comments */}
              <Card className="m-3">
                <Card.Header className="fw-bold bg-light">
                  CONFIRMATION & COMMENTS
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col md={6}>
                      <Form.Label>
                        Modification Confirmation After Completion
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        {...register("modificationConfirmationAfterCompletion")}
                        readOnly={!isEditable}
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label>Special Comments</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        {...register("SpecialComments")}
                        readOnly={!isEditable}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-2">
                    <Col md={2}>
                      <Form.Label>Is Job Finished?</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          label="Yes"
                          value="Yes"
                          {...register("isJobFinished")}
                          disabled={!isEditable}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="No"
                          value="No"
                          {...register("isJobFinished")}
                          disabled={!isEditable}
                        />
                      </div>
                    </Col>
                    <Col md={4}>
                      <Form.Label>Requested Dept.</Form.Label>
                      <div className="d-flex">
                        <Col md={6}>
                          <Form.Label>Approved By (PED HOS)</Form.Label>
                          <Form.Select
                            {...register("approvedByPED_HOS")}
                            size="sm"
                            disabled={!isEditable}
                          >
                            <option value="">Select</option>
                            {usersList?.PEDHOSList?.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.tm_name}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={6}>
                          <Form.Label>Checked By (PED TL/HOSS)</Form.Label>
                          <Form.Select
                            {...register("checkedByPED_TL")}
                            size="sm"
                            disabled={!isEditable}
                          >
                            <option value="">Select</option>
                            {usersList?.PEDTLList?.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.tm_name}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                      </div>
                    </Col>

                    <Col md={6}>
                      <Form.Label>MTD</Form.Label>
                      <div className="d-flex">
                        <Col md={4}>
                          <Form.Label>Approved By (MTD HOS)</Form.Label>
                          <Form.Select
                            {...register("approvedByMTD_HOS")}
                            size="sm"
                            disabled={!isEditable}
                          >
                            <option value="">Select</option>
                            {usersList?.MTDHOSList?.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.tm_name}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={6}>
                          <Form.Label>
                            Checked By & Prepared By(MTD TL/HOSS)
                          </Form.Label>

                          {/* <Form.Select
                      {...register("approvedByMTD_HOS.0.userRef")}
                      size="sm"
                    >
                      <option value="">Select</option>
                      {usersList?.mtdHOS?.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.tm_name}
                        </option>
                      ))}
                    </Form.Select> */}
                        </Col>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {isEditable && (
                <Row className="m-0 p-2 d-flex justify-content-between">
                  <Col lg={6} md={6} sm={12}>
                    <button
                      type="submit"
                      className="btn bg-success"
                      style={{ marginTop: "1rem" }}
                    >
                      Update Request Sheet
                    </button>
                  </Col>
                </Row>
              )}

              {isEditable &&
                watch("getDataForApprovalDashboard.Id") === context?._id && (
                  <ApproveOrRejectComponent
                    handlePopupStatus={handlePopupStatus}
                    watch={watch}
                    register={register}
                    errors={errors}
                    isEditable={isEditable}
                    setError={setError}
                    clearErrors={clearErrors}
                    fromNewMachineApproval={true}
                  />
                )}
            </form>
          </Container>
        </Modal.Body>
      </Modal>
    </div>
  );
}
