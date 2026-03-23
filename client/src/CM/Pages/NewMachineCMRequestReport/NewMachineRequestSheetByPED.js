import React, { useEffect, useState, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Form,
  Button,
  Card,
} from "react-bootstrap";
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
                        options={usersList?.mtdTL}
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
                          options={usersList?.mtdTL}
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
export default function NewMachineRequestSheet() {
  const navigate = useNavigate();
  const params = useParams(); // contains machine_code and currentYear maybe
  const machine_code = params?.machine_code;
  const selectedYear = params?.selectedYear;
  const context = useContext(RoutingContext);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    defaultValues: {
      requestSheetNoOfNewMachineCM: "",
      newMachineRequestFilledByPED: {
        scopeOfCM: "",
        requestOn: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
        requiredOn: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
        time: "",
        modificationWork: [],
        purposeOfCM: "",
        riskAssessment: "No",
        safetyRelated: "No",
        qualityRelated: "No",
        // shiftOfNewCM: "",
        // preparedByPED_TL: [],
        // checkedByPED_HOS: [],
        // approvedByPED_HOD: [],
      },
      // filledByMTD_User: {
      //   modificationWork_ApprovedByMTD_HOS: [],
      //   modificationWork_ApprovedByMTD_HOD: [],
      //   modificationWork_AssignedMTD_TL: [],
      //   jobForNewMachineCM: "",
      //   job_details: {
      //     job_name: "",
      //     job_content: [],
      //   },
      //   sparePartUsedOrNot: "No",
      //   changedParts: [],
      //   attendedBy: "",
      // },
      // modificationConfirmationAfterCompletion: "",
      // SpecialComments: "",
      // statusOfNewRequestOfCM: "",
      isJobFinished: "No",
      // preparedAndCheckedByMTD_TL: [],
      // approvedByMTD_HOS: [],
      // preparedByPED_TL: [],
      // checkedByPED_HOS: [],
      // plantToMachineHierarchyRef: null,
      // requestedDept: "",
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

  // load initial data
  useEffect(() => {
    const fetch = async () => {
      try {
        const [job, requestSheetApprovalList, userList] = await Promise.all([
          axios.get(`${API_BASE}`),
          axios.get(
            `/getMachineDetailsOnScanningRequest/?machine_code=${machine_code}&&current_year=${selectedYear}`
          ),
          axios.get(`/getApprovalUserList`),
        ]);
        setJobsList(job?.data || []);
        setUsersList(
          userList?.data?.userList
          // requestSheetApprovalList?.data?.requestSheetApprovalList || []
        );
        setMachineDetails(requestSheetApprovalList?.data?.machine);
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

  //showing request-sheet number only for front-end view after submit the request-sheet number generate din back-end side
  useEffect(() => {
    if (!machineDetails) return;

    const sectionPrefix =
      machineDetails?.line_names?.cell_names?.subSection_names?.section_names
        ?.dashboardLevel === "Yes"
        ? machineDetails?.line_names?.cell_names?.subSection_names?.section_names?.section_name
            ?.trim()
            ?.substring(0, 2)
            ?.toUpperCase()
        : machineDetails?.line_names?.cell_names?.subSection_names?.subSection_name
            ?.trim()
            ?.substring(0, 2)
            ?.toUpperCase();

    const lineName = machineDetails?.line_names?.line_name?.trim() || "";
    const month = moment().tz("Asia/Kolkata").month() + 1;
    const nextNo =
      (machineDetails?.line_names?.requestSheetNoOfNewMachineCM || 0) + 1;

    const reqNo = `${sectionPrefix}-${lineName}-New-Machine-CM-${month}-${nextNo}`;

    setValue("requestSheetNoOfNewMachineCM", reqNo);
  }, [machineDetails, setValue]);

  // extract only dirty fields from payload
  const extractDirty = (values, dirty) => {
    const out = {};

    for (const key in dirty) {
      const isDirty = dirty[key];

      // If primitive changed → take value
      if (isDirty === true) {
        out[key] = values[key];
        continue;
      }

      // If nested object
      if (typeof isDirty === "object" && values[key]) {
        // ❗ If the nested object has any dirty keys → send full object
        if (Object.values(isDirty).some(Boolean)) {
          out[key] = values[key]; // <-- FULL OBJECT FIX
        }
      }
    }

    return out;
  };

  const onSubmit = async (payload) => {
    try {
      // 🔥 build only changed fields
      const changedPayload = extractDirty(payload, dirtyFields);

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
        `/newMachineCM-requestSheets/?machineRef=${machineDetails?._id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res?.data) navigate(-1);
    } catch (err) {
      console.error("Submit failed", err);
      alert("Failed to submit request sheet.");
    }
  };

  const isMTDEditable = watch(
    "filledByMTD_User.modificationWork_AssignedMTD_TL"
  )?.some((assignedUser) => assignedUser._id === context?._id);

  return (
    <Container fluid className="p-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h4 className="text-center mb-3">
          NEW MACHINE MODIFICATION REQUEST SHEET (CM)
        </h4>

        {/* machine header */}
        <Table bordered size="sm" className="m-3">
          <tbody>
            <tr>
              <th style={{ width: "18%" }}>Machine Name</th>
              <td>{machineDetails?.machine_name || "-"}</td>
              <th>Machine Code</th>
              <td>{machineDetails?.machine_code || machine_code || "-"}</td>
              <th>Department / Line</th>
              <td>
                {machineDetails?.line_names?.cell_names?.cell_name || "-"}/
                {machineDetails?.line_names?.line_name || "-"}
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
                  {...register("requestSheetNoOfNewMachineCM")}
                  size="sm"
                  readOnly
                />
              </Col>
              <Col md={4}>
                <Form.Label>Scope of CM</Form.Label>
                <Form.Control
                  {...register("newMachineRequestFilledByPED.scopeOfCM")}
                  size="sm"
                />
              </Col>
              <Col md={4}>
                <ShiftInputField
                  dateAndTime={watch("newMachineRequestFilledByPED.requestOn")}
                  shiftOfBM={watch("newMachineRequestFilledByPED.shiftOfNewCM")}
                  setValue={setValue}
                  keyOfShift={"newMachineRequestFilledByPED.shiftOfNewCM"}
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
                />
              </Col>
              <Col md={2}>
                <Form.Label>Required On</Form.Label>
                <Form.Control
                  type="datetime-local"
                  {...register("newMachineRequestFilledByPED.requiredOn")}
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Label>Prepared By (PED TL)</Form.Label>
                <Form.Control
                  {...register("newMachineRequestFilledByPED.preparedByPED_TL")}
                  size="sm"
                  disabled
                  value={context?.tm_name}
                />
              </Col>
              <Col md={2}>
                <Form.Label>Checked By (PED HOS)</Form.Label>
                {/* <Form.Select
                    {...register(
                      "newMachineRequestFilledByPED.checkedByPED_HOS"
                    )}
                    size="sm"
                  >
                    <option value="" selected disabled>
                      Select
                    </option>
                    {usersList?.PEDHOSList?.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.tm_name}
                      </option>
                    ))}
                  </Form.Select> */}
                <DropdownComponent
                  requiredMSG={false ? "Please select" : false}
                  isEditable={true}
                  setValue={setValue}
                  // title="Select PED HOS:"
                  userDropdown={usersList?.PEDHOSList}
                  label="Select PED HOS"
                  formKey="newMachineRequestFilledByPED.checkedByPED_HOS"
                  register={register}
                  watch={watch}
                />
                {errors?.newMachineRequestFilledByPED?.checkedByPED_HOS?.[
                  `userRef`
                ] && (
                  <p className="text-error">
                    {
                      errors?.newMachineRequestFilledByPED?.checkedByPED_HOS?.[
                        `userRef`
                      ]?.message
                    }
                  </p>
                )}
              </Col>
              <Col md={2}>
                <Form.Label>Approved By (PED HOD)</Form.Label>
                {/* <Form.Select
                  {...register(
                    "newMachineRequestFilledByPED.approvedByPED_HOD"
                  )}
                  size="sm"
                >
                  <option value="" selected disabled>
                    Select
                  </option>
                  {usersList?.PEDHODList?.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.tm_name}
                    </option>
                  ))}
                </Form.Select> */}

                <DropdownComponent
                  requiredMSG={false ? "Please select" : false}
                  isEditable={true}
                  setValue={setValue}
                  // title="Select PED HOS:"
                  userDropdown={usersList?.PEDHODList}
                  label="Select PED HOS"
                  formKey="newMachineRequestFilledByPED.approvedByPED_HOD"
                  register={register}
                  watch={watch}
                />
                {errors?.newMachineRequestFilledByPED?.approvedByPED_HOD?.[
                  `userRef`
                ] && (
                  <p className="text-error">
                    {
                      errors?.newMachineRequestFilledByPED?.approvedByPED_HOD?.[
                        `userRef`
                      ]?.message
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
                            variant="danger"
                            size="sm"
                            onClick={() => removeModWork(mi)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="text-center">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            addModWork({ modificationConcept: "" })
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

        {/* MTD SECTION */}
        <Card className="m-3">
          <Card.Header className="fw-bold bg-light">
            MODIFICATION WORK (MTD)
          </Card.Header>
          <Card.Body>
            <Row className="mb-2">
              <Col md={3}>
                <Form.Label>Select Job</Form.Label>
                <Form.Select
                  disabled={!isMTDEditable}
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
              usersList={usersList}
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
          <Card.Header className="fw-bold bg-light">SPARE PARTS</Card.Header>
          <Card.Body>
            {/* Replace with your spare part component which reads/writes filledByMTD_User.changedParts */}
            <div>
              <PartList
                parts={parts}
                setParts={setParts}
                isEditable={isMTDEditable}
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
                  readOnly={!isMTDEditable}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Special Comments</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  {...register("SpecialComments")}
                  readOnly={!isMTDEditable}
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
                    disabled={!isMTDEditable}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="No"
                    value="No"
                    {...register("isJobFinished")}
                    disabled={!isMTDEditable}
                  />
                </div>
              </Col>
              <Col md={4}>
                <Form.Label>Requested Dept.</Form.Label>
                <div className="d-flex">
                  <Col md={6}>
                    <Form.Label>Approved By (PED HOS)</Form.Label>
                    <Form.Select
                      {...register("approvedByPED_HOS.0.userRef")}
                      size="sm"
                      disabled={!isMTDEditable}
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
                      disabled={!isMTDEditable}
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
                      disabled={!isMTDEditable}
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

        {/* Final actions */}
        <div className="text-end mb-5">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Submit Request Sheet
          </Button>
        </div>
      </form>
    </Container>
  );
}
