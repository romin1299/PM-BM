import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Scanning = () => {
  const navigate = useNavigate();

  const handleNavigationFunction = () => {
    const machineCode = "63b67ccea716e21c95cd471a";
    const sheetType = "BM";
    navigate(`/machine-scan/${sheetType}/${machineCode}`);
  };

  return (
    <Container>
      <Row>
        <h3>Scanning</h3>
      </Row>
      <Row>
        <Col>
          <button
            variant="contained"
            fullWidth
            type="submit"
            className="btn-primary1 mt-2"
            onClick={handleNavigationFunction}
          >
            Scan
          </button>
        </Col>
      </Row>
    </Container>
  );
};

export default Scanning;
