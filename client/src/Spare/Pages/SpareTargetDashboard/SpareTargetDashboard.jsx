import React from "react";
// import React, { useReducer } from "react";
import { useForm, Watch } from "react-hook-form";
import { Container, Row, Col } from "react-bootstrap";
import { Box } from "@mui/system";
import SpareTitlebar from "../../Component/SpareTitlebar";
import MachineCost from "../SpareKPI/SubComponent/MachineCost";

// import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
// import {
//   reducer,
//   initialState,
// } from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
// import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";
import fyMonths from "../../../Utils/fy";

const url = "/v1/spare/kpi/target/inventory";

const TableComponent = () => {
  const { watch, register, handleSubmit, reset } = useForm({
    defaultValues: async () => {
      const { isError, target } = await axiosGetOrDelete({
        url,
      });
      if (!isError) return target;
      return {
        inventoryTarget: Array(12).fill(0),
      };
    },
  });

  const handleSubmitDynamicApproval = async (formValue) => {
    let axiosProps = {
      params: {},
    };

    if (watch("_id")) axiosProps.params._id = watch("_id");

    const response = await axiosPostOrPatch({
      url,
      apiType: watch("_id") ? "patch" : "post",
      axiosProps,
      axiosBody: formValue,
    });

    if (!response?.isError) reset(response?.target);
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitDynamicApproval)}>
      <SpareTitlebar
        title="Inventory trend target"
        Toolbar={
          <>
            <Row className="m-2">
              <table
                style={{
                  width: "100%",
                  // tableLayout: "fixed",
                  borderCollapse: "collapse",
                }}
                className="mtd-parts-section"
              >
                <tr>
                  {fyMonths.map((label) => (
                    <td
                      key={label}
                      className="border p-1"
                      style={{
                        fontWeight: "bold",
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </td>
                  ))}
                </tr>

                <tr>
                  {fyMonths.map((label, index) => (
                    <td key={label} className="border p-1">
                      <input
                        type="number"
                        step={"0.01"}
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          textAlign: "center",
                        }}
                        {...register(`inventoryTarget.${index}`, {
                          valueAsNumber: true,
                        })}
                      />
                    </td>
                  ))}
                </tr>
              </table>
            </Row>

            <Box
              className="m-2"
              sx={{ display: "flex", justifyContent: "start" }}
            >
              <button type="submit" className="btn bg-succ ">
                Submit
              </button>
            </Box>
          </>
        }
      />
    </form>
  );
};

// const LoadDefaultDataMiddleware = ({
//   flagForTogglingFilter,
//   selectedValue,
//   selectedYear,
// }) => {
//   const [{ isLoading, data }] = useSafeGetRequest({
//     url,
//     axiosConfig: {
//       params: {
//         flagForTogglingFilter,
//         selectedValue,
//         selectedYear,
//       },
//     },
//     referenceArrayForUseEffect: [selectedValue, selectedYear],
//     initialState: {
//       isLoading: true,
//       isError: false,
//       data: {
//         target: {},
//       },
//     },
//   });

//   if (isLoading) return <h5>Loading...</h5>;

//   return (
//     <TableComponent
//       flagForTogglingFilter={flagForTogglingFilter}
//       selectedValue={selectedValue}
//       selectedYear={selectedYear}
//       target={data?.target}
//     />
//   );
// };

const SpareTargetDashboard = () => {
  // const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  return (
    <Container fluid>
      <SpareTitlebar
        title="Target Dashboard"
        // Toolbar={
        //   <ChartsToolbar
        //     baseUrlForFiltering="/getFiltrationValue/plant-level-filtration"
        //     queryParams={{ moduleType: "Spare" }}
        //     reduceState={reduceState}
        //     reducerDispatch={reducerDispatch}
        //     sectionFiltration
        //     subSectionFiltration
        //     cellFiltration
        //     yearFiltration
        //     resetButtonFiltration
        //   />
        // }
      />
      <Row className="m-1">
        <Col className="cell col-auto p-1">
          <MachineCost />
        </Col>
      </Row>
      {/* {reduceState?.flagForTogglingFilter === "based-on-cell" && (
        <LoadDefaultDataMiddleware {...reduceState} />
      )} */}
      <TableComponent />
    </Container>
  );
};

export default SpareTargetDashboard;
