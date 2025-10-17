import React, { useEffect, useState } from "react";
import moment from "moment-timezone";
import { Row, Col } from "react-bootstrap";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import axios from "axios";

const ShiftInputField = ({ dateAndTime, shiftOfBM, setValue }) => {
  const [plantShiftsData, setPlantShiftsData] = useState([]);

  useEffect(() => {
    (async () => {
      const url = "/getAllShifts";
      try {
        const res = await axios.get(url, {
          withCredentials: true,
          credentials: "include",
        });
        if (res.status === 201) {
          setPlantShiftsData(res?.data?.getShifts);
        }
      } catch (error) {
        console.log("error:", error);
      }
    })();
  }, []);

  useEffect(() => {
    const getCurrentShiftName = () => {
      const [_, time] = dateAndTime.split("T");
      const momentTime = moment(time, "HH:mm");

      for (let shiftInfo of plantShiftsData) {
        const startTime = moment(shiftInfo.shiftStartTime, "HH:mm");
        const endTime = moment(shiftInfo.shiftEndTime, "HH:mm");
        if (endTime.isBefore(startTime)) {
          if (
            momentTime.isSameOrAfter(startTime) ||
            momentTime.isSameOrBefore(endTime)
          ) {
            return shiftInfo.shiftName;
          }
        } else {
          if (momentTime.isBetween(startTime, endTime)) {
            return shiftInfo.shiftName;
          }
        }
      }
      return "";
    };

    return () => {
      if (dateAndTime) {
        setValue("shiftOfBM", getCurrentShiftName());
      }
    };
  }, [dateAndTime, plantShiftsData]);

  return (
    <Row className="m-0">
      <Col className="border p-2">
        <FormControl>
          <FormLabel id="demo-radio-buttons-group-label">
            <small>
              <b>SHIFT</b>
            </small>
          </FormLabel>

          {shiftOfBM && (
            <RadioGroup
              row
              value={shiftOfBM}
              aria-labelledby="demo-radio-buttons-group-label"
              name="radio-buttons-group"
            >
              {plantShiftsData?.map((shiftInfo) => (
                <FormControlLabel
                  value={shiftInfo?.shiftName}
                  control={<Radio color="default" size="small" />}
                  label={shiftInfo?.shiftName}
                  disabled={true}
                  defaultChecked={shiftInfo === shiftInfo?.shiftName}
                />
              ))}
            </RadioGroup>
          )}
        </FormControl>
      </Col>
    </Row>
  );
};

export default ShiftInputField;
