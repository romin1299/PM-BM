import React, { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import "./RequestSheet.scss";

const WorkDetails = ({
  workDetails,
  setWorkDetails,
  clearErrors,
  handleOnchangeFlag,
  assigned_users,
  isEditable,
}) => {
  const [newWork, setNewWork] = useState("");
  const [newTMName, setNewTMName] = useState("");
  const [newFromDate, setNewFromDate] = useState("");
  const [newToDate, setNewToDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editedWork, setEditedWork] = useState(null);

  // Mock data for TM Name dropdown
  const tmNames = ["John Doe", "Jane Smith", "Mike Johnson"];
  const [dateError, setDateError] = useState("");

  const addWorkDetail = (event) => {
    event.preventDefault();
    if (new Date(newFromDate) > new Date(newToDate)) {
      setDateError("From date cannot be later than To date");
      return;
    }

    if (newWork.trim() !== "") {
      const newWorkDetail = {
        id: Date.now(),
        work: newWork,
        tmName: newTMName,
        fromDate: newFromDate,
        toDate: newToDate,
      };
      console.log("workdetails", workDetails, "newworkdetails", newWorkDetail); 
      setWorkDetails([...workDetails, newWorkDetail]);
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

    const updatedWorkDetails = workDetails?.map((work) => {
      if (work.id === workId) {
        return { ...work, ...updatedWork };
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
                value={editedWork.tmName}
                onChange={(e) =>
                  setEditedWork({ ...editedWork, tmName: e.target.value })
                }
              >
                {assigned_users.map((value) => (
                  <option key={value} value={value._id}>
                    {value?.tm_name}
                  </option>
                ))}
              </select>
            ) : (
              work.tmName
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
              work.fromDate
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
              work.toDate
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
                  onClick={(event) =>
                    editWorkDetail(event, work.id, editedWork)
                  }
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
                    setEditedWork(work);
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
              value={newTMName}
              onChange={(e) => setNewTMName(e.target.value)}
            >
              <option value="">Select TM</option>
              {assigned_users.map((value) => (
                <option key={value.tm_name} value={value._id}>
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
