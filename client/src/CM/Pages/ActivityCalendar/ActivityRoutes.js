import React, { useContext } from "react";
import FullCalenderForActivity from "./FullCalenderForActivity";
import RoutingContext from "../../../context/routing/RoutingContext";
import CommonRoutesContainer from "../../../Common/CommonRoutes/CommonRoutesContainer";

const ActivityRoutes = ({ commonRoutes }) => {

  let routes = commonRoutes?.concat([
    {
      path: "/activityCal",
      element: <FullCalenderForActivity />,
    },
  ]);

  return <CommonRoutesContainer routes={routes}/>;
};

export default ActivityRoutes;
