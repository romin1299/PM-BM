import {
  React,
  styles,
  useContext,
  NavContext,
  NavLink,
  denso_logo,
  halflogo,
  FaTimes,
  AccountCircleIcon,
  DashboardIcon,
  NoteAddIcon,
} from "./ImportModules";

import { FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";
import LogoutIcon from "@mui/icons-material/Logout";
import Logout from "../../Integration/Logout/Logout";
import { useNavigate } from "react-router-dom";
import { FaCog, FaUserTie, FaColumns, FaThList } from "react-icons/fa";
import handleProSideBarWidthVarForMainDashboard from "./handleProSideBarWidthVarForMainDashboard";

import { useState } from "react";

import {
  Menu,
  MenuItem,
  ProSidebar,
  SidebarHeader,
  SubMenu,
  SidebarFooter,
  SidebarContent,
} from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import styled from "styled-components";

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

import TaskIcon from "@mui/icons-material/Task";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import StorageIcon from "@mui/icons-material/Storage";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import ArticleIcon from "@mui/icons-material/Article";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AssessmentIcon from "@mui/icons-material/Assessment";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { BASE_URL } from "../../ConditionsForDNINandDNHA/ConditionBasedDisplay";
import CancelScheduleSendIcon from "@mui/icons-material/CancelScheduleSend";

const Menuitem = styled(MenuItem)`
  :hover {
    background-color: white;
    padding: 5px;
    color: black;
    // border-radius: 10px;
    // margin:10px;
  }
`;

const Operator = ({ userData }) => {
  const [open, setOpen] = React.useState(true);
  const [menuCollapse, setMenuCollapse] = useState(true);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const styles = {
    sideBarHeight: {
      height: "110vh",
    },
    menuIcon: {
      float: "left",
      marginBottom: "1rem",
      marginLeft: "1.5rem",
    },
    bg: {
      background: "#004B5B",
    },
  };
  const onClickMenuIcon = () => {
    // setCollapsed(!collapsed);
    handleProSideBarWidthVarForMainDashboard(menuCollapse);
    menuCollapse ? setMenuCollapse(false) : setMenuCollapse(true);
  };

  const loggedOut = () => {
    navigate("/");
    setTimeout(() => {
      window.location.reload(false);
    }, 100);
  };
  return (
    <ProSidebar style={styles.sideBarHeight} collapsed={menuCollapse}>
      <div style={styles.bg}>
        {/* <div className="d-flex align-items-center justify-content-center m-2">
          <img src={denso_logo} alt="" style={{ width: "60px" }} />
        </div> */}
        <div>
          <SidebarHeader>
            {/* <div className="logotext">
              <p className="d-flex align-items-center justify-content-center m-2 sticky-top bg-white">
                {menuCollapse ? (
                  <img
                    src={denso_logo}
                    alt=""
                    style={{ width: "100%", padding: "5px" }}
                    className="bg-white"
                  />
                ) : (
                  <img
                    src={denso_logo}
                    alt=""
                    style={{ width: "50%" }}
                    className="bg-white"
                  />
                )}
              </p>
            </div> */}
            <div
              className="closemenu"
              onClick={onClickMenuIcon}
              style={styles.menuIcon}
            >
              {/* changing menu collapse icon on click */}
              {menuCollapse ? (
                <FiArrowRightCircle className="text-white h4 mt-2" />
              ) : (
                <FiArrowLeftCircle className="text-white h4 mt-2" />
              )}
            </div>
            {/* <div style={styles.menuIcon} onClick={onClickMenuIcon}>
              <MenuIcon className="text-white" style={{ fontSize: "1.5rem" }} />
            </div> */}
          </SidebarHeader>
        </div>
      </div>
      <SidebarContent>
        <Menu iconShape="square" style={{ ...styles.bg, height: "75vh" }}>
          <SubMenu
            className="text-white"
            title="Dashboard"
            icon={<DashboardIcon className="text-white" />}
          >
            {/* <Menuitem className="text">Offer Letter</Menuitem> */}
            <MenuItem
              className="text"
              data-toggle="tooltip"
              data-placement="right"
              title="Dashboard"
              icon={
                <DashboardIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/"></NavLink> Section Dashboard
            </MenuItem>

            <MenuItem
              className="text"
              data-toggle="tooltip"
              data-placement="right"
              title="Dashboard"
              icon={
                <DashboardIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/summeryDashboard"></NavLink> Plant Dashboard
            </MenuItem>
          </SubMenu>

          <SubMenu
            className="text-white"
            title="Creation"
            icon={<FaThList className="text-white" />}
          >
            <MenuItem
              className="text"
              icon={
                <TaskIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/checkSheetDashboard"></NavLink>
              CheckSheet Dashboard
            </MenuItem>
          </SubMenu>

          <SubMenu
            className="text-white"
            title="Approval Log"
            icon={<StorageIcon className="text-white" />}
          >
            {/* <Menuitem className="text">Offer Letter</Menuitem> */}
            <MenuItem
              className="text"
              icon={
                <FactCheckIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
              href="/pmSheetApproval"
            >
              <NavLink to="/pm/pmSheetApproval"></NavLink>
              Preparation / Planning
            </MenuItem>

            <MenuItem
              className="text"
              icon={
                <AssignmentTurnedInIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/pmSheetApprovalOfImplementationPhase"></NavLink>
              PM Plan vs Actual Approval
            </MenuItem>
          </SubMenu>

          <SubMenu
            className="text-white"
            title="PM Log"
            icon={<LibraryBooksIcon className="text-white" />}
          >
            {/* <Menuitem className="text">Offer Letter</Menuitem> */}
            <MenuItem
              className="text"
              icon={
                <LibraryBooksIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/logHistory"></NavLink>
              PM Log
            </MenuItem>

            <MenuItem
              className="text"
              icon={
                <PendingActionsIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/pendingPMLogHistory"></NavLink>
              Pending PM Log History
            </MenuItem>
          </SubMenu>
          <SubMenu
            className="text-white"
            title="PM Report"
            icon={<AssessmentIcon className="text-white" />}
          >
            {/* <Menuitem className="text">Offer Letter</Menuitem> */}
            <MenuItem
              className="text"
              icon={
                <ArticleIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/machineWisePmMonthlyReport"></NavLink>
              Monthly Report (Machine)
            </MenuItem>

            <MenuItem
              className="text"
              icon={
                <ArticleIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/lineWisePmMonthlyReport"></NavLink>
              Monthly Report (Line)
            </MenuItem>
            <MenuItem
              className="text"
              icon={
                <ArticleIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/annualPMSchedule"></NavLink>
              Annual PM Schedule
            </MenuItem>
            <MenuItem
              className="text"
              icon={
                <ArticleIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/annualPmStatus"></NavLink>
              Annual PM PM vs Actual
            </MenuItem>
            <MenuItem
              className="text"
              icon={
                <ArticleIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/pm/pmTimeMonitoringReport"></NavLink>
              PM Time Monitoring
            </MenuItem>
          </SubMenu>

          <Menuitem
            className="text-white"
            icon={<CancelScheduleSendIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="User Manual"
          >
            <NavLink to={"/pm/checkApprovalSendOrNotMainDashboard"}></NavLink>
            Approval Send Or Not
          </Menuitem>

          <Menuitem
            className="text-white"
            icon={<CloudDownloadIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="Back-end Data"
          >
            <NavLink to="/pm/backupDataOfCheckSheet"></NavLink>
            Back-end Data
          </Menuitem>

          <Menuitem
            className="text-white"
            icon={<PendingActionsIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="Open Abnormality Tracking"
          >
            <NavLink to="/pm/openAbnormalityTrack"></NavLink>
            Open Abnormality Tracking
          </Menuitem>
          <Menuitem
            className="text-white"
            icon={<AddToPhotosIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="Spare Entry"
          >
            <NavLink to="/pm/operatorDataEntry"></NavLink>
            Spare Entry
          </Menuitem>

          <Menuitem
            className="text-white"
            icon={<BackupTableIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="Spare Log"
          >
            <NavLink to="/pm/sparePartUsageHistory"></NavLink>
            Spare Log
          </Menuitem>
          <Menuitem
            className="text-white"
            icon={<SummarizeIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="Spare Report"
          >
            <NavLink to="/pm/spareReportDashboard"></NavLink>
            Spare Report
          </Menuitem>
          <Menuitem
            className="text-white"
            icon={<MenuBookIcon className="text-white" />}
            data-toggle="tooltip"
            data-placement="right"
            title="User Manual"
          >
            <NavLink
              to={`${process.env.REACT_APP_BASE_URL}/Denso PM User Manual_OSL16Oct2023.pdf`}
              target="_blank"
            ></NavLink>
            User Manual
          </Menuitem>
        </Menu>
        <Menu iconShape="square">
          <MenuItem
            className="text"
            icon={
              <LogoutIcon
                className="text-white"
                style={{ transform: "rotate(180deg)" }}
              />
            }
            data-toggle="tooltip"
            data-placement="right"
            title="Logout"
            onClick={() =>
              Logout(userData).then((res) => {
                if (res) {
                  loggedOut();
                }
              })
            }
          >
            {" "}
            Logout{" "}
          </MenuItem>
        </Menu>
      </SidebarContent>
      {/* <SidebarFooter fixed="bottom">
        <Menu iconShape="square">
          <MenuItem
            className="text"
            icon={
              <LogoutIcon
                className="text-white"
                style={{ transform: "rotate(180deg)" }}
              />
            }
            data-toggle="tooltip"
            data-placement="right"
            title="Logout"
            onClick={() =>
              Logout(userData).then((res) => {
                if (res) {
                  loggedOut();
                }
              })
            }
          >
            {" "}
            Logout{" "}
          </MenuItem>
        </Menu>
      </SidebarFooter> */}
    </ProSidebar>
  );
};

export default Operator;
