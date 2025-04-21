import React from "react";
import FullCalenderForActivity from "./FullCalenderForActivity";
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
