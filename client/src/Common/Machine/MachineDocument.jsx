import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import CustomHooksForBackNavigation from "../ButtonComponents/CustomHooksForBackNavigation";

const allEvents = [
  [
    {
      url: "bm-history",
      formate: "history-formate",
      name: "BM History",
    },
    {
      url: "product-drawing",
      formate: "attachment-formate",
      name: "Product Drawing",
    },
    {
      url: "jigs-mcs",
      formate: "attachment-formate",
      name: "Jigs MCS",
    },
  ],
  [
    {
      url: "pm-history",
      formate: "history-formate",
      name: "PM History",
    },
    {
      url: "machine-manuals",
      formate: "attachment-formate",
      name: "Machine Manuals",
    },
    {
      url: "jigs-dws",
      formate: "attachment-formate",
      name: "Jigs Dws(Mech/Elec)",
    },
  ],
  [
    {
      url: "mech-dws",
      formate: "attachment-formate",
      name: "Mech. Drawings",
    },
    {
      url: "ele-dws",
      formate: "attachment-formate",
      name: "Electric Drawings",
    },
    {
      url: "machine-poka-yoke",
      formate: "attachment-formate",
      name: "Machine Poka-Yoke",
    },
  ],
  [
    {
      url: "spare",
      formate: "attachment-formate",
      name: "Consumable & Spare",
    },
    {
      url: "oms",
      formate: "attachment-formate",
      name: "OMS",
    },
    {
      url: "other-documents",
      formate: "attachment-formate",
      name: "Other Documents",
    },
  ],
];

const MachineDocument = () => {
  const { machine_code } = useParams();

  const { search } = useLocation();

  const navigate = useNavigate();

  return (
    <Container className="p-2">
      <CustomHooksForBackNavigation />

      {allEvents?.map((item) => (
        <Row>
          {item?.map((event) => (
            <Col
              lg={3}
              role="button"
              className="cell p-2 m-2"
              onClick={() => {
                navigate(
                  `/machine-history/${event?.formate}/${event?.url}/${machine_code}/${search}`
                );
              }}
            >
              {event?.name}
            </Col>
          ))}
        </Row>
      ))}
    </Container>
  );
};

export default MachineDocument;
