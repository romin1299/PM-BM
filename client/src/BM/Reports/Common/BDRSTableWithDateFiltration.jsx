import React from "react";
import { useForm } from "react-hook-form";

import BDRequestSheetTable from "./DailyBDRequestSheetTable";
import { Button, Paper } from "@mui/material";

const BDRSTableWithDateFiltration = ({
  flagForTogglingFilter,
  selectedValue,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({});

  const [requestSheetData, setRequestSheetData] = React.useState([]);

  const getRequestSheetDataBasedOnSelectedDate = async (data) => {
    try {
      const res = await fetch(
        `/getRequestSheetDataBasedOnSelectedDate/${flagForTogglingFilter}/${selectedValue}/${data?.selectedDate}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, requestSheetData } = await res.json();

      if (res?.status === 201) {
        setRequestSheetData(requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2 }} className="mt-3 g-0">
        <form
          onSubmit={handleSubmit(getRequestSheetDataBasedOnSelectedDate)}
          className="pt-1 d-flex align-items-center justify-content-end"
        >
          <input
            type="date"
            {...register("selectedDate", {
              required: "Please select date",
            })}
          />
          {errors?.["selectedDate"] && (
            <p className="text-error">{errors?.["selectedDate"]?.message}</p>
          )}
          <Button
            size="small"
            disableElevation
            className="bg-button"
            variant="contained"
            type="submit"
            sx={{
              ml: 1,
              minWidth: "30px",
              height: "30px",
              paddingInline: "10px",
            }}
          >
            Go
          </Button>
        </form>

        <BDRequestSheetTable
          requestSheetData={requestSheetData}
          downloadFileName={"Daily breakdown trend"}
        />
      </Paper>
    </>
  );
};

export default BDRSTableWithDateFiltration;
