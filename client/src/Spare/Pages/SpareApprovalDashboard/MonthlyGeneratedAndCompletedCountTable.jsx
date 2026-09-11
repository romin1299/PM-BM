import React from "react";
import { Box } from "@mui/material";
import { Table } from "reactstrap";

import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";

const MonthlyGeneratedAndCompletedCountTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
}) => {
  return (
    <WithLoadingAndError
      requestProps={{
        url: `/v1/spare/generatedAndCompletedCount`,
        axiosConfig: {
          params: {
            flagForTogglingFilter,
            selectedValue,
            selectedYear,
          },
        },
        referenceArrayForUseEffect: [
          flagForTogglingFilter,
          selectedValue,
          selectedYear,
        ],
        initialState: {
          isLoading: true,
          isError: false,
          data: {
            tableData: {
              headers: [],
              rows: [
                {
                  status: "",
                  counts: [],
                },
              ],
            },
          },
        },
      }}
      PropComponent={({ tableData }) => (
        <Box className="cell p-2 rounded-2">
          <Box className="spare-scroll-table" sx={{ width: "100%" }}>
            <Table bordered hover className="m-0">
              <thead>
                <tr>
                  {tableData?.headers?.map((item, index) => (
                    <th
                      style={{ background: "#0fa3b1", textAlign: "center" }}
                      key={index}
                    >
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>

              {tableData?.rows?.map((item, index) => (
                <tbody key={`row-${index}`}>
                  <tr>
                    <th style={{ background: "#b5e2fa" }}>{item?.status}</th>
                    {item?.counts?.map((count, inrIdx) => (
                      <td
                        key={`count-${inrIdx}`}
                        style={{ textAlign: "center" }}
                      >
                        {count}
                      </td>
                    ))}
                  </tr>
                </tbody>
              ))}
            </Table>
          </Box>
        </Box>
      )}
    />
  );
};

export default MonthlyGeneratedAndCompletedCountTable;
