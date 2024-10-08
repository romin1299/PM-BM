import React, { useEffect, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import "./RequestSheet.scss";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";

const WorkDetails = ({
  workDetails,
  setWorkDetails,
  clearErrors,
  handleOnchangeFlag,
  assigned_users,
  isEditable,
}) => {
  const { machine_code, selectedYear } = useParams();

  const [newWork, setNewWork] = useState("");
  const [newTMName, setNewTMName] = useState({});
  const [newFromDate, setNewFromDate] = useState("");
  const [newToDate, setNewToDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editedWork, setEditedWork] = useState(null);
  const [supportingTMList, setSupportingTMList] = useState([]);

  const navigate = useNavigate();
  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetailsForRequestSheetOfCM/?machine_code=${machine_code}&&current_year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.status === 404) {
        navigate("/", { replace: true });
      } else {
        const { machine, TLHOSS_and_TM_user_list } = await res.json();
        setSupportingTMList(TLHOSS_and_TM_user_list);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  const [dateError, setDateError] = useState("");

  const handleChangeOfTmName = (event, isEditing = false) => {
    const id = event.target.value;
    const selectedUser = supportingTMList.find((user) => user._id === id);

    if (isEditing) {
      setEditedWork((prev) => ({
        ...prev,
        tmId: id,
        tmName: selectedUser?.tm_name || "",
      }));
    } else {
      setNewTMName({ _id: id, name: selectedUser?.tm_name });
    }
  };
  const addWorkDetail = (event) => {
    event.preventDefault();
    if (new Date(newFromDate) > new Date(newToDate)) {
      setDateError("From date cannot be later than To date");
      return;
    }
    if (newWork.trim() !== "") {
      const newWorkDetail = {
        id: new Date(),
        tmId: newTMName?._id || "",
        work: newWork,
        tmName: newTMName?.name || "",
        fromDate: newFromDate,
        toDate: newToDate,
      };
      // console.log("workdetails", workDetails, "newworkdetails", newWorkDetail);
      setWorkDetails([...workDetails, newWorkDetail]);
      // console.log("workdwedawDWD", workDetails);
      handleOnchangeFlag && handleOnchangeFlag("work_details_val_flag");
      clearErrors && clearErrors("workDetailsValidation");
      setNewWork("");
      setNewTMName("");
      setNewFromDate("");
      setNewToDate("");
      setIsAdding(false);
    } else {
      setDateError("Please enter all the fields");
    }
  };

  const editWorkDetail = (event, workId, updatedWork) => {
    event.preventDefault();
    if (new Date(editedWork.fromDate) > new Date(editedWork.toDate)) {
      setDateError("From date cannot be later than To date");
      return;
    }
    const updatedWorkDetails = workDetails?.map((work) => {
      if (work.id === workId) {
        return { ...editedWork };
      }
      return work;
    });
    setWorkDetails(updatedWorkDetails);
    handleOnchangeFlag && handleOnchangeFlag("work_details_val_flag");
    setEditedWork(null);
  };

  const cancelEdit = (event) => {
    event.preventDefault();
    setEditedWork(null);
  };

  const deleteWorkDetail = (event, workId) => {
    event.preventDefault();

    const updatedWorkDetails = workDetails?.filter(
      (work) => work?.id !== workId
    );
    setWorkDetails(updatedWorkDetails);
    handleOnchangeFlag && handleOnchangeFlag("work_details_val_flag");
  };

  const cancelAdd = (event) => {
    event.preventDefault();

    setNewWork("");
    setNewTMName("");
    setNewFromDate("");
    setNewToDate("");
    setIsAdding(false);
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
              {/* {console.log("work ", work)} */}
            </small>
          </Col>
          <Col
            lg={3}
            md={3}
            className={`border col-auto d-flex align-items-center gap-1 ${
              editedWork && editedWork.id === work.id ? "editable" : ""
            }`}
          >
            {editedWork && editedWork.id === work.id ? (
              <input
                type="text"
                value={editedWork.work}
                onChange={(e) =>
                  setEditedWork({ ...editedWork, work: e.target.value })
                }
              />
            ) : (
              work.work
            )}
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            {editedWork && editedWork.id === work.id ? (
              <select
                value={editedWork?.tmId}
                onChange={(e) => handleChangeOfTmName(e, true)}
              >
                {supportingTMList.map((value) => (
                  <option key={value} value={value._id}>
                    {value?.tm_name}
                  </option>
                ))}
              </select>
            ) : (
              work?.tmName
            )}
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            {editedWork && editedWork.id === work.id ? (
              <input
                type="date"
                value={editedWork.fromDate}
                onChange={(e) =>
                  setEditedWork({ ...editedWork, fromDate: e.target.value })
                }
              />
            ) : (
              moment(work.fromDate).format("DD-MM-YYYY")
            )}
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            {editedWork && editedWork.id === work.id ? (
              <input
                type="date"
                value={editedWork.toDate}
                onChange={(e) =>
                  setEditedWork({ ...editedWork, toDate: e.target.value })
                }
              />
            ) : (
              moment(work.toDate).format("DD-MM-YYYY")
            )}
          </Col>
          <Col
            lg={1}
            md={1}
            className="d-flex border col-auto gap-1 p-1 flex-wrap"
          >
            {editedWork && editedWork.id === work.id ? (
              <>
                <button
                  className="bg-info text-white border-0"
                  onClick={(event) => editWorkDetail(event, work.id)}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Update
                </button>
                <button
                  className="bg-danger text-white border-0"
                  onClick={cancelEdit}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="bg-warning text-white border-0"
                  onClick={(event) => {
                    event.preventDefault();
                    setEditedWork({ ...work });
                  }}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Edit
                </button>
                <button
                  className="bg-danger text-white border-0"
                  onClick={(event) => deleteWorkDetail(event, work.id)}
                  style={{
                    display: isEditable ? "block" : "none",
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </Col>
        </Row>
      ))}

      {isAdding ? (
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
              value={newWork}
              onChange={(e) => setNewWork(e.target.value)}
              placeholder="Enter work details"
            />
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <select
              value={newTMName._id || ""}
              onChange={(e) => handleChangeOfTmName(e)}
            >
              <option value="">Select TM</option>
              {supportingTMList.map((value) => (
                <option key={value} value={value._id}>
                  {value?.tm_name}
                </option>
              ))}
            </select>
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <input
              type="date"
              value={newFromDate}
              onChange={(e) => setNewFromDate(e.target.value)}
            />
          </Col>
          <Col
            lg={2}
            md={2}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <input
              type="date"
              value={newToDate}
              onChange={(e) => setNewToDate(e.target.value)}
            />
          </Col>
          <Col
            lg={1}
            md={1}
            className="border col-auto d-flex align-items-center gap-1 p-1"
          >
            <button
              className="bg-success text-white border-0"
              onClick={addWorkDetail}
            >
              Add
            </button>
            <button
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
            <Col lg={4}>
              <button
                className="bg-warning text-white border-0"
                onClick={() => setIsAdding(true)}
              >
                Add Work Detail
              </button>
            </Col>
          </Row>
        )
      )}

      {Array.from({ length: 2 - workDetails?.length }).map((_, index) => (
        <Row key={index} className="m-0 p-1 border">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Row>
      ))}
    </div>
  );
};

export default WorkDetails;
