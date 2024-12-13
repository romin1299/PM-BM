import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

const MTTRTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [MTTRTrendData, setMTTRTrendData] = useState({
    labels: [],
    data: [],
    target: [],
    backgroundColor: [],
  });

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    filterValues,
    selectedValue
  );

  let arrayItems;
  let filterHeaders;

  if (userDetails.tm_grade === "HOD") {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      ...filteredValuesWithHOD,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  } else {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      userDetails?.section_data.split("-")?.[1],
      ...filteredValues,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  }

  const getMTTRTrendData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getTrendData/MTTR/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getTrendData/MTTR/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&targetKey=monthlyMTTRTarget`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, data } = await res.json();

      if (res?.status === 201) {
        setMTTRTrendData(data);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Labels"].concat(MTTRTrendData?.labels);

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [[MTTRTrendData?.labels, MTTRTrendData?.data]];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Labels"].concat(MTTRTrendData?.labels)?.toString() + "\n"],
          [["Hours"].concat(MTTRTrendData?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [["Hours"].concat(MTTRTrendData?.data)];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `MTTR_Trend_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getMTTRTrendData();
    }
  }, [selectedValue, selectedYear]);

  return (
    <>
      <LineBarChart
        title="MTTR Trend"
        xAxisTitle="Months"
        y1AxisTitle="MTTR Hours"
        loading={loading}
        dataset={MTTRTrendData}
        label={{
          lineLabel: "Target",
          barLabel: "MTTR",
        }}
        onClickDownload={handleDownload}
      />
    </>
  );
};

export default MTTRTrend;

// const TrendData = await RequestSheetOfBM.aggregate([
//   {
//     $match: {},
//   },
//   {
//     $group: {
//       _id: {
//         $dateToString: {
//           format: "%m",
//           date: "$sheetIssuedDateAndTimeOfBM",
//           timezone: timezone,
//         },
//       },
//       count: { $sum: 1 },
//       hours: {
//         $sum: {
//           $cond: [
//             { $gt: ["$sheetCompletedDateAndTime", null] },
//             {
//               $divide: [
//                 {
//                   $subtract: [
//                     "$sheetCompletedDateAndTime",
//                     "$sheetIssuedDateAndTimeOfBM",
//                   ],
//                 },
//                 3600000,
//               ],
//             },
//             0,
//           ],
//         },
//       },
//       target: {
//         $sum: {
//           $cond: [
//             { $gt: ["$sheetCompletedDateAndTime", null] },
//             {
//               $divide: [
//                 {
//                   $subtract: [
//                     "$sheetCompletedDateAndTime",
//                     "$sheetIssuedDateAndTimeOfBM",
//                   ],
//                 },
//                 3600000,
//               ],
//             },
//             0,
//           ],
//         },
//       },
//     },
//   },
//   {
//     $project: {
//       count: 1,
//       target: 1,
//       hours: {
//         $divide: ["$hours", "$count"],
//       },
//     },
//   },
//   {
//     $group: {
//       _id: null,
//       array: { $push: "$$ROOT" },
//     },
//   },
//   {
//     $project: {
//       _id: 0,
//       array: {
//         $map: {
//           input: allMonths,
//           as: "month",
//           in: {
//             $cond: [
//               { $in: ["$$month.monthInDecimal", "$array._id"] },
//               {
//                 month: "$$month.monthName",
//                 value: {
//                   $arrayElemAt: [
//                     "$array",
//                     {
//                       $indexOfArray: [
//                         "$array._id",
//                         "$$month.monthInDecimal",
//                       ],
//                     },
//                   ],
//                 },
//               },
//               {
//                 month: "$$month.monthName",
//                 value: {
//                   _id: "$$month.monthInDecimal",
//                   count: 0,
//                   hours: 0,
//                   target: 0,
//                 },
//               },
//             ],
//           },
//         },
//       },
//     },
//   },
//   { $unwind: "$array" },
//   {
//     $replaceRoot: { newRoot: "$array" },
//   },
//   {
//     $group: {
//       _id: null,
//       labels: { $push: "$month" },
//       target: { $push: "$value.target" },
//       data: {
//         $push: "$value.hours",
//       },
//       backgroundColor: {
//         $push: {
//           $cond: [
//             {
//               $lte: ["$value.hours", "$value.target"],
//             },
//             "green",
//             "red",
//           ],
//         },
//       },
//     },
//   },
// ]);
