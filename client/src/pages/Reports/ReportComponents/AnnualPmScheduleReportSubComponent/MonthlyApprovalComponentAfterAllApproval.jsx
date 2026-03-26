import React from "react";

import CircleIcon from "@mui/icons-material/Circle";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";

const MonthlyApprovalComponentAfterAllApproval = ({
  loggedUserDetails,
  lineInfo,
  objOfAnnualPmScheduleApproval,
  selectedYear,
  funForRefreshingDataAfterApproval,
}) => {
  let refArrayForTDSpacing = [1, 1, 1];

  const monthKeyArray1 = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let refArrayForUserApproval =
    objOfAnnualPmScheduleApproval?.monthlyApprovalData !== {}
      ? Object.values(objOfAnnualPmScheduleApproval?.monthlyApprovalData)
      : monthKeyArray1;

  let refArrayForUserApprovalKeys =
    objOfAnnualPmScheduleApproval?.monthlyApprovalData !== {}
      ? Object.keys(objOfAnnualPmScheduleApproval?.monthlyApprovalData)
      : monthKeyArray1;

  const approveMonthlyRequest = async (
    columnValue,
    index,
    keyRefForHosOrHod
  ) => {
    // console.log("*******************", refArrayForUserApprovalKeys?.[index]);

    const res = await fetch("/approveMonthlyRequestForAnnualPmSchedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedYear,
        month: refArrayForUserApprovalKeys?.[index],
        keyRefForHosOrHod,
        lineInfo,
      }),
    });

    const data = res.json();

    if (res.status === 400 || res.status === 422 || !data) {
      console.log("Error");
    } else {
      console.log("Updated SuccessFully");
      funForRefreshingDataAfterApproval();
    }
  };

  // console.log(refArrayForUserApproval);
  // console.log(
  //   loggedUserDetails?.user_type === "Section-Admin" &&
  //     loggedUserDetails?.tm_grade === "HOS" &&
  //     loggedUserDetails?.tm_department
  // );
  return (
    <>
      <tr>
        <td className="td-padding">Plan</td>
        <td className="td-padding">
          <PanoramaFishEyeIcon />
        </td>
        <td></td>
        <th className="td-padding">Checked By (TL)</th>
        {refArrayForUserApproval?.map((item, index) => (
          <td className="td-padding">
            {/* {console.log(item)} */}
            {/* {index <= upToCurrentMonthIndex ? (
              <button
                className="btn-primary2"
                // onClick={formik.handleSubmit}
              >
                Check
              </button>
            ) : (
              ""
            )} */}
            {item?.checkedByTL?.tm_name}
          </td>
        ))}
      </tr>

      <tr>
        <td className="td-padding">Actual</td>

        <td className="td-padding">
          <CircleIcon />
        </td>
        <td></td>

        <th className="td-padding">Approved By (HOS)</th>
        {refArrayForUserApproval?.map((item, index) => (
          <td className="td-padding">
            {item?.assignHOS ? (
              loggedUserDetails?.user_type === "Section-Admin" &&
              loggedUserDetails?.tm_grade === "HOS" &&
              loggedUserDetails?.tm_department &&
              item?.assignHOS?._id === loggedUserDetails?._id ? (
                item?.approvedByHOS === "Accepted" ? (
                  <>
                    {item?.assignHOS?.tm_name}
                    <br />
                    Status: {item?.approvedByHOS}
                  </>
                ) : (
                  <>
                    <button
                      className="btn-primary2"
                      onClick={() => approveMonthlyRequest(item, index, "hos")}
                    >
                      Accept
                    </button>
                  </>
                )
              ) : (
                <>
                  {item?.assignHOS?.tm_name}
                  <br />
                  Status: {item?.approvedByHOS}
                </>
              )
            ) : (
              ""
            )}
          </td>
        ))}
      </tr>

      <tr>
        {refArrayForTDSpacing.map((item) => (
          <td></td>
        ))}
        <th className="td-padding">
          Approved By (HOD)
          <br />
          (Only in case of delay)
        </th>

        {refArrayForUserApproval?.map((item, index) => (
          <td className="td-padding">
            {item?.assignHOD ? (
              loggedUserDetails?.user_type === "Plant-Admin" &&
              loggedUserDetails?.tm_grade === "HOD" &&
              loggedUserDetails?.tm_department &&
              item?.assignHOD?._id === loggedUserDetails?._id ? (
                item?.approvedByHODIfDelay === "Accepted" ? (
                  <>
                    {item?.assignHOD?.tm_name}
                    <br />
                    Status: {item?.approvedByHODIfDelay}
                  </>
                ) : item?.approvedByHOS === "Accepted" ? (
                  <>
                    <button
                      className="btn-primary2"
                      onClick={() => approveMonthlyRequest(item, index, "hod")}
                    >
                      Accept
                    </button>
                  </>
                ) : (
                  <>
                    {item?.assignHOD?.tm_name}
                    <br />
                    Status: {item?.approvedByHODIfDelay}
                  </>
                )
              ) : (
                <>
                  {item?.assignHOD?.tm_name}
                  <br />
                  Status: {item?.approvedByHODIfDelay}
                </>
              )
            ) : (
              ""
            )}
          </td>
        ))}
      </tr>

      <tr>
        <td colSpan={2}>FO/MTD/02/18/00</td>
        <td></td>
        <th className="td-padding">Remarks (If Delay)</th>
        {refArrayForUserApproval?.map((item, index) => (
          <td className="td-padding">
            {item?.remarksIfDelay ? item?.remarksIfDelay : ""}
          </td>
        ))}
      </tr>
    </>
  );
};

export default MonthlyApprovalComponentAfterAllApproval;
