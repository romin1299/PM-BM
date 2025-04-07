import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const MonthWiseView = () => {
  return (
    <div className="m-2">
      <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth"  height={600} />
    </div>
  );
};

export default MonthWiseView;
