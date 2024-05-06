import React, { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";

const initialState = {
  id: "",
  partNo: "",
  partName: "",
  makerName: "",
  quantity: "",
  cost: "",
};

const PartList = ({ parts, setParts, handleOnchangeFlag }) => {
  // console.clear();
  // console.log("parts:", parts);

  const [isAdding, setIsAdding] = useState(false);
  const [editedPart, setEditedPart] = useState(null);
  const [newPart, setNewPart] = useState(initialState);

  const addPart = (event) => {
    event.preventDefault();

    if (
      newPart.partNo &&
      newPart.partName &&
      newPart.makerName &&
      newPart.quantity &&
      newPart.cost
    ) {
      // Assign a new id by incrementing the maximum id
      newPart.id = parts?.length;

      setParts([...parts, newPart]);
      handleOnchangeFlag && handleOnchangeFlag("parts_val_flag");
      setNewPart(initialState);
      setIsAdding(false);
    }
  };

  const editPart = (event, part) => {
    event.preventDefault();
    setEditedPart({ ...part });
  };

  const updatePart = (event) => {
    event.preventDefault();

    if (
      editedPart.partNo &&
      editedPart.partName &&
      editedPart.makerName &&
      editedPart.quantity &&
      editedPart.cost
    ) {
      const updatedParts = parts.map((part) =>
        part.id === editedPart.id ? editedPart : part
      );
      setParts(updatedParts);
      handleOnchangeFlag && handleOnchangeFlag("parts_val_flag");
      setEditedPart(null);
    }
  };

  const cancelEdit = (event) => {
    event.preventDefault();

    setNewPart(initialState);
    setEditedPart(null);
    setIsAdding(false);
  };

  const deletePart = (event, partId) => {
    event.preventDefault();

    const updatedParts = parts.filter(
      (part, index) => (part?.id || index) !== partId
    );
    setParts(updatedParts);
    handleOnchangeFlag && handleOnchangeFlag("parts_val_flag");
  };

  return (
    <div className="mtd-parts-section">
      <Row className="m-0 d-flex">
        <Col lg={2} md={2} sm={2} className="border">
          <small style={{ fontSize: "12px" }}>
            <b>PART NO.</b>
          </small>
        </Col>
        <Col lg={2} md={2} sm={2} className="border">
          <small style={{ fontSize: "12px" }}>
            <b>PART NAME</b>
          </small>
        </Col>
        <Col lg={2} md={2} sm={2} className="border">
          <small style={{ fontSize: "12px" }}>
            <b>MAKER</b>
          </small>
        </Col>
        <Col lg={2} md={2} sm={2} className="border">
          <small style={{ fontSize: "12px" }}>
            <b>QUANTITY</b>
          </small>
        </Col>
        <Col lg={2} md={2} sm={2} className="border">
          <small style={{ fontSize: "12px" }}>
            <b>Cost</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          sm={2}
          className="border"
          // className="border col-auto d-flex align-items-center gap-1 p-1"
        >
          <small style={{ fontSize: "12px" }}>
            <b>UPDATE</b>
          </small>
          {/* <AddBoxIcon onClick={() => setIsAdding(true)} /> */}
        </Col>
      </Row>

      {parts.map((part, index) =>
        editedPart && editedPart.id === index ? (
          <Row key={index} className="m-0 d-flex">
            {/* Render input fields for editing */}
            <Col lg={2} md={2} sm={2} className="border">
              <input
                type="text"
                className="mb-2 mt-2"
                value={editedPart.partNo}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, partNo: e.target.value })
                }
              />
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              <input
                type="text"
                className="mb-2 mt-2"
                value={editedPart.partName}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, partName: e.target.value })
                }
              />
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              <input
                type="text"
                className="mb-2 mt-2"
                value={editedPart.makerName}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, makerName: e.target.value })
                }
              />
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              <input
                type="number"
                className="mb-2 mt-2"
                value={editedPart.quantity}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, quantity: e.target.value })
                }
              />
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              <input
                type="number"
                className="mb-2 mt-2"
                value={editedPart.cost}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, cost: e.target.value })
                }
              />
            </Col>
            <Col
              lg={2}
              md={2}
              sm={2}
              className="border d-block align-items-center gap-1 p-1"
            >
              <button class="bg-info text-white border-0" onClick={updatePart}>
                Update
              </button>
              <br />
              <button
                class="bg-danger text-white border-0"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </Col>
          </Row>
        ) : (
          <Row key={index} className="m-0">
            {/* Render part information */}
            <Col lg={2} md={2} sm={2} className="border">
              {part.partNo}
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              {part.partName}
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              {part.makerName}
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              {part.quantity}
            </Col>
            <Col lg={2} md={2} sm={2} className="border">
              {part.cost}
            </Col>
            <Col
              lg={2}
              md={2}
              sm={2}
              className="d-flex border col-auto gap-1 p-1 flex-wrap"
            >
              <button
                class="bg-warning text-white border-0"
                onClick={(event) => {
                  editPart(event, { ...part, id: index });
                }}
              >
                Edit
              </button>
              <button
                class="bg-danger text-white border-0"
                onClick={(event) => {
                  deletePart(event, index);
                }}
              >
                Delete
              </button>
            </Col>
          </Row>
        )
      )}

      {isAdding ? (
        <Row className="m-0">
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="text"
              className="mb-2 mt-2"
              placeholder="Part No."
              value={newPart.partNo}
              onChange={(e) =>
                setNewPart({ ...newPart, partNo: e.target.value })
              }
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="text"
              className="mb-2 mt-2"
              placeholder="Part Name"
              value={newPart.partName}
              onChange={(e) =>
                setNewPart({ ...newPart, partName: e.target.value })
              }
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="text"
              className="mb-2 mt-2"
              placeholder="Maker Name"
              value={newPart.makerName}
              onChange={(e) =>
                setNewPart({ ...newPart, makerName: e.target.value })
              }
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="number"
              placeholder="Quantity"
              className="mb-2 mt-2"
              value={newPart.quantity}
              onChange={(e) =>
                setNewPart({ ...newPart, quantity: e.target.value })
              }
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="number"
              placeholder="cost"
              className="mb-2 mt-2"
              value={newPart.cost}
              onChange={(e) => setNewPart({ ...newPart, cost: e.target.value })}
            />
          </Col>
          <Col
            lg={2}
            md={2}
            sm={2}
            className="border d-block align-items-center gap-1 p-1"
          >
            <button class="bg-success text-white border-0" onClick={addPart}>
              Add
            </button>
            <br />
            <button class="bg-danger text-white border-0" onClick={cancelEdit}>
              Cancel
            </button>
          </Col>
        </Row>
      ) : (
        <Row className="m-0  p-1 border">
          <Col lg={4}>
            <button
              class="bg-warning text-white border-0"
              onClick={() => setIsAdding(true)}
            >
              Add Part
            </button>
          </Col>
        </Row>
      )}

      {Array.from({ length: 2 - parts.length }).map((_, index) => (
        <Row key={index} className="m-0 p-1 border">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Row>
      ))}
    </div>
  );
};

export default PartList;
