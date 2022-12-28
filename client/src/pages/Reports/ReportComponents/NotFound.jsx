import React from "react";
import Card from "react-bootstrap/Card";
import NoDataFound from '../../../images/no-data3.png'

const NotFound = () => {
  return (
    <Card style={{ width: "18rem" }}>
      {/* <Card.Title className="d-flex justify-content-center align-items-center"> */}
        {/* No Data To Display */}
        
        <img src={NoDataFound} alt="" />
      {/* </Card.Title> */}
    </Card>
  );
};

export default NotFound;
