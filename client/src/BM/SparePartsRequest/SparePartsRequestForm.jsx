import React, { useState, useCallback, useMemo, memo } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import axios from "axios";
import AddBoxIcon from "@mui/icons-material/AddBox";

import PartListV2 from "../Tabs/SubComponents/PartListV2";

import SpareSheetCustomTable from "../../Spare/Component/SpareSheetCustomTable";
import SparePartSearchBar from "../../Spare/Component/SparePartSearchBar";
import "../../Spare/Pages/SpareOrderingDashboard/SpareOrderTracking.scss";

const ActionComponent = memo(({ otherData, handleAddPartRow }) => (
  <>
    <td className="td-padding ">
      <div className="d-flex align-items-center justify-content-center">
        <AddBoxIcon
          fontSize="small"
          className="button-style text-primary"
          onClick={() => handleAddPartRow(otherData)}
        />
      </div>
    </td>
  </>
));

const SparePartsRequestForm = ({ modelProp, selectedRow }) => {
  const [parts, setParts] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      line_name: selectedRow?.line,
      machine_code: selectedRow?.machineNo,
      machine_name: selectedRow?.machineName,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "changeParts",
  });

  const handleSubmitSpareRequestForm = async (data) => {
    try {
      data["parts"] = parts;
      await axios.post("/sendSparePartsRequestMail", {
        withCredentials: true,
        credentials: "include",
        data,
      });
    } catch (error) {
      console.log("error:", error);
    }
    modelProp.onHide();
  };

  const [search, setSearch] = useState("");

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: {
        search,
      },
      referenceArrayForUseEffect: [search],
    }),
    [search],
  );

  const handleSelectOtherFilters = useCallback(
    ({ search }) => setSearch(search),
    [],
  );

  const handleAddPartRow = useCallback(
    (propState) => {
      append(propState?.changeParts);
    },
    [append],
  );

  const otherParentProps = useMemo(
    () => ({
      handleAddPartRow,
    }),
    [handleAddPartRow],
  );

  return (
    <Modal
      {...modelProp}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Spare parts request
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <form onSubmit={handleSubmit(handleSubmitSpareRequestForm)}>
            <Row className="m-0 d-flex align-items-center">
              <Col lg={3}>
                <p className="mb-0 pt-1">
                  <b>Line name: </b>
                </p>
              </Col>
              <Col lg={5}>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    id="prob"
                    className="m-1 mb-2"
                    style={{ width: "350px" }}
                    disabled
                    // value={selectedRow?.line}
                    {...register("line_name", {
                      required: "Please enter the line name",
                    })}
                  />
                </div>
                {errors?.["line_name"] && (
                  <p className="text-error m-1 ">
                    {errors?.["line_name"]?.message}
                  </p>
                )}
              </Col>
            </Row>

            <Row className="m-0 d-flex align-items-center">
              <Col lg={3}>
                <p className="mb-0 pt-1">
                  <b>Machine code: </b>
                </p>
              </Col>
              <Col lg={5}>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    id="prob"
                    className="m-1 mb-2"
                    style={{ width: "350px" }}
                    disabled
                    {...register("machine_code", {
                      required: "Please enter the machine code",
                    })}
                  />
                </div>
                {errors?.["machine_code"] && (
                  <p className="text-error m-1 ">
                    {errors?.["machine_code"]?.message}
                  </p>
                )}
              </Col>
            </Row>

            <Row className="m-0 d-flex align-items-center">
              <Col lg={3}>
                <p className="mb-0 pt-1">
                  <b>Machine name: </b>
                </p>
              </Col>
              <Col lg={5}>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    id="prob"
                    className="m-1 mb-2"
                    style={{ width: "350px" }}
                    disabled
                    {...register("machine_name", {
                      required: "Please enter the machine name",
                    })}
                  />
                </div>
                {errors?.["machine_name"] && (
                  <p className="text-error m-1 ">
                    {errors?.["machine_name"]?.message}
                  </p>
                )}
              </Col>
            </Row>

            <Row className="m-0  d-flex align-items-center">
              <Col>
                <p className="mb-0 pt-1">
                  <b>Spare parts: </b>
                </p>
                <PartListV2 register={register} fields={fields} />
              </Col>
            </Row>

            <Row className="m-0 d-flex align-items-start gap-2">
              <div className="p-2 d-flex justify-content-end">
                <SparePartSearchBar
                  handleSelectOtherFilters={handleSelectOtherFilters}
                />
              </div>

              {apiReferencePropsBasedOnFilters && (
                <SpareSheetCustomTable
                  apiReferencePropsBasedOnFilters={
                    apiReferencePropsBasedOnFilters
                  }
                  otherHeaders={["Action"]}
                  url="/v1/spare/spareSearch"
                  OtherComp={ActionComponent}
                  otherParentProps={otherParentProps}
                />
              )}
            </Row>

            <Row className="m-0 pt-2  d-flex align-items-center">
              <Col>
                <Button type="submit">Submit</Button>
              </Col>
            </Row>
          </form>
        </Container>
      </Modal.Body>
    </Modal>
  );
};

export default SparePartsRequestForm;
