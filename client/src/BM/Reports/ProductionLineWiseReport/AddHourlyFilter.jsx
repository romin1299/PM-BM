import React, { useState, useEffect } from "react";

import { Container, Row, Col, Modal, Button } from "react-bootstrap";

const AddHourlyFilter = ({
  show,
  handleClose,
  FilterArray,
  setFilterArray,
}) => {
  const [filter, setFilter] = useState(FilterArray);

  useEffect(() => {
    setFilter(FilterArray);
  }, [FilterArray]);

  const handleAddNewInputField = () => {
    setFilter({
      ...filter,
      lessThanValue: [...filter?.lessThanValue, ""],
    });
  };

  const handleInputChangeForLessThanValue = (e, index) => {
    let newFilter = [...filter?.lessThanValue];
    newFilter[index] = e.target.value ? e.target.value * 1 : e.target.value;
    setFilter({
      ...filter,
      lessThanValue: newFilter,
    });
  };

  const handleChangeForGreaterThanValue = (e) => {
    setFilter({
      ...filter,
      greaterThan: e.target.value * 1,
    });
  };

  const handleSubmitData = async () => {
    try {
      const res = await fetch(
        `/hourlyFilterProductionOrLineWiseReport/${FilterArray?._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filter),
        }
      );

      const { responseFilter } = await res.json();

      if (res.status === 201) {
        setFilterArray(responseFilter);
        handleClose();
      } else {
        console.log("error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal
      show={show}
      onHide={() => {
        setFilter(FilterArray);
        handleClose();
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Add more options</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container fluid>
          <Row>
            <Col>
              <b>{"<"} value</b> &nbsp;
              <button
                className="btn bg-button"
                onClick={handleAddNewInputField}
              >
                Add
              </button>
            </Col>
          </Row>
          <Row className="p-2">
            {filter?.lessThanValue?.map((item, index) => (
              <Col className="p-1">
                <input
                  type="number"
                  value={item}
                  onChange={(e) => handleInputChangeForLessThanValue(e, index)}
                />
              </Col>
            ))}
          </Row>
          <Row>
            <b>+ value</b>
          </Row>
          <Row className="p-2">
            <Col className="p-1">
              <input
                type="number"
                value={filter?.greaterThan}
                onChange={handleChangeForGreaterThanValue}
              />
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmitData}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddHourlyFilter;
