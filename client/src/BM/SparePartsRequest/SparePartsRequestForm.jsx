import React, { useState } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";

import PartList from "../Tabs/SubComponents/PartList";

const SparePartsRequestForm = ({ modelProp, selectedRow }) => {
  const [parts, setParts] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      line_name: selectedRow?.line,
      machine_code: selectedRow?.machineNo,
      machine_name: selectedRow?.machineName,
    },
  });

  const handleSubmitSpareRequestForm = async (data) => {
    try {
      data["parts"] = parts;
      await axios.post("/sendSparePartsRequestMail", {
        withCredentials: true,
        credentials: "include",
        data,
      });
    } catch (error) {
      console.log("error:", error);
    }
    modelProp.onHide();
  };

  return (
    <Modal
      {...modelProp}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Spare parts request
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <form onSubmit={handleSubmit(handleSubmitSpareRequestForm)}>
            <Row className="m-0 d-flex align-items-center">
              <Col lg={3}>
                <p className="mb-0 pt-1">
                  <b>Line name: </b>
                </p>
              </Col>
              <Col lg={5}>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    id="prob"
                    className="m-1 mb-2"
                    style={{ width: "350px" }}
                    disabled
                    // value={selectedRow?.line}
                    {...register("line_name", {
                      required: "Please enter the line name",
                    })}
                  />
                </div>
                {errors?.["line_name"] && (
                  <p className="text-error m-1 ">
                    {errors?.["line_name"]?.message}
                  </p>
                )}
              </Col>
            </Row>

            <Row className="m-0 d-flex align-items-center">
              <Col lg={3}>
                <p className="mb-0 pt-1">
                  <b>Machine code: </b>
                </p>
              </Col>
              <Col lg={5}>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    id="prob"
                    className="m-1 mb-2"
                    style={{ width: "350px" }}
                    disabled
                    {...register("machine_code", {
                      required: "Please enter the machine code",
                    })}
                  />
                </div>
                {errors?.["machine_code"] && (
                  <p className="text-error m-1 ">
                    {errors?.["machine_code"]?.message}
                  </p>
                )}
              </Col>
            </Row>

            <Row className="m-0 d-flex align-items-center">
              <Col lg={3}>
                <p className="mb-0 pt-1">
                  <b>Machine name: </b>
                </p>
              </Col>
              <Col lg={5}>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    id="prob"
                    className="m-1 mb-2"
                    style={{ width: "350px" }}
                    disabled
                    {...register("machine_name", {
                      required: "Please enter the machine name",
                    })}
                  />
                </div>
                {errors?.["machine_name"] && (
                  <p className="text-error m-1 ">
                    {errors?.["machine_name"]?.message}
                  </p>
                )}
              </Col>
            </Row>

            <Row className="m-0  d-flex align-items-center">
              <Col>
                <p className="mb-0 pt-1">
                  <b>Spare parts: </b>
                </p>
                <PartList parts={parts} setParts={setParts} />
              </Col>
            </Row>
            <Row className="m-0 pt-2  d-flex align-items-center">
              <Col>
                <Button type="submit">Submit</Button>
              </Col>
            </Row>
          </form>
        </Container>
      </Modal.Body>
      {/* <Modal.Footer>
        <Button onClick={modelProp.onHide}>Close</Button>
      </Modal.Footer> */}
    </Modal>
  );
};

export default SparePartsRequestForm;
