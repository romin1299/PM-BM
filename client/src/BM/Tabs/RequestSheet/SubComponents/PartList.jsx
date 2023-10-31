import React, { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../../modules/PageModules";

const PartList = ({ parts, setParts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editedPart, setEditedPart] = useState(null);
  const [newPart, setNewPart] = useState({
    id: "",
    partNo: "",
    partName: "",
    makerName: "",
    quantity: "",
    cost: "",
  });
  
  const addPart = () => {
    if (
      newPart.partNo &&
      newPart.partName &&
      newPart.makerName &&
      newPart.quantity &&
      newPart.cost
    ) {
      // Find the maximum id from existing parts
      const maxId = parts.reduce(
        (max, part) => (part.id > max ? part.id : max),
        0
      );

      // Assign a new id by incrementing the maximum id
      newPart.id = maxId + 1;

      setParts([...parts, newPart]);
      setNewPart({
        id: "",
        partNo: "",
        partName: "",
        makerName: "",
        quantity: "",
        cost: "",
      });
      setIsAdding(false);
    }
  };

  const editPart = (part) => {
    setEditedPart({ ...part });
  };

  const updatePart = () => {
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
      setEditedPart(null);
    }
  };

  const cancelEdit = () => {
    setEditedPart(null);
  };

  const deletePart = (partId) => {
    const updatedParts = parts.filter((part) => part.id !== partId);
    setParts(updatedParts);
  };

  return (
    <div className="mtd-parts-section">
      <Row className="m-0">
        <Col lg={2} className="border">
          <b>PART NO.</b>
        </Col>
        <Col lg={2} className="border">
          <b>PART NAME</b>
        </Col>
        <Col lg={2} className="border">
          <b>MAKER</b>
        </Col>
        <Col lg={2} className="border">
          <b>QUANTITY</b>
        </Col>
        <Col lg={2} className="border">
          <b>COST</b>
        </Col>
        <Col
          lg={2}
          className="border col-auto d-flex align-items-center gap-1 p-1"
        >
          {/* <AddBoxIcon onClick={() => setIsAdding(true)} /> */}
        </Col>
      </Row>

      {parts.map((part) =>
        editedPart && editedPart.id === part.id ? (
          <Row key={part.id} className="m-0">
            {/* Render input fields for editing */}
            <Col lg={2} className="border">
              <input
                type="text"
                value={editedPart.partNo}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, partNo: e.target.value })
                }
              />
            </Col>
            <Col lg={2} className="border">
              <input
                type="text"
                value={editedPart.partName}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, partName: e.target.value })
                }
              />
            </Col>
            <Col lg={2} className="border">
              <input
                type="text"
                value={editedPart.makerName}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, makerName: e.target.value })
                }
              />
            </Col>
            <Col lg={2} className="border">
              <input
                type="number"
                value={editedPart.quantity}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, quantity: e.target.value })
                }
              />
            </Col>
            <Col lg={2} className="border">
              <input
                type="number"
                value={editedPart.cost}
                onChange={(e) =>
                  setEditedPart({ ...editedPart, cost: e.target.value })
                }
              />
            </Col>
            <Col lg={2} className="border d-flex align-items-center gap-1 p-1">
              <button onClick={updatePart}>Update</button>
              <button onClick={cancelEdit}>Cancel</button>
            </Col>
          </Row>
        ) : (
          <Row key={part.id} className="m-0">
            {/* Render part information */}
            <Col lg={2} className="border">
              {part.partNo}
            </Col>
            <Col lg={2} className="border">
              {part.partName}
            </Col>
            <Col lg={2} className="border">
              {part.makerName}
            </Col>
            <Col lg={2} className="border">
              {part.quantity}
            </Col>
            <Col lg={2} className="border">
              {part.cost}
            </Col>
            <Col lg={2} className="border d-flex align-items-center gap-1 p-1">
              <button onClick={() => editPart(part)}>Edit</button>
              <button onClick={() => deletePart(part.id)}>Delete</button>
            </Col>
          </Row>
        )
      )}

      {isAdding ? (
        <Row className="m-0">
          <Col lg={2} className="border">
            <input
              type="text"
              placeholder="Part No."
              value={newPart.partNo}
              onChange={(e) =>
                setNewPart({ ...newPart, partNo: e.target.value })
              }
            />
          </Col>
          <Col lg={2} className="border">
            <input
              type="text"
              placeholder="Part Name"
              value={newPart.partName}
              onChange={(e) =>
                setNewPart({ ...newPart, partName: e.target.value })
              }
            />
          </Col>
          <Col lg={2} className="border">
            <input
              type="text"
              placeholder="Maker Name"
              value={newPart.makerName}
              onChange={(e) =>
                setNewPart({ ...newPart, makerName: e.target.value })
              }
            />
          </Col>
          <Col lg={2} className="border">
            <input
              type="number"
              placeholder="Quantity"
              value={newPart.quantity}
              onChange={(e) =>
                setNewPart({ ...newPart, quantity: e.target.value })
              }
            />
          </Col>
          <Col lg={2} className="border">
            <input
              type="number"
              placeholder="cost"
              value={newPart.cost}
              onChange={(e) => setNewPart({ ...newPart, cost: e.target.value })}
            />
          </Col>
          <Col lg={2} className="border d-flex align-items-center gap-1 p-1">
            <button onClick={addPart}>Add</button>
            <button onClick={() => setIsAdding(false)}>Cancel</button>
          </Col>
        </Row>
      ) : (
        <Row className="m-0  p-1 border">
          <button onClick={() => setIsAdding(true)}>Add Part</button>
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
