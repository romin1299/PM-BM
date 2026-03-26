import React, { useState, useEffect } from "react";
import BDRequestSheetAntDesignTable from "./DailyBDRequestSheetAntDesignTable";
import { useForm } from "react-hook-form";
import { Box, Button, Paper } from "@mui/material";
import { Row } from "reactstrap";
import Loading from "../../../components/Loading/Loading";

const AntDesignRSTableWithFiltration = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  downloadFileName,
}) => {
  const [loading, setLoading] = React.useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({});

  const [
    requestSheetDataForProductAndLineWise,
    setRequestSheetDataForProductAndLineWise,
  ] = useState([]);

  const getRequestSheetDataBasedOnFromAndToDateSelection = async (data) => {
    setLoading(true);

    try {
      const res = await fetch(
        `/getRequestSheetDataBasedOnFromAndToDateSelection/${flagForTogglingFilter}/${selectedValue}/${data?.selectedToDate}/${data?.selectedFromDate}/?selectedYear=${selectedYear}`,
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
        setRequestSheetDataForProductAndLineWise(requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) {
      getRequestSheetDataBasedOnFromAndToDateSelection();
    }
  }, [selectedValue, selectedYear]);

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2 }} className="mt-3 g-0">
        <Row>
          <form
            onSubmit={handleSubmit(
              getRequestSheetDataBasedOnFromAndToDateSelection
            )}
            className="p-1 d-flex align-items-center justify-content-end"
          >
            <div>
              <span className="m-1">
                <b>From Date:</b>
              </span>
              <input
                type="date"
                {...register("selectedFromDate", {
                  required: "Please select date",
                })}
              />
              <br />
              {errors?.["selectedFromDate"] && (
                <p className="text-error">
                  {errors?.["selectedFromDate"]?.message}
                </p>
              )}
            </div>
            <div>
              <span className="m-1">
                <b>To Date:</b>
              </span>
              <input
                type="date"
                {...register("selectedToDate", {
                  required: "Please select date",
                })}
              />
              <br />
              {errors?.["selectedToDate"] && (
                <p className="text-error">
                  {errors?.["selectedToDate"]?.message}
                </p>
              )}
            </div>
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

            <Button
              size="small"
              disableElevation
              className="bg-button"
              variant="contained"
              sx={{
                ml: 1,
                minWidth: "30px",
                height: "30px",
                paddingInline: "10px",
              }}
              onClick={() => {
                reset();
                getRequestSheetDataBasedOnFromAndToDateSelection();
              }}
            >
              Reset
            </Button>
          </form>
        </Row>

        {loading ? (
          <Box mt={2}>
            <Loading height={200} />
          </Box>
        ) : (
          <BDRequestSheetAntDesignTable
            requestSheetData={requestSheetDataForProductAndLineWise}
            downloadFileName={downloadFileName}
            selectedYear={selectedYear}
            selectedValue={selectedValue}
            flagForTogglingFilter={flagForTogglingFilter}
          />
        )}
      </Paper>
    </>
  );
};

export default AntDesignRSTableWithFiltration;
