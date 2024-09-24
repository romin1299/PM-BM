import {
  AccountCircleIcon,
  DashboardIcon,
  PiListBulletsFill,
  MdFormatListBulletedAdd,
  CalendarMonthIcon,
  EventNoteIcon,
  FactCheckIcon
} from "../../components/NavbarComponent/ImportModules";

const allusers = [
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  "Operator",
];

const reportAccess = ["Plant-Admin", "Section-Admin", "TL/HOSS", "Operator"];

export const menuItems = [
  {
    title: "Dashboard",
    icon: (
      <MdFormatListBulletedAdd className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/cm",
    allowedRoles: allusers,
  },
  {
    title: "CM Report",
    icon: (
      <PiListBulletsFill className="text-white h4 mt-2 align-items-center justify-content-center" />
    ),
    route: "/cm/allRequestSheetReportDataOfCM",
    allowedRoles: allusers,
  },
  {
    title: "Approval Dashboard",
    icon: <FactCheckIcon className="text-white" />,
    route: "/cm/approval",
    allowedRoles: ["Plant-Admin", "Section-Admin", "TL/HOSS"],
  },
  {
    icon: <EventNoteIcon className="text-white" />,
    title: "LTPM Sheet",
    route: "/cm/request-sheet/ltpm",
    allowedRoles: allusers,
  },
  {
    icon: <AccountCircleIcon className="text-white" />,
    title: "Profile",
    route: "/profile",
    allowedRoles: allusers,
  },
];
