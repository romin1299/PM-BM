import FullCalendar from "@fullcalendar/react";
import React from "react";
import multiMonthPlugin from "@fullcalendar/multimonth";
const YearWiseView = () => {
  return (
    <div className="m-2">
      <FullCalendar
        plugins={[multiMonthPlugin, ]}
        // dateClick={handleDateClick}
        // multiMonthMinWidth={230}
        multiMonthMaxColumns={3}
        height={650}
        
        // events={allEvents}
        // {
        //   [
        //   {
        //     // this object will be "parsed" into an Event Object
        //     title: "The Title", // a property!
        //     start: "2025-04-05", // a property!
        //     end: "2025-04-05", // a property! ** see important note below about 'end' **
        //   },
        //   {
        //     // this object will be "parsed" into an Event Object
        //     title: "The Title 12", // a property!
        //     start: "2025-04-05", // a property!
        //     end: "2025-04-05", // a property! ** see important note below about 'end' **
        //   },
        //   {
        //     // this object will be "parsed" into an Event Object
        //     title: "The Title 56", // a property!
        //     start: "2025-04-04", // a property!
        //     end: "2025-04-05", // a property! ** see important note below about 'end' **
        //   },
        //   {
        //     // this object will be "parsed" into an Event Object
        //     title: "The Title 78", // a property!
        //     start: "2025-04-05", // a property!
        //     end: "2025-04-05", // a property! ** see important note below about 'end' **
        //   },
        // ]}
      />
    </div>
  );
};

export default YearWiseView;
