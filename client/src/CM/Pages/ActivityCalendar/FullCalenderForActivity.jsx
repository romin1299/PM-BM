import React, { useEffect, useReducer, useState } from "react";
import axios from "axios";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import YearWiseView from "./YearWiseView";
import MonthWiseView from "./MonthWiseView";

const FullCalenderForActivity = () => {
  // const handleDateClick = (arg) => {
  //   console.log(arg)
  //   alert(arg);
  // };
  const [allEvents, setAllEvents] = useState();

  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );

  const getReqSheetDataForCalendar = async () => {
    try {
      const response = await axios.get(
        `/getReqSheetDataForCalendar/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}`,
        // /?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          withCredentials: true,
          credentials: "include",
        }
      );
      if (response.status === 200) {
        const events = response.data.reqSheetDataForCalendar?.map((event) => ({
          start: new Date(event.start),
          end: new Date(event.end),
          title: event.title,
          id: event._id,
        }));
        setAllEvents(response.data.reqSheetDataForCalendar);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(
    () => {
      // if (selectedDate && reduceState?.selectedValue)
      getReqSheetDataForCalendar();
    },
    [
      // selectedDate, reduceState?.selectedValue, selectedMonth
    ]
  );

  return (
    <>
      <Tabs
        defaultActiveKey="month"
        id="justify-tab-example"
        className="mb-3"
        // justify
      >
        <Tab eventKey="month" title="Month">
          <MonthWiseView />
        </Tab>
        <Tab eventKey="year" title="Years" className="d-block">
          <YearWiseView />
        </Tab>
      </Tabs>
    </>
  );
};

export default FullCalenderForActivity;
