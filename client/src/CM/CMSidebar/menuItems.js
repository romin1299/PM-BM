import { AccountCircleIcon, DashboardIcon } from "../../components/NavbarComponent/ImportModules";

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
    icon: <DashboardIcon className="text-white" />,
    route: "/cm",
    allowedRoles: allusers
  },
  {
    icon: <AccountCircleIcon className="text-white" />,
    title: "Profile",
    route: "/profile",
    allowedRoles: allusers,
  },
];
