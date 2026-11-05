import React, { useCallback, useEffect, useState } from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";

import fyMonths from "../../../Utils/fy";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";

const url = "/v1/spare/kpi/inventoryBifurcation/eachCellWise/target";

const emptyTarget = () => Array(12).fill("");

/**
 * Sets one cell's inventory target for the selected financial year: an
 * inventory-cost figure (Mil INR) per month, drawn as the cell's target line.
 *
 * Opens with whatever is already saved, so the same popup adds a first target
 * and edits an existing one.
 */
const CellTargetModal = ({ cell, selectedYear, onHide, onSaved }) => {
  const [values, setValues] = useState(emptyTarget);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    (async () => {
      setIsLoading(true);
      const response = await axiosGetOrDelete({
        url,
        axiosProps: { params: { selectedYear, cellId: cell?._id } },
      });
      if (!isCurrent) return;

      if (!response?.isError)
        // A month never targeted shows empty, not as a stored zero.
        setValues(
          (response.target ?? []).every((value) => !value)
            ? emptyTarget()
            : response.target.map(String),
        );
      setIsLoading(false);
    })();

    return () => {
      isCurrent = false;
    };
  }, [cell?._id, selectedYear]);

  const handleChange = useCallback(
    (index, value) =>
      setValues((prev) => prev.map((item, i) => (i === index ? value : item))),
    [],
  );

  const handleSave = async () => {
    const problemIndex = values.findIndex(
      (value) =>
        String(value).trim() === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0,
    );

    if (problemIndex !== -1)
      return setError(
        `${fyMonths[problemIndex]}: enter a number, zero or more`,
      );

    setError("");
    setIsSaving(true);
    const response = await axiosPostOrPatch({
      url,
      axiosBody: {
        selectedYear,
        cellId: cell?._id,
        target: values.map(Number),
      },
    });
    setIsSaving(false);

    if (response?.isError) return;
    onSaved();
    onHide();
  };

  return (
    <Modal show onHide={onHide} centered style={{ zIndex: 1070 }}>
      <Modal.Header closeButton>
        <Modal.Title>
          Target - {cell?.cell_name} ({selectedYear})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <h5>Loading....</h5>
        ) : (
          <>
            <small className="text-muted d-block mb-2">
              Target inventory cost (Mil INR) for each month. It is drawn as a
              line on this cell's chart.
            </small>

            <Row className="g-2">
              {fyMonths.map((month, index) => (
                <Col xs={4} key={month}>
                  <Form.Label className="mb-0">
                    <small>{month}</small>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="any"
                    size="sm"
                    value={values[index]}
                    onChange={(event) => handleChange(index, event.target.value)}
                  />
                </Col>
              ))}
            </Row>

            {error && <p className="text-error mt-2 mb-0">{error}</p>}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading || isSaving}>
          {isSaving ? "Saving..." : "Save target"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CellTargetModal;
