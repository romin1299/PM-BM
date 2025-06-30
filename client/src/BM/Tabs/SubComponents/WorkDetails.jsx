import React, { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import "./RequestSheet.scss";
import moment from "moment";
import Multiselect from "multiselect-react-dropdown";

const WorkDetails = ({
  workDetails,
  setWorkDetails,
  clearErrors,
  handleOnchangeFlag,
  isEditable,
  setValue,
  supportingTMList,
  totalTimeBasedOnWork,
}) => {
  const initialState = {
    id: "",
    work: "",
    // tmId: "",
    // tm_name: "",
    fromDate: "",
    toDate: "",
  };

  const [newWork, setNewWork] = useState(initialState);
  const [editedWork, setEditedWork] = useState(null);
  const [selectedSupportingTM, setSelectedSupportingTM] = useState([]);

  const [workTotalTime, setWorkTotalTime] = useState(totalTimeBasedOnWork || 0);

  // const [supportingTMList, setSupportingTMList] = useState([]);

  // const getMachineDetails = async () => {
  //   try {
  //     const res = await fetch(`/getSupportingTMDetailsForRequestSheetOfCM`, {
  //       method: "GET",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //     });

  //     if (res.status === 201) {
  //       const { TLHOSS_and_TM_user_list } = await res.json();
  //       setSupportingTMList(TLHOSS_and_TM_user_list);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   getMachineDetails();
  // }, []);

  const [dateError, setDateError] = useState("");

  // const findSelectedSupportingTM = (_id) =>
  //   supportingTMList.find((user) => user._id === _id);

  const cancelAdd = () => {
    setNewWork(initialState);
  };

  const addWorkDetail = () => {
    if (new Date(newWork?.fromDate) > new Date(newWork?.toDate)) {
      setDateError("From date cannot be less than To date");
      return;
    }
    if (
      newWork?.work?.trim() !== "" &&
      // selectedSupportingTM?.length > 0 &&
      newWork?.fromDate !== "" &&
      newWork?.toDate !== ""
    ) {
      const newWorkDetail = {
        ...newWork,
        user: selectedSupportingTM,
        // tmName: findSelectedSupportingTM(newWork?.tmId)?.tm_name,
      };
      let updatedWorkDetails = [...workDetails, newWorkDetail];
      setWorkDetails(updatedWorkDetails);
      setValue &&
        setValue("workDetails", updatedWorkDetails, {
          shouldDirty: true,
        });

      setWorkTotalTime(
        (workTotalTime) =>
          workTotalTime +
          (moment(newWorkDetail?.toDate).diff(
            moment(newWorkDetail?.fromDate),
            "minutes"
          ) /
            60) *
            (selectedSupportingTM?.length >= 1 || 1)
      );

      setSelectedSupportingTM([]);
      handleOnchangeFlag && handleOnchangeFlag("work_details_val_flag");
      clearErrors && clearErrors("workDetails");
      cancelAdd();
    } else {
      setDateError("Please enter all the fields");
    }
  };
  const cancelEdit = () => {
    setEditedWork(null);
    setSelectedSupportingTM([]);
  };

  const editWorkDetail = () => {
    if (new Date(editedWork.fromDate) > new Date(editedWork.toDate)) {
      setDateError("From date cannot be later than To date");
      return;
    }
    let updatedWork = editedWork;
    // updatedWork["tmName"] = findSelectedSupportingTM(editedWork?.tmId)?.tm_name;
    updatedWork["user"] = selectedSupportingTM;

    let totalTime = 0;

    const updatedWorkDetails = workDetails?.map((work) => {
      let finalWork = work;

      if (work?.id === updatedWork?.id) {
        finalWork = updatedWork;
      }

      totalTime +=
        (moment(finalWork?.toDate).diff(
          moment(finalWork?.fromDate),
          "minutes"
        ) /
          60) *
        (finalWork?.user?.length >= 1 || 1);

      return finalWork;
    });

    setWorkDetails(updatedWorkDetails);
    setValue &&
      setValue("workDetails", updatedWorkDetails, {
        shouldDirty: true,
      });
    setWorkTotalTime(totalTime);

    setSelectedSupportingTM([]);
    handleOnchangeFlag && handleOnchangeFlag("work_details_val_flag");
    cancelEdit();
  };

  const deleteWorkDetail = ({ id, toDate, fromDate, user }) => {
    const updatedWorkDetails = workDetails?.filter((work) => work?.id !== id);

    setWorkDetails(updatedWorkDetails);
    setValue &&
      setValue("workDetails", updatedWorkDetails, {
        shouldDirty: true,
      });

    setWorkTotalTime(
      (workTotalTime) =>
        workTotalTime -
        (moment(toDate).diff(moment(fromDate), "minutes") / 60) *
          (user?.length >= 1 || 1)
    );

    handleOnchangeFlag && handleOnchangeFlag("work_details_val_flag");
  };

  const handleOnChangeAddOrUpdateNewWork = ({ target }) => {
    const { name, value } = target;

    const handleSetState = (workDetails) => ({
      ...workDetails,
      [name]: value,
    });

    if (editedWork && editedWork?.id) {
      return setEditedWork(handleSetState);
    }
    setNewWork(handleSetState);
  };

  return (
    <div className="mtd-work-details-section mtd-parts-section">
      <Row className="m-0">
        <Col
          lg={2}
          md={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>WORK DETAILS</b>
          </small>
        </Col>
        <Col
          lg={3}
          md={3}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>Work</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>TM Name</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>From</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>To</b>
          </small>
        </Col>
        <Col
          lg={1}
          md={1}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>Update</b>
          </small>
        </Col>
      </Row>

      {workDetails?.map((work, index) => (
        <Row key={work.id} className="m-0">
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <small>
              <b>Work {index + 1}</b>
            </small>
          </Col>
          {editedWork && editedWork?.id === work?.id ? (
            <>
              <Col
                lg={3}
                md={3}
                className={`border col-auto d-flex align-items-center gap-1 `}
              >
                <input
                  type="text"
                  name="work"
                  value={editedWork?.work}
                  onChange={handleOnChangeAddOrUpdateNewWork}
                />
              </Col>
              <Col
                lg={2}
                md={2}
                className="border col-auto d-flex align-items-center gap-1"
              >
                {/* <select
                  name="tmId"
                  value={editedWork?.tmId}
                  onChange={handleOnChangeAddOrUpdateNewWork}
                >
                  {supportingTMList.map((value) => (
                    <option value={value._id}>{value?.tm_name}</option>
                  ))}
                </select> */}

                <Multiselect
                  displayValue="tm_name"
                  options={supportingTMList}
                  selectedValues={selectedSupportingTM}
                  onSelect={async (selectedList) => {
                    setSelectedSupportingTM(selectedList);
                  }}
                  onRemove={async (selectedList) => {
                    setSelectedSupportingTM(selectedList);
                  }}
                  style={{
                    multiselectContainer: {
                      width: "14rem",
                    },
                  }}
                />
              </Col>
              <Col
                lg={2}
                md={2}
                className="border col-auto d-flex align-items-center gap-1"
              >
                <input
                  type="datetime-local"
                  name="fromDate"
                  value={moment(editedWork.fromDate)
                    .tz("Asia/Kolkata")
                    .format("YYYY-MM-DDTHH:mm")}
                  onChange={handleOnChangeAddOrUpdateNewWork}
                />
              </Col>
              <Col
                lg={2}
                md={2}
                className="border col-auto d-flex align-items-center gap-1"
              >
                <input
                  type="datetime-local"
                  name="toDate"
                  value={moment(editedWork.toDate)
                    .tz("Asia/Kolkata")
                    .format("YYYY-MM-DDTHH:mm")}
                  onChange={handleOnChangeAddOrUpdateNewWork}
                />
              </Col>
              <Col
                lg={1}
                md={1}
                className="d-flex border col-auto gap-1 p-1 flex-wrap"
              >
                <button
                  type="button"
                  className="bg-info text-white border-0"
                  onClick={editWorkDetail}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Update
                </button>
                <button
                  type="button"
                  className="bg-danger text-white border-0"
                  onClick={cancelEdit}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Cancel
                </button>
              </Col>
            </>
          ) : (
            <>
              <Col
                lg={3}
                md={3}
                className={`border col-auto d-flex align-items-center gap-1 `}
              >
                {work.work}
              </Col>
              <Col
                lg={2}
                md={2}
                className="border col-auto d-flex align-items-center gap-1"
              >
                {/* {work?.tmName} */}
                {work?.user?.map((item) => item?.tm_name)?.join(" ,")}
              </Col>
              <Col
                lg={2}
                md={2}
                className="border col-auto d-flex align-items-center gap-1"
              >
                {moment(work.fromDate).format("DD-MM-YYYY hh:mm A")}
              </Col>
              <Col
                lg={2}
                md={2}
                className="border col-auto d-flex align-items-center gap-1"
              >
                {moment(work.toDate).format("DD-MM-YYYY hh:mm A")}
              </Col>
              <Col
                lg={1}
                md={1}
                className="d-flex border col-auto gap-1 p-1 flex-wrap"
              >
                <button
                  type="button"
                  className="bg-warning text-white border-0"
                  onClick={() => {
                    setEditedWork({ ...work });
                    setSelectedSupportingTM(work?.user);
                  }}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="bg-danger text-white border-0"
                  onClick={() => deleteWorkDetail(work)}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Delete
                </button>
              </Col>
            </>
          )}
        </Row>
      ))}

      {newWork?.id ? (
        <Row className="m-0">
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <small>
              <b>Work {workDetails?.length + 1}</b>
            </small>
          </Col>
          <Col
            lg={3}
            md={3}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <input
              type="text"
              name="work"
              value={newWork?.work}
              onChange={handleOnChangeAddOrUpdateNewWork}
              placeholder="Enter work details"
            />
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            {/* <select
              name="tmId"
              value={newWork?.tmId || ""}
              onChange={handleOnChangeAddOrUpdateNewWork}
            >
              <option value="">Select TM</option>
              {supportingTMList.map((value) => (
                <option key={value._id} value={value._id}>
                  {value?.tm_name}
                </option>
              ))}
            </select> */}
            <Multiselect
              displayValue="tm_name"
              options={supportingTMList}
              onSelect={async (selectedList) => {
                setSelectedSupportingTM(selectedList);
              }}
              onRemove={async (selectedList) => {
                setSelectedSupportingTM(selectedList);
              }}
              style={{
                multiselectContainer: {
                  width: "14rem",
                },
              }}
            />
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <input
              type="datetime-local"
              name="fromDate"
              value={newWork?.fromDate}
              onChange={handleOnChangeAddOrUpdateNewWork}
            />
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <input
              type="datetime-local"
              name="toDate"
              value={newWork?.toDate}
              onChange={handleOnChangeAddOrUpdateNewWork}
            />
          </Col>
          <Col
            lg={1}
            md={1}
            className="border col-auto d-flex align-items-center gap-1 p-1"
          >
            <button
              type="button"
              className="bg-success text-white border-0"
              onClick={addWorkDetail}
            >
              Add
            </button>
            <button
              type="button"
              className="bg-danger text-white border-0"
              onClick={cancelAdd}
            >
              Cancel
            </button>
          </Col>
          {dateError && (
            <Col lg={12} className="text-danger">
              {dateError}
            </Col>
          )}
        </Row>
      ) : (
        isEditable && (
          <Row className="m-0 p-1 border">
            <Col lg={7}>
              <button
                type="button"
                className="bg-warning text-white border-0"
                onClick={() =>
                  setNewWork({
                    ...initialState,
                    id: new Date(),
                  })
                }
              >
                Add Work Detail
              </button>
            </Col>
            <Col lg={2} className="border">
              <b>Total time Difference</b>
            </Col>
            <Col lg={2} className="border">
              <b>{workTotalTime.toFixed(2)} Hr</b>
            </Col>
          </Row>
        )
      )}

      {Array.from({ length: 2 - workDetails?.length }).map((_, index) => (
        <Row key={index} className="m-0 p-1 border">
          <AddBoxIcon
            onClick={() =>
              setNewWork({
                ...initialState,
                id: new Date(),
              })
            }
          />
        </Row>
      ))}
    </div>
  );
};

export default WorkDetails;
