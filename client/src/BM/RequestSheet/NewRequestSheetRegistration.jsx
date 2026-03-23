import React from "react";

import { Container, Row, Col } from "react-bootstrap";

import { useForm } from "react-hook-form";

const NewRequestSheetRegistration = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    // reset,
  } = useForm();

  const newRequestSheetRegistration = async (requestSheetData) => {
    const machineRef = "63b67ccea716e21c95cd471a";
    try {
      const res = await fetch(
        `/newRequestSheetRegistration/?machineRef=${machineRef}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...requestSheetData,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 201) {
        console.log(data);
      } else {
        console.log("error", data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Container fluid>
        <h3>NewRequestSheetRegistration</h3>

        <form onSubmit={handleSubmit(newRequestSheetRegistration)}>
          <Row>
            <Col>Request-sheet no</Col>
            <Col>
              <input
                {...register("requestSheetNoOfBM", {
                  required: "RequestSheet no is required",
                })}
              />
              {errors?.["requestSheetNoOfBM"] && (
                <p>{errors?.["requestSheetNoOfBM"]?.message}</p>
              )}
            </Col>
          </Row>

          <Row>
            <Col>
              <button
                type="submit"
                className="btn bg-button"
                style={{ marginTop: "1rem" }}
              >
                Register
              </button>
            </Col>
          </Row>
        </form>
      </Container>
    </>
  );
};

export default NewRequestSheetRegistration;
