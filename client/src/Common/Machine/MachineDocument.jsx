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

import BM_History from "../../static/Icons/BM_History_1.png";
import product_drawing from "../../static/Icons/product_drawing_2.png";
import PM_history from "../../static/Icons/PM_history_4.png";
import machine_manual from "../../static/Icons/machine_manual_5.png";
import jigs_dws from "../../static/Icons/jigs_dws_6.png";
import electric_drawing from "../../static/Icons/electric_drawing_8.png";
import jigs_mcs from "../../static/Icons/jigs_mcs_3.png";
import machine_pokayoke from "../../static/Icons/machine_pokayoke_9.png";
import OMS from "../../static/Icons/OMS_11.png";
import other_documents from "../../static/Icons/other_documents_12.png";
import mechanical from "../../static/Icons/mechanical_7.png";
import consumable_spare from "../../static/Icons/consumable_spare_10.png";

const allEvents = [
  [
    {
      url: "bm-history",
      formate: "history-formate",
      name: "BM History",
      icon: BM_History,
    },
    {
      url: "product-drawing",
      formate: "attachment-formate",
      name: "Product Drawing",
      icon: product_drawing,
    },
    {
      url: "jigs-mcs",
      formate: "attachment-formate",
      name: "Jigs MCS",
      icon: jigs_mcs,
    },
    {
      url: "pm-history",
      formate: "history-formate",
      name: "PM History",
      icon: PM_history,
    },
    // ],
    // [
    {
      url: "machine-manuals",
      formate: "attachment-formate",
      name: "Machine Manuals",
      icon: machine_manual,
    },
    {
      url: "jigs-dws",
      formate: "attachment-formate",
      name: "Jigs Dws(Mech/Elec)",
      icon: jigs_dws,
    },
    {
      url: "mech-dws",
      formate: "attachment-formate",
      name: "Mech. Drawings",
      icon: mechanical,
    },
    {
      url: "ele-dws",
      formate: "attachment-formate",
      name: "Electric Drawings",
      icon: electric_drawing,
    },
    // ],
    // [
    {
      url: "machine-poka-yoke",
      formate: "attachment-formate",
      name: "Machine Poka-Yoke",
      icon: machine_pokayoke,
    },
    {
      url: "spare",
      formate: "attachment-formate",
      name: "Consumable & Spare",
      icon: consumable_spare,
    },
    {
      url: "oms",
      formate: "attachment-formate",
      name: "OMS",
      icon: OMS,
    },
    {
      url: "other-documents",
      formate: "attachment-formate",
      name: "Other Documents",
      icon: other_documents,
    },
  ],
];

export const MachineNameTypography = ({ machineCode, machineName }) => {
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
          mb={"-4px"}
          ml={"1px"}
        >
          Machine: {machineCode}
        </Typography>
        {machineName}
      </Typography>
    </Col>
  );
};

const MachineDocument = () => {
  const { machine_code } = useParams();
  const navigate = useNavigate();

  const { search, state } = useLocation();
  const machineName = state?.selectedMachineDetails?.machine_name;

  const MachineTabCard = ({
    title = "Provide Title",
    icon = null,
    onClick = null,
  }) => {
    return (
      <Box
        sx={{
          p: 2,
          // minHeight: "4rem",
          // borderBottom: "2px solid #616161",
          // borderRadius: "4px",
          // bgcolor: "white",
          // boxShadow: "-2px -2px 4px 0px rgba(0, 0, 0, 0.03) inset",
          // filter:
          //   "drop-shadow(-2px -2px 4px rgba(0, 0, 0, 0.03)) drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.03))",
        }}
        display="flex"
        flexDirection="column"
        // justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
        <Box
          role="button"
          className="icon-circle"
          onClick={onClick}
          sx={{
            height: "10rem",
            width: "10rem",
            // borderRadius: "50%",
            // bgcolor: "#fecd47",
            background: "#FFF",
            boxShadow:
              "-2px -2px 4px 0px rgba(0, 0, 0, 0.06), 2px 2px 4px 0px rgba(0, 0, 0, 0.06), -2px -2px 4px 0px rgba(0, 0, 0, 0.06) inset",
          }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <img
            src={icon}
            alt=""
            srcset=""
            height={"100rem"}
            width={title === "Jigs MCS" ? "150rem" : "100rem"}
          />
          {/* {icon && icon} */}
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

  return (
    <Container fluid>
      <ReportTitleBar
        title={"Machine Documents"}
        // PreTools={<MuiNavigateBack />}
        Toolbar={
          <MachineNameTypography
            machineCode={machine_code}
            machineName={machineName}
          />
        }
      />
      {/* <CustomHooksForBackNavigation /> */}

      {allEvents?.map((item) => (
        <Row className="m-0 gy-3 gx-3">
          {item?.map((event) => (
            <Col lg={2} md={4} sm={6}>
              <MachineTabCard
                title={event?.name}
                onClick={() => {
                  navigate(
                    `/machine-history/${event?.formate}/${event?.url}/${machine_code}/${search}`,
                    {
                      state: {
                        selectedMachineDetails: state?.selectedMachineDetails,
                      },
                    }
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
