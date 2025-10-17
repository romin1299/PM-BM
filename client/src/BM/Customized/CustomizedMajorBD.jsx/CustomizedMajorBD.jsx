import React, { useReducer } from "react";
import ChartTitleBar from "../../Reports/Common/ChartTitleBar";
import { Box, Button, TextField } from "@mui/material";
import { CommonDropdown } from "../../Reports/ManHourReport/SubComponents/LineSelectionDropdown";
import ChartsToolbar from "../../Reports/ManHourReport/SubComponents/ChartsToolbar";

import { useForm } from "react-hook-form";
import {
  getMajorBDTime,
  initialState,
  reducer,
} from "../../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import axios from "axios";
import { Bounce, toast, ToastContainer } from "react-toastify";

const CustomizedMajorBD = ({
  setSelectedSection,
  setSelectedSubSection,
  majorBDTime,
}) => {
    console.log("For update----");

  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
    // getMajorBDTime(reduceState?.selectedSection, reduceState?.selectedSubSection)
  );
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm();
  // console.log("this is reduce ", reduceState);
  setSelectedSection(reduceState?.selectedSection);
  setSelectedSubSection(reduceState?.selectedSubSection);
  const onFinish = async (data) => {
    console.log(data);
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const response = await axios.post(
        `/add-major-BD?section=${reduceState?.selectedSection}&subSection=${reduceState?.selectedSubSection}`,
        {
          majorBD: data.majorBD
        },
        config
      );

      toast.success(response.data.message);
      reset();
      console.log(response);
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
            placeholder={majorBDTime ? majorBDTime : 120}
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
          >
            Set
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default CustomizedMajorBD;
