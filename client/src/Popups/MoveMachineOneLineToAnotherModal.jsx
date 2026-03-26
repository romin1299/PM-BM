import React, { useState, useContext } from "react";
import { Row, Col, Modal, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";
import RoutingContext from "../context/routing/RoutingContext";
import { SuccessToast } from "../BM/Component/ShowTostify";

function MoveMachineOneLineToAnotherModal({
  modelProp,
  selectedRow,
  refreshForMachineData,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({});
  const context = useContext(RoutingContext);
  console.log(selectedRow);
  const [lineInfoForDropdown, setLineInfoForDropdown] = useState([]);

  const handleSubmitDataOfMoveMachineFromOneLineToAnother = async (
    submittedData
  ) => {
    submittedData = {
      line_id: lineInfoForDropdown[submittedData.line_name]?._id,
      cell_id: lineInfoForDropdown[submittedData.line_name]?.cell_names,
      selectedRow,
    };
    try {
      const res = await axios.patch(
        `/updateCellAndLineIdInMachineWhileMovingMachine/?_id=${selectedRow?._id}&&machine_sequence=${selectedRow?.machine_sequence}&&line_names=${selectedRow?.line_names?._id}`,
        {
          withCredentials: true,
          credentials: "include",
          submittedData,
        }
      );

      if (res.status === 201) {
        SuccessToast(res.data?.message);
        refreshForMachineData();
      }
    } catch (error) {
      console.log("error:", error);
    }
    modelProp.onHide();
  };

  const postCellToGetLineList = async (selectedCell) => {
    try {
      const res = await fetch("/postCellToGetLineList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cell: selectedCell,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setLineInfoForDropdown(data?.lineInfo);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Modal
        {...modelProp}
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Move Machine
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form
            onSubmit={handleSubmit(
              handleSubmitDataOfMoveMachineFromOneLineToAnother
            )}
          >
            <Row>
              <Col>
                <p className="mb-0 pt-1">
                  <b>Cell/Product name: </b>
                </p>
              </Col>
              <Col>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ background: "white" }}
                  id="standard-select-currency"
                  name="cell_name"
                  className="textField"
                  select
                  fullWidth // label="Select"
                  autoComplete="off"
                  variant="standard"
                  {...register("cell_name", {
                    required: "Please select cell name",
                  })}
                  onClick={(e) => {
                    postCellToGetLineList(e.target.value);
                  }}
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {context?.cell_data?.map((option) => {
                    return <option value={option}>{option}</option>;
                  })}
                </select>
                {errors?.["cell_name"] && (
                  <p className="text-error m-1 ">
                    {errors?.["cell_name"]?.message}
                  </p>
                )}
              </Col>
            </Row>
            <Row className="mt-2">
              <Col>
                <p className="mb-0 pt-1">
                  <b>Line name: </b>
                </p>
              </Col>
              <Col>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ background: "white" }}
                  id="standard-select-currency"
                  name="line_name"
                  className="textField"
                  select
                  fullWidth // label="Select"
                  autoComplete="off"
                  variant="standard"
                  {...register("line_name", {
                    required: "Please select line name",
                  })}
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {lineInfoForDropdown?.map((option, idx) => {
                    return <option value={idx}>{option?.line_name}</option>;
                  })}
                </select>
                {errors?.["line_name"] && (
                  <p className="text-error m-1 ">
                    {errors?.["line_name"]?.message}
                  </p>
                )}
              </Col>
            </Row>
            <Row className="mt-2">
              <Col>
                <Button type="submit">Submit</Button>
              </Col>
            </Row>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default MoveMachineOneLineToAnotherModal;
