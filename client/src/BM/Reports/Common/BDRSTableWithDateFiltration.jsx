import React from "react";
import { useForm } from "react-hook-form";

import BDRequestSheetTable from "./DailyBDRequestSheetTable";
import { Button, Paper } from "@mui/material";

const BDRSTableWithDateFiltration = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({});

  const [loading, setLoading] = React.useState(false);
  const [requestSheetData, setRequestSheetData] = React.useState([]);

  const getRequestSheetDataBasedOnSelectedDate = async (data) => {
    setLoading(true);

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

    setLoading(false);
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2 }} className="cell mt-3 g-0">
        <form
          onSubmit={handleSubmit(getRequestSheetDataBasedOnSelectedDate)}
          className="mb-2 pt-1 d-flex align-items-center justify-content-end"
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
          loading={loading}
          requestSheetData={requestSheetData}
          downloadFileName={"Daily breakdown trend"}
          selectedYear={selectedYear}
        />
      </Paper>
    </>
  );
};

export default BDRSTableWithDateFiltration;
