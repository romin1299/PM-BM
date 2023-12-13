import React, { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../../modules/PageModules";
import "../RequestSheet.scss";

const ActionList = ({ actions, setActions }) => {
  const [newActionText, setNewActionText] = useState("");
  const [newActionStatus, setNewActionStatus] = useState("OK");
  const [isAdding, setIsAdding] = useState(false);
  const [editedAction, setEditedAction] = useState(null);

  const addAction = (event) => {
    event.preventDefault();

    if (newActionText.trim() !== "") {
      const newAction = {
        id: Date.now(),
        action: newActionText,
        status: newActionStatus,
      };
      setActions([...actions, newAction]);
      setNewActionText("");
      setNewActionStatus("NG");
      setIsAdding(false);
    }
  };

  const editAction = (event, actionId, newText) => {
    event.preventDefault();

    const updatedActions = actions.map((action) => {
      if (action.id === actionId) {
        return { ...action, action: newText };
      }
      return action;
    });
    setActions(updatedActions);
    setEditedAction(null);
  };

  const cancelEdit = (event) => {
    event.preventDefault();
    setEditedAction(null);
  };

  const deleteAction = (event, actionId) => {
    event.preventDefault();

    const updatedActions = actions.filter((action) => action.id !== actionId);
    setActions(updatedActions);
  };

  const cancelAdd = (event) => {
    event.preventDefault();

    setNewActionText("");
    setNewActionStatus("NG");
    setIsAdding(false);
  };

  const handleStatusChange = (actionId, newStatus) => {
    const updatedActions = actions.map((action) => {
      if (action.id === actionId) {
        return { ...action, status: newStatus };
      }
      return action;
    });
    setActions(updatedActions);
  };

  return (
    <div className="mtd-actions-section">
      <Row className="m-0">
        <Col lg={8} md={7} className="border col-auto d-flex align-items-center gap-1">
          <b>ACTION & COUNTERMEASURE STEPS (Dynamic)</b>
        </Col>
        <Col
          lg={2} md={2}
          className="border col-auto d-flex align-items-center gap-1 p-1"
        >
          <b>STATUS</b>
        </Col>
        <Col
          lg={2} md={2}
          className="border col-auto d-flex align-items-center gap-1 p-1"
        >
          <b>UPDATE</b>
          {/* <AddBoxIcon onClick={() => setIsAdding(true)} /> */}
        </Col>
      </Row>

      {actions.map((action, index) => (
        <Row key={action.id} className="m-0">
          <Col
            lg={8} md={7}
            className={`border col-auto d-flex align-items-center gap-1 ${
              editedAction && editedAction.id === action.id ? "editable" : ""
            }`}
          >
            <b>Action {index + 1}: </b>
            {editedAction && editedAction.id === action.id ? (
              <input
                type="text"
                value={editedAction.action}
                onChange={(e) =>
                  setEditedAction({ ...editedAction, action: e.target.value })
                }
              />
            ) : (
              action.action
            )}
          </Col>
          <Col
            lg={2} md={2}
            className="border col-auto d-flex align-items-center gap-1 p-1"
          >
            <div>
              <label className="text-success">
                <input
                  type="radio"
                  name={`status-${action.id}`}
                  value="OK"
                  checked={action.status === "OK"}
                  onChange={() => handleStatusChange(action.id, "OK")}
                />{" "}
                <b>OK</b>
              </label>{" "}
              <label className="text-danger">
                <input
                  type="radio"
                  name={`status-${action.id}`}

                  value="NG"
                  checked={action.status === "NG"}
                  onChange={() => handleStatusChange(action.id, "NG")}
                />{" "}
                <b>NG</b>
              </label>
            </div>
          </Col>
          <Col
            lg={2} md={2}
            className="border col-auto d-block align-items-center gap-1 p-1"
          >
            {editedAction && editedAction.id === action.id ? (
              <>
                <button
                class="bg-info text-white border-0"
                  onClick={(event) => {
                    editAction(event, action.id, editedAction.action);
                  }}
                >
                  Update
                </button>
                <br/>
                <button class="bg-danger text-white border-0" onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                <button
                class="bg-warning text-white border-0"
                  onClick={(event) => {
                    event.preventDefault();
                    setEditedAction(action);
                  }}
                >
                  Edit
                </button>
                <br/>
                <button
                class="bg-danger text-white border-0"
                  onClick={(event) => {
                    deleteAction(event, action.id);
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
            lg={8} md={7}
            className="border col-auto d-flex align-items-center gap-1"
          >
            <b>Action {actions.length + 1}: </b>
            <input
              type="text"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
            />
          </Col>
          <Col
            lg={2} md={2}
            className="border col-auto d-flex align-items-center gap-1 p-1"
          >
            {/* <div>
              <label>
                <input
                  type="radio"
                  name="status-new"
                  value="OK"
                  checked={newActionStatus === "OK"}
                  onChange={() => setNewActionStatus("OK")}
                />{" "}
                OK
              </label>{" "}
              <label>
                <input
                  type="radio"
                  name="status-new"
                  value="NG"
                  checked={newActionStatus === "NG"}
                  onChange={() => setNewActionStatus("NG")}
                />{" "}
                NG
              </label>
            </div> */}
          </Col>
          <Col
            lg={2} md={2}
            className="border col-auto d-block align-items-center gap-1 p-1"
          >
            <button class="bg-success text-white border-0" onClick={addAction}>Add</button>
            <br/>
            <button class="bg-danger text-white border-0" onClick={cancelAdd}>Cancel</button>
          </Col>
        </Row>
      ) : (
        <Row className="m-0  p-1 border">
          <Col lg={4}>
          <button class="bg-warning text-white border-0" onClick={() => setIsAdding(true)}>Add Action</button>
          </Col>
          {/* <Col className="border d-flex  align-items-center gap-1 p-1"> */}
          {/* <AddBoxIcon onClick={() => setIsAdding(true)} /> */}


          {/* </Col> */}
        </Row>
      )}

      {Array.from({ length: 2 - actions.length }).map((_, index) => (
        <Row key={index} className="m-0 p-1 border">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Row>
      ))}
    </div>
  );
};

export default ActionList;
