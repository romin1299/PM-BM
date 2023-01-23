import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Top20MachineSparePartConsumption = () => {
  const tableColumn = ["Sr No.", "Machine Name", "Code", "Cost"];
  return (
    <div className="p-3 ">
      <Container className="cell">
        <Row>
          <h5 className="d-flex justify-content-center align-items-center m-2">
            Top 20 Machine (Spare Part Consumption)
          </h5>
        </Row>
        <Row className="m-2">
          <table>
            <tr>
              {tableColumn?.map((item) => (
                <td className="td-padding">{item}</td>
              ))}
            </tr>
            <tr>
              {tableColumn?.map((item) => (
                <td className="td-padding"></td>
              ))}
            </tr>
          </table>
        </Row>
      </Container>
    </div>
  );
};

export default Top20MachineSparePartConsumption;
