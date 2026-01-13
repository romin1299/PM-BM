import {
  AccountCircleIcon,
  DashboardIcon,
  PiListBulletsFill,
  MdFormatListBulletedAdd,
  CalendarMonthIcon,
  EventNoteIcon,
  FactCheckIcon,
} from "../../components/NavbarComponent/ImportModules";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
// import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
const allusers = [
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  "Operator",
];

const reportAccess = ["Plant-Admin", "Section-Admin", "TL/HOSS", "Operator"];

export const menuItems = [
  // {
  //   title: "Dashboard",
  //   icon: (
  //     <MdFormatListBulletedAdd className="text-white h4 mt-2 align-items-center justify-content-center" />
  //   ),
  //   route: "/cm",
  //   allowedRoles: allusers,
  // },
  {
    title: "CM Report",
    icon: (
      <PiListBulletsFill className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/cm",
    allowedRoles: allusers,
  },
  {
    title: "Approval Dashboard",
    icon: <FactCheckIcon className="text-white" />,
    route: "/cm/approval",
    allowedRoles: ["Section-Admin", "TL/HOSS"],
  },
  {
    icon: <EventNoteIcon className="text-white" />,
    title: "LTPM Sheet",
    route: "/cm/dashboard/ltpm",
    allowedRoles: allusers,
  },
  {
    title: "Approval Logs",
    icon: <AssignmentTurnedInIcon className="text-white" />,
    route: "/cm/approvalLogs",
    allowedRoles: reportAccess,
  },
  {
    title: "Activity Calendar",
    icon: <CalendarMonthIcon className="text-white" />,
    route: "/cm/activity-calendar",
    allowedRoles: allusers,
  },
  {
    icon: <AccountCircleIcon className="text-white" />,
    title: "Profile",
    route: "/profile",
    allowedRoles: allusers,
  },
];
