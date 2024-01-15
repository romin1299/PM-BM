import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Table } from "react-bootstrap";

const MachineDetails = ({ machine_code,search }) => {
  const navigate = useNavigate();

  const [selectedMachineDetails, setMachineDetails] = useState({
    _id: "",
    machine_code: "",
    machine_name: "",
    cell_names: {
      cell_name: "",
    },
  });

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
    <Row>
      <Col lg={4}>
        <Table bordered className="mb-5">
          <tbody>
            <tr>
              <td>Machine No.</td>
              <td>{selectedMachineDetails?.machine_code}</td>
            </tr>
            <tr>
              <td>Machine Name</td>
              <td>{selectedMachineDetails?.machine_name}</td>
            </tr>
            <tr>
              <td>Cell Name</td>
              <td>{selectedMachineDetails?.cell_names?.cell_name}</td>
            </tr>
          </tbody>
        </Table>
      </Col>
      <Col>
        <button
          className="btn bg-button m-2"
          onClick={() => {
            navigate(
              `/machine-history/machine-document/${machine_code}/${search}`
            );
          }}
        >
          Machine Documents
        </button>
      </Col>
    </Row>
  );
};

export default MachineDetails;
