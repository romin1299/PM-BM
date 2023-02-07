import {
  React,
  NavLink,
  denso_logo,
  halflogo,
  PersonAddAltIcon,
  DashboardIcon,
  NoteAddIcon,
  FactCheckIcon
} from "./ImportModules";

import Logout from "../../Integration/Logout/Logout";
import { useNavigate } from "react-router-dom";
import { FaThList } from "react-icons/fa";

import { useState } from "react";

import {
  Menu,
  MenuItem,
  SubMenu,
  ProSidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
} from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import styled from "styled-components";

import { FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";

import LogoutIcon from "@mui/icons-material/Logout";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import StorageIcon from "@mui/icons-material/Storage";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import ArticleIcon from "@mui/icons-material/Article";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SummarizeIcon from "@mui/icons-material/Summarize";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

const Menuitem = styled(MenuItem)`
  :hover {
    background-color: white;
    padding: 5px;
    color: black;
    // border-radius: 10px;
    // margin:10px;
  }
`;

const Plant = ({ userData }) => {
  const [open, setOpen] = React.useState(true);
  const [menuCollapse, setMenuCollapse] = useState(true);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const styles = {
    sideBarHeight: {
      height: "100vh",
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
            <div className="logotext">
              {/* small and big change using menucollapse state */}
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
            </div>
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
        <Menu iconShape="square" style={styles.bg}>
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
              <NavLink to="/"></NavLink> Section Dashboard
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
              <NavLink to="/summeryDashboard"></NavLink> Plant Dashboard
            </MenuItem>
          </SubMenu>

          <SubMenu
            className="text-white"
            title="Creation"
            icon={<FaThList className="text-white" />}
          >
            {/* <Menuitem className="text">Offer Letter</Menuitem> */}
            <MenuItem
              className="text"
              icon={
                <NoteAddIcon
                  className="text-white"
                  style={{
                    background: "#004B5B",
                    borderRadius: "3px",
                    padding: "2px",
                  }}
                />
              }
            >
              <NavLink to="/creationDashboard"></NavLink>
              Creation Dashboard
            </MenuItem>
            <MenuItem
                className="text"
                icon={
                  <PersonAddIcon
                    className="text-white"
                    style={{
                      background: "#004B5B",
                      borderRadius: "3px",
                      padding: "2px",
                    }}
                  />
                }
              >
               <NavLink to="/userAssign"></NavLink>
                User Assign
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
                <NavLink to="/machineWisePmMonthlyReport"></NavLink>
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
                <NavLink to="/lineWisePmMonthlyReport"></NavLink>
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
                <NavLink to="/annualPMSchedule"></NavLink>
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
                <NavLink to="/annualPmStatus"></NavLink>
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
                <NavLink to="/pmTimeMonitoringReport"></NavLink>
                PM Time Monitoring
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
                <NavLink to="/pmSheetApproval"></NavLink>
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
                <NavLink to="/pmSheetApprovalOfImplementationPhase"></NavLink>
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
                <NavLink to="/logHistory"></NavLink>
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
                <NavLink to="/pendingPMLogHistory"></NavLink>
                Pending PM Log History
              </MenuItem>
            </SubMenu>

            <Menuitem
              className="text-white"
              icon={<BackupTableIcon className="text-white" />}
              data-toggle="tooltip"
              data-placement="right"
              title="Spare Log"
            >
              <NavLink to="/sparePartUsageHistory"></NavLink>
              Spare Log
            </Menuitem>
            <Menuitem
              className="text-white"
              icon={<SummarizeIcon className="text-white" />}
              data-toggle="tooltip"
              data-placement="right"
              title="Spare Report"
            >
              <NavLink to="/spareReportDashboard"></NavLink>
              Spare Report
            </Menuitem>
            <Menuitem
              className="text-white"
              icon={<PendingActionsIcon className="text-white" />}
              data-toggle="tooltip"
              data-placement="right"
              title="Open Abnormality Tracking"
            >
              <NavLink to="/openAbnormalityTrack"></NavLink>
              Open Abnormality Tracking
            </Menuitem>

        </Menu>
      </SidebarContent>
      <SidebarFooter fixed="bottom">
        <Menu iconShape="square">
          <MenuItem
            className="text"
            icon={<LogoutIcon className="text-white" />}
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
      </SidebarFooter>
    </ProSidebar>
  );
};

export default Plant;
