import React, { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../../modules/PageModules";
import "../RequestSheet.scss";

const ActionList = () => {
  // State and functions specific to the Actions component
  const [actions, setActions] = useState([
    // Initial actions data, you can customize this as needed
    { id: 1, action: "Action 1" },
    { id: 2, action: "Action 2" },
  ]);

  const [newActionText, setNewActionText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editedAction, setEditedAction] = useState(null);

  const addAction = () => {
    // Add a new action to the list
    if (newActionText.trim() !== "") {
      const newAction = {
        id: Date.now(),
        action: newActionText,
      };
      setActions([...actions, newAction]);
      setNewActionText("");
      setIsAdding(false);
    }
  };

  const updateAction = () => {
    // Update an existing action
    if (editedAction.action.trim() !== "") {
      const updatedActions = actions.map((action) =>
        action.id === editedAction.id ? editedAction : action
      );
      setActions(updatedActions);
      setEditedAction(null);
    }
  };

  const cancelEdit = () => {
    // Cancel the edit operation
    setEditedAction(null);
  };

  const cancelAdd = () => {
    // Cancel the add operation
    setNewActionText("");
    setIsAdding(false);
  };

  const deleteAction = (actionId) => {
    // Delete an action
    const updatedActions = actions.filter((action) => action.id !== actionId);
    setActions(updatedActions);
  };

  return (
    <div className="mtd-actions-section">
      <Row className="m-0 border">
        <Col className="d-flex align-items-lg-center gap-1">
          <b>ACTION & COUNTERMEASURE STEPS: </b>
        </Col>
        <Col style={{ cursor: "pointer" }} className="col-auto">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Col>
      </Row>

      {actions.map((action, index) =>
        editedAction && editedAction.id === action.id ? (
          // Edit mode
          <Row key={action.id} className="m-0 border">
            <Col
              className="d-flex align-items-lg-center gap-1"
              style={{ fontSize: "14px" }}
            >
              <b>{`Action ${index + 1}: `}</b>
              <input
                type="text"
                value={editedAction.action}
                onChange={(e) =>
                  setEditedAction({
                    ...editedAction,
                    action: e.target.value,
                  })
                }
              />
            </Col>
            <Col className="col-auto d-flex gap-1 p-1">
              <button onClick={updateAction}>Update</button>
              <button onClick={cancelEdit}>Cancel</button>
            </Col>
          </Row>
        ) : (
          // View mode
          <Row key={action.id} className="m-0 border">
            <Col
              className="d-flex align-items-lg-center gap-1"
              style={{ fontSize: "14px" }}
            >
              <b>{`Action ${index + 1}: `}</b>
              {action.action}
            </Col>
            <Col className="col-auto d-flex gap-1 p-1">
              <button onClick={() => deleteAction(action.id)}>Delete</button>
              <button onClick={() => setEditedAction({ ...action })}>
                Edit
              </button>
            </Col>
          </Row>
        )
      )}

      {/* Render the "Add" section */}
      {isAdding ? (
        // Add mode
        <Row className="m-0 border">
          <Col
            className="d-flex align-items-lg-center gap-1"
            style={{ fontSize: "14px" }}
          >
            <b>{`Action ${actions.length + 1}: `}</b>
            <input
              type="text"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
            />
          </Col>
          <Col className="col-auto d-flex gap-1 p-1">
            <button onClick={addAction}>Add</button>
            <button onClick={cancelAdd}>Cancel</button>
          </Col>
        </Row>
      ) : (
        // View mode with "Add" button
        <Row className="m-0 border">
          <Col className="d-flex justify-content-center align-items-lg-center gap-1 p-1">
            <AddBoxIcon onClick={() => setIsAdding(true)} />
          </Col>
        </Row>
      )}

      {Array.from({ length: 2 - actions.length }).map((_, index) => (
        // Render additional "Add" sections based on the difference
        <Row key={index} className="m-0 border p-1">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Row>
      ))}
    </div>
  );
};

export default ActionList;
