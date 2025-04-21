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
import "./calendar.css";
import ExistingMachineReqSheetView from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineReqSheetView";

const FullCalenderForActivity = () => {
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const calendarRef = useRef(null);
  const [allEvents, setAllEvents] = useState([]);
  const [calendarView, setCalendarView] = useState("");

  const defaultState = {
    cmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
  };

  const [selectedCMRequestSheetPopupData, setSelectedCMRequestSheetPopupData] =
    useState(defaultState);

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

  const getReqSheetDataForCalendar = async () => {
    try {
      setAllEvents([]);
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

      let dateToGo;
      if (
        (calendarApi ||
          reduceState?.selectedMonth ||
          reduceState?.selectedYear) &&
        calendarView === "dayGridMonth"
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

        dateToGo = moment({
          year: adjustedYear,
          month: monthIndex,
        }).toDate();

        calendarApi.setOption("height", 600);
        calendarApi.gotoDate(dateToGo);
      } else if (calendarView === "multiMonthYear") {
        dateToGo = moment({
          year: reduceState.selectedYear,
          month: 0, // January
          day: 1,
        }).toDate();
        calendarApi.gotoDate(dateToGo);
        calendarApi.setOption("height", 1000);
      } else if (
        calendarView === "dayGridWeek" ||
        calendarView === "dayGridDay"
      ) {
        dateToGo = new Date();
        calendarApi.gotoDate(dateToGo);
        calendarApi.setOption("height", 550);
      }
      getReqSheetDataForCalendar();
    }
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    calendarView,
  ]);

  const handleViewChange = (arg) => {
    setCalendarView(arg.view.type);
  };

  const handlePopupStatus = () =>
    setSelectedCMRequestSheetPopupData(defaultState);

  const getModalOpenForReqSheet = async (event) => {
    console.log(event)
    setSelectedCMRequestSheetPopupData((selectedCMRequestSheetPopupData) => ({
      ...selectedCMRequestSheetPopupData,
      cmReqSheetView: true,
      selectedRowRequestSheetId: event.id,
    }));
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
        <div style={{ marginBottom: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginRight: "20px",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#D91656",
                display: "inline-block",
                borderRadius: "50%",
                marginRight: "5px",
              }}
            ></span>
            BM
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginRight: "20px",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#FF9D23",
                display: "inline-block",
                borderRadius: "50%",
                marginRight: "5px",
              }}
            ></span>
            CM
          </span>
        </div>
        {reduceState?.flagForTogglingFilter && reduceState?.selectedValue && (
          <FullCalendar
            // customButtons={{
            //   legendBM: {
            //     text: `🔴 BM`,
            //   },
            //   legendCM: {
            //     text: `🟠 CM`,
            //     click: null,
            //   },
            // }}
            plugins={[multiMonthPlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            multiMonthMaxColumns={3}
            buttonText={{ month: "Month", year: "Year" }}
            headerToolbar={{
              right: "multiMonthYear,dayGridMonth,dayGridWeek,dayGridDay",
              left: "title",
              // center: "legendBM,legendCM",
            }}
            eventClick={(info) => {
              getModalOpenForReqSheet(info);
            }}
            ref={calendarRef}
            events={allEvents}
            views={{
              dayGridMonth: {
                dayMaxEventRows: 3,
              },
              multiMonthYear: {
                dayMaxEventRows: 3,
              },
            }}
            datesSet={handleViewChange}
          />
        )}
      </div>

      {selectedCMRequestSheetPopupData?.cmReqSheetView && (
        <ExistingMachineReqSheetView
          handlePopupStatus={handlePopupStatus}
          selectedYear={reduceState?.selectedYear}
          {...selectedCMRequestSheetPopupData}
          selectedMonth={reduceState?.selectedMonth}
        />
      )}
    </>
  );
};

export default FullCalenderForActivity;
