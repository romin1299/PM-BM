import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { WarningToast } from "../BM/Component/ShowTostify";
const AddApproverNameIfNotAvailableInCheckSheet = ({
  machine_code,
  selectedYear,
  modelProp,
  listOfAllApproverAndOtherData,
  postMachineIdToGetAllDetailsOfMachine,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
    // control,
    // reset,
  } = useForm();
  const submitAllSelectedApprovalValue = async (editedApprovalData) => {
    try {
      if (Object.keys(dirtyFields)?.length === 0) {
        return WarningToast("Please fill some value in the form");
      }

      editedApprovalData = {
        ...editedApprovalData,
        selectedMonth: listOfAllApproverAndOtherData?.selectedMonth,
        prd_tl_list:
          listOfAllApproverAndOtherData?.PRDTLlistForAfterAdd[
            editedApprovalData?.prd_tl_list
          ],
        mtd_tl_list:
          listOfAllApproverAndOtherData?.MTDTLlistForAfterAdd[
            editedApprovalData?.mtd_tl_list
          ],
        mtd_hos_list:
          listOfAllApproverAndOtherData?.HOSListForAfterAdd[
            editedApprovalData?.mtd_hos_list
          ],
        mtd_hod_list:
          listOfAllApproverAndOtherData?.MTDHODlistForAfterAdd[
            editedApprovalData?.mtd_hod_list
          ],
        PMworkedTMName:
          listOfAllApproverAndOtherData?.supportingTMListForAfterAdd[
            editedApprovalData?.PMworkedTMName
          ],
      };

      const res = await fetch(
        `/submitDataOfTheEditedApproval/${selectedYear}/?machine_code=${machine_code}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            editedApprovalData,
          }),
        }
      );
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        modelProp?.onHide();
        postMachineIdToGetAllDetailsOfMachine();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Modal
        {...modelProp}
        size="lg"
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        enforceFocus={false}
        scrollable={true}
        backdrop="static"
      >
        <Modal.Header className="d-flex justify-content-between">
          <Modal.Title id="contained-modal-title-vcenter">
            Check-Sheet Approval Edit -{" "}
            {listOfAllApproverAndOtherData?.selectedMonth}
          </Modal.Title>
          <Button
            variant="secondary"
            onClick={modelProp?.onHide}
            className="btn-danger"
          >
            Close
          </Button>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit(submitAllSelectedApprovalValue)}>
            <div className="row mt-1">
              <div className="col-4">
                <span>
                  Done By <br /> (TM's Name):
                </span>
              </div>
              <div className="col-8 d-flex">
                <div className="col">
                  <select
                    id="standard-select-currency"
                    name="PMworkedTMName"
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                    {...register("PMworkedTMName")}
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {listOfAllApproverAndOtherData?.supportingTMListForAfterAdd?.map(
                      (index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
                      }
                    )}
                  </select>
                </div>
                <div className="col">
                  <input
                    type="datetime-local"
                    {...register("implemetation_completed_date", {
                      required:
                        watch("PMworkedTMName") && "This fields required",
                      onChange: (event) =>
                        setValue(
                          "implemetation_completed_date",
                          event.target.value
                        ),
                    })}
                  />
                  {errors?.["implemetation_completed_date"] && (
                    <p className="text-error">
                      {errors?.["implemetation_completed_date"]?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="row mt-1">
              <div className="col-4">
                <span>
                  PRD TL List <br /> (Quality Check)
                </span>
              </div>
              <div className="col-8 d-flex">
                <div className="col">
                  <select
                    id="standard-select-currency"
                    name="prd_tl_list"
                    select
                    autoComplete="off"
                    variant="standard"
                    {...register("prd_tl_list")}
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {listOfAllApproverAndOtherData?.PRDTLlistForAfterAdd?.map(
                      (index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
                      }
                    )}
                  </select>
                </div>
                <div className="col">
                  <input
                    type="datetime-local"
                    {...register("implementation_approved_PRD_TL_date", {
                      required: watch("prd_tl_list") && "This fields required",

                      onChange: (event) =>
                        setValue(
                          "implementation_approved_PRD_TL_date",
                          event.target.value
                        ),
                    })}
                  />
                  {errors?.["implementation_approved_PRD_TL_date"] && (
                    <p className="text-error">
                      {errors?.["implementation_approved_PRD_TL_date"]?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="row mt-1">
              <div className="col-4">
                <span>
                  MTD TL List <br /> (Checked & Verify by)
                </span>
              </div>
              <div className="col-8 d-flex">
                <div className="col">
                  <select
                    id="standard-select-currency"
                    name="mtd_tl_list"
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                    {...register("mtd_tl_list")}
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {listOfAllApproverAndOtherData?.MTDTLlistForAfterAdd?.map(
                      (index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
                      }
                    )}
                  </select>
                </div>
                <div className="col">
                  <input
                    type="datetime-local"
                    {...register("implementation_approved_MTD_TL_date", {
                      required: watch("mtd_tl_list") && "This fields required",

                      onChange: (event) =>
                        setValue(
                          "implementation_approved_MTD_TL_date",
                          event.target.value
                        ),
                    })}
                  />
                  {errors?.["implementation_approved_MTD_TL_date"] && (
                    <p className="text-error">
                      {errors?.["implementation_approved_MTD_TL_date"]?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="row mt-1">
              <div className="col-4">
                <span>
                  MTD HOS List <br /> (Approved by)
                </span>
              </div>
              <div className="col-8 d-flex">
                <div className="col">
                  <select
                    id="standard-select-currency"
                    name="mtd_hos_list"
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                    {...register("mtd_hos_list")}
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {listOfAllApproverAndOtherData?.HOSListForAfterAdd?.map(
                      (index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
                      }
                    )}
                  </select>
                </div>
                <div className="col">
                  <input
                    type="datetime-local"
                    {...register("implementation_approved_MTD_HOS_date", {
                      required: watch("mtd_hos_list") && "This fields required",

                      onChange: (event) =>
                        setValue(
                          "implementation_approved_MTD_HOS_date",
                          event.target.value
                        ),
                    })}
                  />
                  {errors?.["implementation_approved_MTD_HOS_date"] && (
                    <p className="text-error">
                      {
                        errors?.["implementation_approved_MTD_HOS_date"]
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {(listOfAllApproverAndOtherData?.selectedMonth === "Sep" ||
              listOfAllApproverAndOtherData?.selectedMonth === "Mar") && (
              <div className="row mt-1">
                <div className="col-4">
                  <span>
                    MTD HOD List <br /> (Approved by)
                  </span>
                </div>
                <div className="col-4">
                  <select
                    id="standard-select-currency"
                    name="mtd_hod_list"
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                    {...register("mtd_hod_list")}
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {listOfAllApproverAndOtherData?.MTDHODlistForAfterAdd?.map(
                      (index, idx) => {
                        return <option value={idx}>{index.tm_name}</option>;
                      }
                    )}
                  </select>
                </div>
                <div className="col-4">
                  <input
                    type="datetime-local"
                    {...register("implementation_approved_MTD_HOD_date", {
                      required: watch("mtd_hod_list") && "This fields required",
                      onChange: (event) =>
                        setValue(
                          "implementation_approved_MTD_HOD_date",
                          event.target.value
                        ),
                    })}
                  />
                  {errors?.["implementation_approved_MTD_HOD_date"] && (
                    <p className="text-error">
                      {
                        errors?.["implementation_approved_MTD_HOD_date"]
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>
            )}
            <button className="btn btn-primary mt-2" type="submit">
              Save
            </button>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default AddApproverNameIfNotAvailableInCheckSheet;
