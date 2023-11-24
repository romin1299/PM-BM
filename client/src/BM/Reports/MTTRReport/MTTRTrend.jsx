import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";

const MTTRTrend = ({ selectedValue, flagForCellAndLineToggle }) => {
  const [MTTRTrendData, setMTTRTrendData] = useState({
    labels: [],
    data: [],
    target: [],
    backgroundColor: [],
  });

  const getMTTRTrendData = async () => {
    try {
      const res = await fetch(
        `/getTrendData/MTTR/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getTrendData/MTTR/${flagForCellAndLineToggle}/${selectedValue}`,
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
        console.log(data);
        setMTTRTrendData(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMTTRTrendData();
    if (selectedValue) {
    }
  }, [selectedValue]);

  return (
    <>
      <LineBarChart
        title="MTTR Trend"
        xAxisTitle="Months"
        dataset={MTTRTrendData}
        label={{
          lineLabel: "Target",
          barLabel: "MTTR",
        }}
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
