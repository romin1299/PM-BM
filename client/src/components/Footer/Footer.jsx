import React from "react";
import { Navbar, Row, Col, Container } from "react-bootstrap";
import "./Footer.css"


const Footer = () => {
  return (
    <div>
      <Navbar className="bg-footer">
        {" "}
        <Container fluid className="footer-bottom ">
          {" "}
          <Navbar.Brand className="center">
            {" "}
            <Row>
              {" "}
              <Col sm>
                {" "}
                <div style={{ fontSize: "1rem" }}>
                  <b style={{ color: "#E6232A" }}>
                    {" "}
                    © {new Date().getFullYear()}{" "}
                  </b>
                  Denso. All Rights Reserved.
                </div>{" "}
              </Col>{" "}
            </Row>{" "}
          </Navbar.Brand>{" "}
        </Container>{" "}
      </Navbar>
    </div>
  );
};

export default Footer;
