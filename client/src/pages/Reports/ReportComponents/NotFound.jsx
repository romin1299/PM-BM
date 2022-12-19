import React from "react";
import Card from "react-bootstrap/Card";

const NotFound = () => {
  return (
    <Card style={{ width: "18rem" }}>
      <Card.Title className="d-flex justify-content-center align-items-center">
        No Data To Display
      </Card.Title>
    </Card>
  );
};

export default NotFound;
