import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Table } from "react-bootstrap";
import { Box } from "@mui/material";

const MachineDetails = ({
  machine_code,
  selectedMachineDetails,
  setMachineDetails,
}) => {
  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetails/?machine_code=${machine_code}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { machine } = await res.json();
      console.log("machine:", machine);
      if (res.status === 201) {
        setMachineDetails(machine);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  return (
    <Box className="cell p-3 mt-3">
      <Row>
        <Col lg={6}>
          <Table bordered className="m-0">
            <tbody className="rounded-3">
              <tr>
                <td>
                  {" "}
                  <b>Machine No.</b>
                </td>
                <td>{selectedMachineDetails?.machine_code}</td>
              </tr>
              <tr>
                <td>
                  {" "}
                  <b>Machine Name</b>
                </td>
                <td>{selectedMachineDetails?.machine_name}</td>
              </tr>
              <tr>
                <td>
                  <b>Cell Name</b>
                </td>
                <td>{selectedMachineDetails?.cell_names?.cell_name}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
        {/* <Col lg={6}>
          <button
            className="btn bg-button"
            onClick={() => {
              navigate(
                `/machine-history/machine-document/${machine_code}/${search}`
              );
            }}
          >
            Machine Documents
          </button>
        </Col> */}
      </Row>
    </Box>
  );
};

export default MachineDetails;
