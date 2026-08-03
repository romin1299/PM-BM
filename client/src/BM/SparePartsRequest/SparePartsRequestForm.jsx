import React, { useMemo } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { useForm, useFieldArray } from "react-hook-form";

import PartListV2 from "../Tabs/SubComponents/PartListV2";
import SpareMasterSearch from "../../Spare/Component/SpareMasterSearch/SpareMasterSearch";
import {
  axiosGetOrDelete,
  axiosPostOrPatch,
} from "../../Spare/Utils/axiosUtils";

import "../../Spare/Pages/SpareOrderingDashboard/SpareOrderTracking.scss";

const url = "/v1/spare/spareIssuanceSheet";

const SparePartsRequestForm = ({
  modelProp,
  machineParentHierarchy,
  _id = null,
  updateRow = null,
  issuedFrom = "BM",
  selectedRow,
}) => {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { isLoading, dirtyFields },
  } = useForm({
    defaultValues: async () => {
      if (!_id)
        return {
          ...machineParentHierarchy,
        };

      const { isError, issuanceSheet } = await axiosGetOrDelete({
        url,
        axiosProps: { params: { _id } },
      });
      if (!isError) return issuanceSheet;
      return {};
    },
  });

  const canEdit = useMemo(
    () => !_id || selectedRow?.canEditIssuanceSheet,
    [_id, selectedRow],
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: "changeParts",
  });

  const dirtyValues = (allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
    return newVal;
  };

  const handleSubmitSpareRequestForm = async (data) => {
    if (_id && Object.keys(dirtyFields).length === 0) return;

    let params = {};

    if (_id) {
      params = { _id };
      data = dirtyValues(data);
    } else data.issuedFrom = issuedFrom;

    const response = await axiosPostOrPatch({
      url,
      apiType: _id ? "patch" : "post",
      axiosProps: { params },
      axiosBody: data,
    });

    if (!response?.isError) {
      if (_id && updateRow) updateRow(response.tableData);
      modelProp.onHide();
    }
  };

  return (
    <Modal
      {...modelProp}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      style={{ zIndex: 1070 }}
    >
      {isLoading ? (
        <h4>Loading....</h4>
      ) : (
        <>
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
                        {...register("line.line_name")}
                      />
                    </div>
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
                        {...register("machine.machine_code")}
                      />
                    </div>
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
                        {...register("machine.machine_name")}
                      />
                    </div>
                  </Col>
                </Row>

                <Row className="m-0  d-flex align-items-center">
                  <Col>
                    <p className="mb-0 pt-1">
                      <b>Spare parts: </b>
                    </p>
                    <PartListV2
                      register={register}
                      fields={fields}
                      append={append}
                      remove={remove}
                      setValue={setValue}
                      canEdit={canEdit}
                    />
                  </Col>
                </Row>

                {canEdit && (
                  <>
                    <Row className="m-0 pt-1 d-flex align-items-center">
                      <SpareMasterSearch append={append} />
                    </Row>

                    <Row className="m-0 pt-2  d-flex align-items-center">
                      <Col>
                        <Button type="submit">Submit</Button>
                      </Col>
                    </Row>
                  </>
                )}
              </form>
            </Container>
          </Modal.Body>
        </>
      )}
    </Modal>
  );
};

export default SparePartsRequestForm;
