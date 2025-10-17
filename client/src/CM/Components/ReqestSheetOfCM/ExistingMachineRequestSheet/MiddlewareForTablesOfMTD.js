import React, { useEffect, useState } from "react";
import PartList from "../../../../BM/Tabs/SubComponents/PartList";
// import ActionList from "../../../../BM/Tabs/SubComponents/ActionList";
import WorkDetails from "../../../../BM/Tabs/SubComponents/WorkDetails";
import { Col, Form, Row, Table } from "react-bootstrap";
import { Button, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

const MiddlewareForTablesOfMTD = ({
  partsData,
  // actionData,
  workData,
  totalTimeBasedOnWork,

  isEditable,
  setValue,
  errors,
  clearErrors,

  requestSheet_year,
  requestSheet_quarter,
  supportingTMList,
  attachedFilesByOperatorUser,
}) => {
  const [fileList, setFileList] = useState({
    currentFile: [],
    deletedFile: [],
  });
  const deleteAttechedFile = (idxOfFile) => {
    const deleted = fileList.currentFile[idxOfFile];
    const updatedFileList = fileList?.currentFile?.filter(
      (_, idx) => idx !== idxOfFile
    );
    const updatedDeleted = [...fileList.deletedFile, deleted];
    setFileList({
      ...fileList,
      currentFile: updatedFileList,
      deletedFile: updatedDeleted,
    });

    setValue("deletedFile", updatedDeleted);
  };

  useEffect(() => {
    setFileList({ ...fileList, currentFile: attachedFilesByOperatorUser });
  }, [attachedFilesByOperatorUser]);

  return (
    <div className=" m-0 border p-2">
      <Row className="d-flex align-items-center">
        <Col>
          <h6>RequestSheet Year : {requestSheet_year}</h6>
          <h6>RequestSheet Quarter : {requestSheet_quarter}</h6>
        </Col>
      </Row>
      <Row className="d-flex align-items-center">
        <Col sm={12} className="m-1">
          <Row className="">
            <PartListMiddleware
              setValue={setValue}
              isEditable={isEditable}
              clearErrors={clearErrors}
              errors={errors}
              partsData={partsData}
            />
          </Row>
        </Col>
        {/* <Col lg={6} sm={12}>
          <Row className="">
            <ActionListMiddleware
              setValue={setValue}
              isEditable={isEditable}
              clearErrors={clearErrors}
              errors={errors}
              actionData={actionData}
            />
          </Row>
        </Col> */}
        <Col sm={12} className="m-1">
          <Row className="">
            <WorkDetailsMiddleware
              setValue={setValue}
              isEditable={isEditable}
              clearErrors={clearErrors}
              errors={errors}
              supportingTMList={supportingTMList}
              workData={workData}
              totalTimeBasedOnWork={totalTimeBasedOnWork}
            />
          </Row>
        </Col>
      </Row>
      <Row className="row m-2">
        <Col sm={4} className="border">
          <small className="mb-0">
            <b>ATTACHED FILES FOR WORK</b>
          </small>
          <br />
          <Form.Group controlId="formFileMultiple" className="mb-3">
            <Form.Control
              type="file"
              multiple
              onChange={(e) =>
                setValue("attachedFilesByOperatorUser", e.target.files)
              }
              disabled={!isEditable}
            />
          </Form.Group>
        </Col>
        <Col>
          <Table bordered>
            <tbody>
              {fileList?.currentFile?.map((value, idx) => (
                <>
                  <tr>
                    <td>{value}</td>
                    <td>
                      <Button
                        target="_blank"
                        href={`${process.env.REACT_APP_BASE_URL}/${value}`}
                        disableElevation
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<DownloadIcon fontSize="small" />}
                      >
                        Download
                      </Button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-white border-0"
                        onClick={() => deleteAttechedFile(idx)}
                        style={{
                          display: isEditable ? "block" : "none",
                        }}
                      >
                        <CloseIcon fontSize="inherit" color="error" />
                      </button>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </div>
  );
};

export default MiddlewareForTablesOfMTD;

const PartListMiddleware = ({
  setValue,
  isEditable,
  clearErrors,
  errors,
  partsData,
}) => {
  const [parts, setParts] = useState([]);

  useEffect(() => {
    setParts(partsData);
  }, [partsData]);

  return (
    <>
      <PartList
        setValue={setValue}
        parts={parts}
        setParts={setParts}
        isEditable={isEditable}
        clearErrors={clearErrors}
      />
      {isEditable && errors?.["changedParts"] && (
        <p className="text-error">{errors?.["changedParts"]?.message}</p>
      )}
    </>
  );
};
// const ActionListMiddleware = ({
//   setValue,
//   isEditable,
//   clearErrors,
//   errors,
//   actionData,
// }) => {
//   const [actions, setActions] = useState([]);

//   useEffect(() => {
//     setActions(actionData);
//   }, [actionData]);

//   return (
//     <>
//       <ActionList
//         setValue={setValue}
//         actions={actions}
//         setActions={setActions}
//         clearErrors={clearErrors}
//         isEditable={isEditable}
//       />

//       {isEditable && errors?.["actionAndCounterMeasureStep"] && (
//         <p className="text-error">
//           {errors?.["actionAndCounterMeasureStep"]?.message}
//         </p>
//       )}
//     </>
//   );
// };
const WorkDetailsMiddleware = ({
  setValue,
  isEditable,
  clearErrors,
  errors,
  supportingTMList,
  workData,
  totalTimeBasedOnWork,
}) => {
  const [workDetails, setWorkDetails] = useState([]);

  useEffect(() => {
    setWorkDetails(workData);
  }, [workData]);

  return (
    <>
      <WorkDetails
        supportingTMList={supportingTMList}
        setValue={setValue}
        workDetails={workDetails}
        setWorkDetails={setWorkDetails}
        clearErrors={clearErrors}
        isEditable={isEditable}
        totalTimeBasedOnWork={totalTimeBasedOnWork}
      />
      {isEditable && errors?.["workDetails"] && (
        <p className="text-error">{errors?.["workDetails"]?.message}</p>
      )}
    </>
  );
};
