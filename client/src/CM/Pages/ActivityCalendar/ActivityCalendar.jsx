import React, { useEffect, useState } from "react";
// import $ from "jquery";
// import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DatePicker from "react-datepicker";
import {
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import { Container, Modal } from "react-bootstrap";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "bootstrap/dist/js/bootstrap.bundle.min";
import axios from "axios";
import ExistingMachineReqSheetWithData from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineReqSheetView";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const initialEvents = [
  {
    title: "dsfsg",
    start: new Date(2024, 6, 24, 14, 30),
    allDay: true,
    end: new Date(2024, 6, 24, 15, 30),
    // start: "Tue Oct 01 2024 14:56:44 GMT+0530 (India Standard Time)",
    // end: "Tue Oct 01 2024 14:56:44 GMT+0530 (India Standard Time)",
  },
  // {
  //   title: "Meeting 2",
  //   start: new Date(2024, 6, 24, 14, 30),
  //   end: new Date(2024, 6, 24, 15, 30),
  // },
  // {
  //   title: "Meeting 5",
  //   start: new Date(2024, 6, 25, 3, 30),
  //   end: new Date(2024, 6, 25, 4, 30),
  // },
  // {
  //   title: "Meeting 3",
  //   start: new Date(2024, 6, 11, 11, 0),
  //   end: new Date(2024, 6, 11, 12, 0),
  // },
  // {
  //   title: "Meeting 4",
  //   start: new Date(2024, 6, 16, 10, 0),
  //   end: new Date(2024, 6, 16, 11, 0),
  // },
];

