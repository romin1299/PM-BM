import React, { useEffect, useReducer, useState } from "react";
import ChartTitleBar from "../../Reports/Common/ChartTitleBar";
import { Box, Button, TextField } from "@mui/material";
import { CommonDropdown } from "../../Reports/ManHourReport/SubComponents/LineSelectionDropdown";
import ChartsToolbar from "../../Reports/ManHourReport/SubComponents/ChartsToolbar";

import { useForm } from "react-hook-form";
import {
  initialState,
  reducer,
} from "../../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import axios from "axios";
import { toast } from "react-toastify";

const CustomizedMajorBD = ({
  majorBDTime,
  notEditable,
  setMajorBDTime,
  reduceState,
  reducerDispatch,
}) => {
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  // const [reduceState, reducerDispatch] = useReducer(
  //   reducer,
  //   initialState("Yes")
  //   // getMajorBDTime(reduceState?.selectedSection, reduceState?.selectedSubSection)
  // );
  // const [majorBDTime, setMajorBDTime] = useState(120);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const onFinish = async (data) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const response = await axios.post(
        `/add-major-BD/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}`,
        {
          majorBD: data.majorBD,
        },
        config
      );

      toast.success(response.data.message);
      setMajorBDTime({
        ...majorBDTime,
        setMajorBDTime: response?.data?.majorBDTime,
      });
      reset();
    } catch (error) {
      toast.error("Major BD time failed to set");
      console.log(error);
    }
  };
  // console.log(majorBDTime)
  return (
    <div className="cell p-3">
      <div>
        <ChartTitleBar title="Set Major BD Time" />
        <Box>
          <ChartsToolbar
            baseUrlForFiltering={baseUrlForFiltering}
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            sectionFiltration
            subSectionFiltration
          />
        </Box>
        <Box
          className="d-flex justify-content-start align-items-end"
          gap={5}
          mt={1}
          component={"form"}
          onSubmit={handleSubmit(onFinish)}
        >
          <TextField
            id="standard-basic"
            // label="Minutes"
            variant="standard"
            placeholder={
              majorBDTime?.setMajorBDTime ? majorBDTime?.setMajorBDTime : 120
            }
            {...register("majorBD", { required: true })}
            helperText={
              errors.majorBD && (
                <p className="text-danger m-0 p-0">This field is required</p>
              )
            }
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="small"
            disabled={notEditable}
          >
            Set
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default CustomizedMajorBD;
