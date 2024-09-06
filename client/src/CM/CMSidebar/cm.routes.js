import BMTitlebar from "../../BM/Component/BMTitlebar";

const allusers = [
  "Admin",
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  "Operator",
];

export const cmRoutes = [
  {
    title: "Plant Dashboard",
    path: "/cm", //all users
    element: (
      <div className="container-fluid">
        {/* <BMTabDashboard /> */}
        <BMTitlebar title="Plant Dashboard" />
        This is CM 
      </div>
    ),
    allowedRoles: allusers
  },
];
