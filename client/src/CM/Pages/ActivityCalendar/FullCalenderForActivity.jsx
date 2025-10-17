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
  const [calendarView, setCalendarView] = useState({
    view: "",
    start: "",
    end: "",
  });

  const defaultState = {
    cmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
    selectedYear: "",
    selectedDateFromCal: "",
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
      const fromDate = moment(calendarView?.start).format("YYYY-MM-DD");
      const toDate = moment(calendarView?.end).format("YYYY-MM-DD");

      console.log(calendarView?.end, toDate);
      const response = await axios.get(
        `/getReqSheetDataForCalendar/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&calendarViewType=${calendarView?.view}&&fromDate=${fromDate}&toDate=${toDate}`,
        {
          withCredentials: true,
          credentials: "include",
        }
      );
      if (response.status === 200) {
        setAllEvents(response.data.reqSheetDataForCalendar);
      } else {
        setAllEvents([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();

    let dateToGo;
    if (
      (calendarApi ||
        reduceState?.selectedMonth ||
        reduceState?.selectedYear) &&
      calendarView?.view === "dayGridMonth"
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
      calendarApi?.setOption("height", 600);
      calendarApi?.gotoDate(dateToGo);
    } else if (calendarView?.view === "multiMonthYear") {
      dateToGo = moment({
        year: reduceState.selectedYear,
        month: 0, // January
        day: 1,
      }).toDate();
      calendarApi?.gotoDate(dateToGo);
      calendarApi?.setOption("height", 1000);
    } else if (
      calendarView?.view === "dayGridWeek" ||
      calendarView?.view === "dayGridDay"
    ) {
      dateToGo = new Date();
      calendarApi?.gotoDate(dateToGo);
      calendarApi?.setOption("height", 550);
    }

    //for apply next and previous button for the month, week, day
    if (
      calendarApi?.view.type === "dayGridWeek" ||
      calendarApi?.view.type === "dayGridDay" ||
      calendarApi?.view.type === "dayGridMonth"
    ) {
      calendarApi?.setOption("headerToolbar", {
        left: "prev,next title",
        right: "today,multiMonthYear,dayGridMonth,dayGridWeek,dayGridDay",
      });
    } else {
      calendarApi?.setOption("headerToolbar", {
        left: "title",
        right: "multiMonthYear,dayGridMonth,dayGridWeek,dayGridDay",
      });
    }
  }, [
    calendarView?.view,
    reduceState?.selectedMonth,
    reduceState?.selectedYear,
  ]);

  useEffect(() => {
    if (
      calendarView?.view &&
      calendarView?.start &&
      calendarView?.end &&
      reduceState?.selectedValue
    ) {
      getReqSheetDataForCalendar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    calendarView?.start,
    calendarView?.end,
    calendarView?.view,
    reduceState?.selectedValue,
  ]);

  // 1️⃣ Handle view change from FullCalendar
  const handleViewChange = (arg) => {
    setCalendarView({
      view: arg.view.type,
      start: arg.start,
      end: arg.end,
    });
  };

  const handlePopupStatus = () =>
    setSelectedCMRequestSheetPopupData(defaultState);

  const getModalOpenForReqSheet = async (info) => {
    const closeBtn = document.querySelector(".fc-popover-close");
    if (closeBtn) {
      closeBtn.click();
    }

    setSelectedCMRequestSheetPopupData((selectedCMRequestSheetPopupData) => ({
      ...selectedCMRequestSheetPopupData,
      cmReqSheetView: true,
      selectedRowRequestSheetId: info?.event?.id,
      selectedDateFromCal: info?.event?.startStr,
      selectedYear:
        moment(info?.event?.startStr).month() < 3
          ? `${reduceState?.selectedYear?.split("-")[0] - 1}-${
              reduceState?.selectedYear?.split("-")[0]
            }`
          : reduceState?.selectedYear,
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
            plugins={[multiMonthPlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            multiMonthMaxColumns={3}
            buttonText={{ month: "Month", year: "Year" }}
            headerToolbar={{
              right: "today multiMonthYear,dayGridMonth,dayGridWeek,dayGridDay",
              left: "title",
              // center: "legendBM,legendCM",
            }}
            eventClick={(info) => {
              getModalOpenForReqSheet(info);
            }}
            ref={calendarRef}
            events={allEvents}
            views={{
              dayGridWeek: {
                headerToolbar: {
                  left: "prev,next today title", // only for dayGridWeek
                  right: "multiMonthYear,dayGridMonth,dayGridWeek,dayGridDay",
                },
              },
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
          {...selectedCMRequestSheetPopupData}
          selectedMonth={reduceState?.selectedMonth}
        />
      )}
    </>
  );
};

export default FullCalenderForActivity;
