import { useContext, useEffect, useReducer, useState } from "react";
import RequestSheetCustomizedApproval from "./CustomizedApproval/RequestSheetCustomizedApproval";
import ManageCategories from "./CustomizedCategory/ManageCategories";
import { Col, Container, Row } from "react-bootstrap";
import CustomManageShifts from "./CustomizedShifts/CustomManageShifts";
import BMTitlebar from "../Component/BMTitlebar";
import RoutingContext from "../../context/routing/RoutingContext";
import axios from "axios";
import CustomizedMajorBD from "./CustomizedMajorBD.jsx/CustomizedMajorBD";
import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import CustomizedJobAddition from "./CustomizedJobCreation/CustomizedJobAddition";

const MainCustomized = () => {
  const context = useContext(RoutingContext);
  const notEditable = context?.tm_no === Number("9999");
  // console.log("userData", userData);
  const [majorBDTime, setMajorBDTime] = useState({
    setMajorBD: 120,
    sectionWiseMajorBD: 120,
  });
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );

  const getMajorBDTime = async () => {
    try {
      // console.log(selectedSection, selectedSubSection);
      const response = await axios.get(
        `/getMajorBDTime/${reduceState?.flagForTogglingFilter || undefined}/${
          reduceState?.selectedValue || undefined
        }`
      );
      setMajorBDTime({
        ...majorBDTime,
        setMajorBD: response?.data?.majorBDTime
          ? response?.data?.majorBDTime
          : 120,
        sectionWiseMajorBD: response?.data?.getMajorBDTimeSectionWise,
      });
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getMajorBDTime();
  }, [reduceState?.selectedValue]);

  return (
    <Container fluid className="mt-1 pb-5">
      <BMTitlebar title="Customization Dashboard" />

      <Row className="gx-3">
        <Col md={12} lg={6} className="mt-2">
          <RequestSheetCustomizedApproval
            notEditable={notEditable}
            majorBDTime={majorBDTime?.sectionWiseMajorBD}
          />
          {context?.tm_grade === "HOD" && (
            <CustomizedMajorBD
              majorBDTime={majorBDTime}
              notEditable={notEditable}
              setMajorBDTime={setMajorBDTime}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
            />
          )}
          <ManageCategories notEditable={notEditable} />
        </Col>
        <Col md={12} lg={6} className="mt-2">
          <CustomManageShifts notEditable={notEditable} />
          <CustomizedJobAddition />
        </Col>
      </Row>
    </Container>
  );
};

export default MainCustomized;
