import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import CustomHooksForBackNavigation, {
  MuiNavigateBack,
} from "../ButtonComponents/CustomHooksForBackNavigation";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import { Box, Typography } from "@mui/material";

import HistoryIcon from "@mui/icons-material/History";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import DescriptionIcon from "@mui/icons-material/Description";

const allEvents = [
  [
    {
      url: "bm-history",
      formate: "history-formate",
      name: "BM History",
      icon: <HistoryIcon fontSize="large" />,
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
      icon: <ArchitectureIcon fontSize="large" />,
    },
  ],
  [
    {
      url: "pm-history",
      formate: "history-formate",
      name: "PM History",
      icon: <HistoryIcon fontSize="large" />,
    },
    {
      url: "machine-manuals",
      formate: "attachment-formate",
      name: "Machine Manuals",
      icon: <DescriptionIcon fontSize="large" />,
    },
    {
      url: "jigs-dws",
      formate: "attachment-formate",
      name: "Jigs Dws(Mech/Elec)",
      icon: <ArchitectureIcon fontSize="large" />,
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

  const MachineTabCard = ({
    title = "Provide Title",
    icon = null,
    onClick = null,
  }) => {
    return (
      <Box
        sx={{
          p: 2,
          minHeight: "4rem",
          borderBottom: "3px solid #616161",
          borderRadius: "4px",
          bgcolor: "white",
          boxShadow: "-2px -2px 4px 0px rgba(0, 0, 0, 0.03) inset",
          filter:
            "drop-shadow(-2px -2px 4px rgba(0, 0, 0, 0.03)) drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.03))",
        }}
        role="button"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        onClick={onClick}
      >
        <Box
          sx={{
            height: "6rem",
            width: "6rem",
            borderRadius: "50%",
            // bgcolor: "#fecd47",
            background: "#FFF",
            boxShadow:
              "-2px -2px 4px 0px rgba(0, 0, 0, 0.06), 2px 2px 4px 0px rgba(0, 0, 0, 0.06), -2px -2px 4px 0px rgba(0, 0, 0, 0.06) inset",
          }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {icon && icon}
        </Box>
        <Typography
          variant="body1"
          component={"div"}
          textAlign={"center"}
          fontWeight={500}
        >
          {title}
        </Typography>
      </Box>
    );
  };

  const MachineName = ({ machineCode }) => {
    return (
      <Col className="col-auto">
        <Typography
          noWrap
          variant="h4"
          component="h4"
          fontSize={22}
          fontWeight={600}
        >
          <Typography
            noWrap
            variant="body2"
            component="div"
            mb={"-8px"}
            ml={"1px"}
          >
            Machine Code
          </Typography>
          {machineCode}
        </Typography>
      </Col>
    );
  };

  return (
    <Container fluid>
      <ReportTitleBar
        title={"Machine Documents"}
        PreTools={<MuiNavigateBack />}
        Toolbar={<MachineName machineCode={machine_code} />}
      />
      {/* <CustomHooksForBackNavigation /> */}

      {allEvents?.map((item) => (
        <Row className="mt-0 gy-3 gx-3">
          {item?.map((event) => (
            <Col lg={4} md={4} sm={6}>
              <MachineTabCard
                title={event?.name}
                onClick={() => {
                  navigate(
                    `/machine-history/${event?.formate}/${event?.url}/${machine_code}/${search}`
                  );
                }}
                icon={event?.icon || null}
              />
            </Col>
          ))}
        </Row>
      ))}
    </Container>
  );
};

export default MachineDocument;
