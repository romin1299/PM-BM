import React, { useState, useEffect } from "react";

import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import DeleteIcon from "@mui/icons-material/Delete";

const AddHourlyFilter = ({
  show,
  handleClose,
  FilterArray,
  setFilterArray,
}) => {
  const [filter, setFilter] = useState(FilterArray);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setFilter(FilterArray);
  }, [FilterArray]);

  const handleAddNewInputField = () => {
    setFilter({
      ...filter,
      lessThanValue: [...filter?.lessThanValue, ""],
    });
  };

  const handleDeleteInputField = (selectedIndex) => {
    setFilter({
      ...filter,
      lessThanValue: filter?.lessThanValue?.filter(
        (item, index) => index !== selectedIndex
      ),
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
      let maxLessValue =
        filter?.lessThanValue?.sort()?.[filter?.lessThanValue?.length - 1];

      if (maxLessValue > filter?.greaterThan) {
        return setErrorMsg(`Please enter greater value of ${maxLessValue}`);
      }

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
        <Modal.Title>Breakdown hours filtering</Modal.Title>
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
            {filter?.lessThanValue?.map((item, index) => {
              return (
                <Col className="p-1 col-auto" key={index}>
                  <input
                    type="number"
                    value={item}
                    onChange={(e) =>
                      handleInputChangeForLessThanValue(e, index)
                    }
                  />
                  <DeleteIcon
                    role="button"
                    onClick={() => handleDeleteInputField(index)}
                  />
                </Col>
              );
            })}
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
              {errorMsg && <label>{`${errorMsg}`}</label>}
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
