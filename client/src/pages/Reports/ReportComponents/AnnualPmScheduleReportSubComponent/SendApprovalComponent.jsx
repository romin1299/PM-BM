import React, { useState, useEffect } from "react";
import moment from "moment";
import PopupForAnnualPmScheduleReport from "../../../../Popups/PopupForAnnualPmScheduleReport";

const SendApprovalComponent = ({
  loggedUserDetails,
  lineInfo,
  objOfAnnualPmScheduleApproval,
  selectedYear,
  allUserDropdownList,
  funForRefreshingDataAfterApproval,
}) => {
  // console.log(loggedUserDetails, lineInfo, objOfAnnualPmScheduleApproval);
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

  const monthKeyArray2 = [
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];
  let refArrayForUserApproval =
    objOfAnnualPmScheduleApproval?.monthlyApprovalData
      ? Object?.values(objOfAnnualPmScheduleApproval?.monthlyApprovalData)
      : monthKeyArray1;

  let upToCurrentMonthIndex = monthKeyArray2?.indexOf(
    monthKeyArray1[new Date().getMonth()]
  );

  const [stateForSendApprovalPopup, setStateForSendApprovalPopup] = useState();

  // console.log("57 $$$$$$$$$$$$$$$$$$$$$$$$$$", refArrayForUserApproval);
  return (
    <>
      {stateForSendApprovalPopup}
      <tr>
        {refArrayForTDSpacing?.map((item) => (
          <th></th>
        ))}
        <th className="td-padding">
          Accept And <br />
          Send For Approval
        </th>
        {refArrayForUserApproval?.map((item, index) => (
          <td className="td-padding">
            {/* {index < upToCurrentMonthIndex ||
            (
              moment().isSame(moment().endOf("month"), "day") &&
              index === upToCurrentMonthIndex) ? (
              item?.checkedByTL ? (
                ""
              ) : ( */}
                <button
                  className="btn-primary2  "
                  onClick={() =>
                    setStateForSendApprovalPopup(
                      <PopupForAnnualPmScheduleReport
                        selectedYear={selectedYear}
                        month={monthKeyArray2?.[index]}
                        lineInfo={lineInfo}
                        funForRefreshingDataAfterApproval={
                          funForRefreshingDataAfterApproval
                        }
                        loggedUserDetails={loggedUserDetails}
                        allUserDropdownList={allUserDropdownList}
                        close={() => setStateForSendApprovalPopup()}
                      />
                    )
                  }
                >
                  Edit
                </button>
              {/* )
            ) : (
              ""
            )} */}
          </td>
        ))}
      </tr>
    </>
  );
};

export default SendApprovalComponent;
