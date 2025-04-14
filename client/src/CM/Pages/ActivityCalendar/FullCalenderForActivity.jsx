import React, { useEffect, useReducer, useRef, useState } from "react";
import axios from "axios";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import BMTitlebar from "../../../BM/Component/BMTitlebar";
import FullCalendar from "@fullcalendar/react";
import multiMonthPlugin from "@fullcalendar/multimonth";
import dayGridPlugin from "@fullcalendar/daygrid";
import moment from "moment";

const FullCalenderForActivity = () => {
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const calendarRef = useRef(null);
  const [allEvents, setAllEvents] = useState([]);
  const [calendarView, setCalendarView] = useState('')

  const monthKeyArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );

  const getReqSheetDataForCalendar = async (calendarViewType) => {
    try {
      const response = await axios.get(
        `/getReqSheetDataForCalendar/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&calendarViewType=${calendarView}`,
        {
          withCredentials: true,
          credentials: "include",
        }
      );
      if (response.status === 200) {
        // const events = response.data.reqSheetDataForCalendar?.map((event) => ({
        //   start: moment(event.start).format("YYYY-MM-DD"),
        //   end: moment(event.end).format("YYYY-MM-DD"),
        //   title: event.title,
        //   id: event._id,
        //   textColor: "black",
        //   backgroundColor: "#76ced1",
        //   borderColor: "#9176d1",
        // }));
        setAllEvents(response.data.reqSheetDataForCalendar);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const handleDatesSet = (arg) => {
  //   const currentDate = arg.view.currentStart;
  //   const month = moment(currentDate).month();
  //   const year = moment(currentDate).year();
  //   getReqSheetDataForCalendar(month, year);
  // };

  useEffect(() => {
    if (reduceState?.selectedValue) {
      const calendarApi = calendarRef.current?.getApi();
      if (
        calendarApi ||
        reduceState?.selectedMonth ||
        reduceState?.selectedYear
      ) {
        const monthIndex = monthKeyArray.indexOf(reduceState.selectedMonth);

        if (monthIndex === -1) {
          console.error("Invalid month selected:", reduceState.selectedMonth);
          return;
        }

        // Financial year logic: Apr–Mar
        const adjustedYear =
          monthIndex >= 0 && monthIndex <= 2 // Jan, Feb, Mar
            ? parseInt(reduceState.selectedYear) + 1
            : reduceState.selectedYear;

        const dateToGo = moment({
          year: adjustedYear,
          month: monthIndex,
        }).toDate();

        calendarApi.gotoDate(dateToGo);
      }

      getReqSheetDataForCalendar();
    }
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    calendarView
  ]);

  const handleViewChange = (arg) => {
    setCalendarView(arg.view.type);
  };

  return (
    <>
      <div className="m-2">
        <BMTitlebar
          title="Activity Calender"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
              monthFiltration
              yearFiltration
              // yearFiltrationWithoutFY
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              machineFiltration
              resetButtonFiltration
              isWithLocalStorageForFiltration="Yes"
              defaultSelectedMonth={monthKeyArray[new Date().getMonth()]}
            />
          }
        />
        {reduceState?.flagForTogglingFilter && reduceState?.selectedValue && (
          <FullCalendar
            plugins={[multiMonthPlugin, dayGridPlugin]}
            // dateClick={handleDateClick}
            initialView="dayGridMonth"
            multiMonthMaxColumns={3}
            height={600}
            // buttonText={{ today: "Today" }}
            headerToolbar={{
              right: "dayGridMonth,multiMonthYear",
              center: "title",
              left: "",
            }}
            // datesSet={handleDatesSet}
            ref={calendarRef}
            events={allEvents}
            dayMaxEventRows
            views={{
              dayGridMonth: {
                dayMaxEventRows: 3,
              },
              multiMonthYear: {
                dayMaxEventRows: 2,
              },
            }}

            viewDidMount={handleViewChange}
          />
        )}
      </div>
    </>
  );
};

export default FullCalenderForActivity;