const EventCalendar = ({ onNavigate, label, onView, date }) => {
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setSelectedMonth(newMonth);
    const newDate = new Date(date.setMonth(newMonth));
    onNavigate("DATE", newDate);
  };

  const handleYearChange = (event) => {
    const newYear = event.target.value;
    setSelectedYear(newYear);
    const newDate = new Date(date.setFullYear(newYear));
    onNavigate("DATE", newDate);
  };

  const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(0, i), "MMMM")
  );
  const years = Array.from(
    { length: 20 },
    (_, i) => date.getFullYear() - 10 + i
  );

  return (
    <div className="custom-toolbar d-flex justify-content-between mb-4">
      <div className="d-flex align-items-center">
        <FormControl size="small" style={{ margin: "0 8px" }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            onChange={handleMonthChange}
            label="Month"
            style={{ width: 120 }}
          >
            {months.map((month, index) => (
              <MenuItem key={index} value={index}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" style={{ margin: "0 8px" }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            label="Year"
            style={{ width: 120 }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button sx={{ pr: 0, pl: 0 }} onClick={() => onNavigate("PREV")}>
          <FaChevronLeft />
        </Button>
        <Button
          sx={{
            background: "#018B8D",
            ml: 0,
            mr: 0,
            mb: 2,
            mt: 2,
            color: "#ffffff",
            ":hover": { background: "#B5D8D9", color: "#018B8D" },
          }}
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </Button>
        <Button onClick={() => onNavigate("NEXT")}>
          <FaChevronRight />
        </Button>
      </div>
      <div className="view-buttons">
        <Button
          className="m-2"
          sx={{
            background: "#5BBF0D",
            color: "#ffffff",
            ":hover": { background: "#EAFADE", color: "#5BBF0D" },
          }}
          onClick={() => onView(Views.MONTH)}
        >
          Month
        </Button>
        <Button
          className="m-2"
          sx={{
            background: "#FFB81A",
            color: "#ffffff",
            ":hover": { background: "#FFE4A7", color: "#FFB81A" },
          }}
          onClick={() => onView(Views.WEEK)}
        >
          Week
        </Button>
        <Button
          className="m-2"
          sx={{
            background: "#F42B67",
            color: "#ffffff",
            ":hover": { background: "#FFD8E3", color: "#F42B67" },
          }}
          onClick={() => onView(Views.DAY)}
        >
          Day
        </Button>
        <Button
          className="m-2"
          sx={{
            background: "#1C75D4",
            color: "#ffffff",
            ":hover": { background: "#C1DFFF", color: "#1C75D4" },
          }}
          onClick={() => onView(Views.AGENDA)}
        >
          Agenda
        </Button>
      </div>
    </div>
  );
};
const ActivityCalendar = () => {
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: new Date(),
    end: new Date(),
  });
  const [allEvents, setAllEvents] = useState(initialEvents);
  const [currentView, setCurrentView] = useState(Views.MONTH);

  const getReqSheetDataForCalendar = async () => {
    try {
      const response = await axios.get("/getReqSheetDataForCalendar", {
        withCredentials: true,
        credentials: "include",
      });
      console.log(response);
      if (response.status === 200) {
        const events = response.data.reqSheetDataForCalendar?.map((event) => ({
          start: new Date(event.start),
          end: new Date(event.end),
          title: event.title,
          // allDay: true,
          id: event._id,
        }));
        setAllEvents(events);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getReqSheetDataForCalendar();
  }, []);

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.start && newEvent.end) {
      setAllEvents([...allEvents, newEvent]);
      setNewEvent({ title: "", start: new Date(), end: new Date() });
    } else {
      toast.error("Please fill in all fields");
    }
  };

  const CustomEvent = ({ event }) => {
    const startDate = format(new Date(event.start), "MMMM d, yyyy h:mm a");
    const endDate = format(new Date(event.end), "MMMM d, yyyy h:mm a");

    const renderTooltip = (props) => (
      <Tooltip id="event-tooltip" {...props}>
        {`${event.title}, Start: ${startDate}, End: ${endDate}`}
      </Tooltip>
    );
    return (
      <OverlayTrigger placement="top" overlay={renderTooltip}>
        <div
          style={{
            padding: "2px 5px",
            background: "transparent",
            border: "none",
          }}
        >
          {event.title}
        </div>
      </OverlayTrigger>
    );
  };

  const eventPropGetter = (event, start, end, isSelected) => {
    let backgroundColor;
    let color = "white";

    switch (currentView) {
      case Views.MONTH:
        backgroundColor = "#004B5B"; // Color for Month view
        break;
      case Views.WEEK:
        backgroundColor = "#FFB81A"; // Color for Week view
        break;
      case Views.DAY:
        backgroundColor = "#F42B67"; // Color for Day view
        break;
      case Views.AGENDA:
        backgroundColor = "#ececec"; // Color for Agenda view
        color = "#000000";
        break;
      default:
        backgroundColor = "#ff7f50"; // Default color
    }

    return {
      style: {
        backgroundColor,
        color,
        borderRadius: "5px",
        border: "none",
        marginLeft: "5px",
        width: "80%",
        height: "fit-content",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    };
  };

  const CustomToolbar = (toolbarProps) => {
    const { view, onView } = toolbarProps;
    useEffect(() => {
      setCurrentView(view);
    }, [view]);

    return <EventCalendar {...toolbarProps} />;
  };
  const [modalOpenForReqSheet, setModalOpenForReqSheet] = useState(false);
  const [reqSheetData, setReqSheetData] = useState();
  const getModalOpenForReqSheet = async (event) => {
    try {
      const response = await axios.get(`/getReqSheetDataByID/${event.id}`);
      if (response.status === 200) {
        console.log(response);
        setReqSheetData(response.data.requestSheet?.[0]);
        setModalOpenForReqSheet(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-3 ">
      {/* <Container> */}
      <Calendar
        localizer={localizer}
        events={allEvents}
        startAccessor="start"
        endAccessor="end"
        onDoubleClickEvent={(event) => getModalOpenForReqSheet(event)}
        style={{ height: 500 }}
        components={{
          toolbar: CustomToolbar, // Use CustomToolbar for view updates
          event: CustomEvent, // Use CustomEvent for displaying event details
        }}
        eventPropGetter={eventPropGetter}
      />
      {/* </Container> */}

      <br />
      <br />
      <br />
      {modalOpenForReqSheet && (
        <>
          <Modal
            show={modalOpenForReqSheet}
            fullscreen
            aria-labelledby="contained-modal-title-vcenter"
            centered
          >
            <Modal.Header>
              <Modal.Title id="contained-modal-title-vcenter">
                CM Request-Sheet
              </Modal.Title>
              <Button
                variant="secondary"
                onClick={() => setModalOpenForReqSheet(false)}
                sx={{
                  backgroundColor: "#B02A37",
                  color: "#F2F2F2",
                  "&:hover": {
                    backgroundColor: "#B02A37",
                    cursor: "pointer",
                  },
                }}
              >
                Close
              </Button>
            </Modal.Header>
            <Modal.Body>
              <div>
                <ExistingMachineReqSheetWithData
                  cmSelectedSheetForView={reqSheetData}
                />
              </div>
            </Modal.Body>
          </Modal>
        </>
      )}
    </div>
  );
};

export default ActivityCalendar;
