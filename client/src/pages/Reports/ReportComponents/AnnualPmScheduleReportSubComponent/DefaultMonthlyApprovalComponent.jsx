import React from "react";

import CircleIcon from "@mui/icons-material/Circle";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";

import { Row, Col, Container, Button } from "react-bootstrap";
import TextareaAutosize from "@mui/base/TextareaAutosize";

const DefaultMonthlyApprovalComponent = ({
  loggedUserDetails,
  lineInfo,
  objOfAnnualPmScheduleApproval,
}) => {
  let refArrayForTDSpacing = [1, 1, 1];

  let refArrayForTDMapping = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  return (
    <>
      <tr>
        <td className="td-padding">Plan</td>
        <td className="td-padding">
          <PanoramaFishEyeIcon />
        </td>
        <td></td>
        <th className="td-padding">Checked By (TL)</th>
        {refArrayForTDMapping?.map((item, index) => (
          <td className="td-padding"></td>
        ))}
      </tr>

      <tr>
        <td className="td-padding">Actual</td>

        <td className="td-padding">
          <CircleIcon />
        </td>
        <td></td>

        <th className="td-padding">Approved By (HOS)</th>
        {refArrayForTDMapping?.map((item, index) => (
          <td className="td-padding"></td>
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

        {refArrayForTDMapping?.map((item, index) => (
          <td className="td-padding"></td>
        ))}
      </tr>

      <tr>
        <td colSpan={2}>FO/MTD/02/18/00</td>
        <td></td>
        <th className="td-padding">Remarks (If Delay)</th>
        {refArrayForTDMapping?.map((item, index) => (
          <td className="td-padding"></td>
        ))}
      </tr>
    </>
  );
};

export default DefaultMonthlyApprovalComponent;
