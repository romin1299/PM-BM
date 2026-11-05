import React, { useEffect, useMemo, useReducer } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { useForm, useWatch, useFieldArray } from "react-hook-form";

import PartListV2 from "../Tabs/SubComponents/PartListV2";
import SpareMasterSearch from "../../Spare/Component/SpareMasterSearch/SpareMasterSearch";
import {
  axiosGetOrDelete,
  axiosPostOrPatch,
} from "../../Spare/Utils/axiosUtils";
import toastifyContainer from "../../Spare/Utils/toastifyContainer";
import { partsWithoutAvailableStock } from "../../Spare/Utils/availableStockUtils";

import "../../Spare/Pages/SpareOrderingDashboard/SpareOrderTracking.scss";
import useSafeGetRequest from "../../CustomHooks/useSafeGetRequest";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  reducer,
  initialState,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

const url = "/v1/spare/spareIssuanceSheet";

const refId = (ref) => ref?._id ?? ref ?? null;

/**
 * The form's machine hierarchy, from a PM/BM/CM request-sheet row. Those rows
 * carry the hierarchy two ways: cellRef / lineRef / machineRef, which are bare
 * ObjectIds unless the endpoint populated them, and the display strings line,
 * machineNo and machineName. The ids are what the server needs to create the
 * issuance sheet; the names are what the popup shows, so both are taken —
 * passing the refs alone left the Line and Machine fields blank.
 */
export const machineParentHierarchyFromSheet = (row) => ({
  cell: { _id: refId(row?.cellRef), cell_name: row?.cellRef?.cell_name },
  line: {
    _id: refId(row?.lineRef),
    line_name: row?.lineRef?.line_name ?? row?.line,
  },
  machine: {
    _id: refId(row?.machineRef),
    machine_code: row?.machineRef?.machine_code ?? row?.machineNo,
    machine_name: row?.machineRef?.machine_name ?? row?.machineName,
  },
});

/** Whether the hierarchy holds a machine id but not the names to show for it. */
const isMissingNames = (hierarchy) =>
  Boolean(hierarchy?.machine?._id) &&
  !(hierarchy?.machine?.machine_code && hierarchy?.line?.line_name);

/**
 * "Other" is an issue that belongs to no PM / BM / CM sheet, so there is no row
 * to take the machine from: the requester picks it from the filter dropdowns.
 */
export const ISSUED_FROM_OTHER = "Other";

const ReminderEmailsSelection = ({ register, errors }) => {
  const [{ data, isLoading }] = useSafeGetRequest({
    url: "/v1/spare/approvalUsers",
    axiosConfig: {
      params: {
        withDefaultKeys: "Yes",
        requestFor: "EmailReminder",
      },
    },
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        allUsers: [],
      },
    },
  });

  if (isLoading)
    return (
      <Col lg={6}>
        <h4>Loading....</h4>
      </Col>
    );

  return (
    <Col lg={6}>
      <Row className="m-0 d-flex align-items-center">
        <p className="mb-0 pt-1">
          <b>Email Reminder</b>
        </p>
      </Row>
      {data?.allUsers?.map((item) => (
        <Row className="m-0 d-flex align-items-center">
          <Col lg={4}>
            <p className="mb-0 pt-1">
              <b>{item?.fieldRef?.displayName} </b>
            </p>
          </Col>
          <Col lg={7}>
            <select
              style={{ fontSize: "14px", width: "100%" }}
              className={"d-inline m-1"}
              {...register(item?.fieldRef?.approvalKey, {
                required: `Please select ${item?.fieldRef?.displayName}`,
              })}
            >
              <option selected disabled value="">
                Please select
              </option>
              {item?.users?.map((obj) => (
                <option value={obj?._id}>{obj?.tm_name}</option>
              ))}
            </select>
            {errors?.[item?.fieldRef?.approvalKey] && (
              <p className="text-error mb-1">
                {errors?.[item?.fieldRef?.approvalKey]?.message}
              </p>
            )}
          </Col>
        </Row>
      ))}
    </Col>
  );
};

const SparePartsRequestForm = ({
  modelProp,
  machineParentHierarchy,
  _id = null,
  updateRow = null,
  issuedFrom = "BM",
  selectedRow,
  onSaved = null,
}) => {
  const {
    watch,
    register,
    control,
    setValue,
    handleSubmit,
    formState: { isLoading, dirtyFields, errors },
  } = useForm({
    defaultValues: async () => {
      if (!_id) {
        /**
         * Request-sheet rows hand over the ids of the cell, line and machine but
         * not always their names (BM and CM rows store the references only), so
         * the names are looked up here. Done before the form opens, so it never
         * shows blank Line / Machine fields.
         */
        if (isMissingNames(machineParentHierarchy)) {
          const { isError, hierarchy } = await axiosGetOrDelete({
            url: `${url}/machineHierarchy`,
            axiosProps: {
              params: { machineId: machineParentHierarchy.machine._id },
            },
          });
          if (!isError && hierarchy)
            return { ...machineParentHierarchy, ...hierarchy };
        }

        return {
          ...machineParentHierarchy,
        };
      }

      const { isError, issuanceSheet } = await axiosGetOrDelete({
        url,
        axiosProps: { params: { _id } },
      });
      if (!isError) return issuanceSheet;
      return {};
    },
  });

  const isOtherIssue = issuedFrom === ISSUED_FROM_OTHER && !_id;

  // The dropdowns' own state, used only when the requester picks the machine.
  const [hierarchyFilters, hierarchyFiltersDispatch] = useReducer(
    reducer,
    initialState(),
  );

  useEffect(() => {
    if (!isOtherIssue) return;
    setValue("machine._id", hierarchyFilters?.selectedMachine || "", {
      shouldValidate: Boolean(hierarchyFilters?.selectedMachine),
    });
  }, [isOtherIssue, hierarchyFilters?.selectedMachine, setValue]);

  const canEdit = useMemo(
    () => !_id || selectedRow?.canEditIssuanceSheet,
    [_id, selectedRow],
  );

  useEffect(() => {
    if (isOtherIssue)
      register("machine._id", { required: "Please select the line and machine" });
  }, [isOtherIssue, register]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "changeParts",
  });

  const changeParts = useWatch({
    control,
    name: "changeParts",
  });

  const isTemporaryPartSelected = useMemo(() => {
    if (!changeParts?.length) return false;

    let isSelected = false;

    for (let i = 0; i < changeParts.length; i++) {
      if (changeParts[i]?.temporaryOrPermanent === "Temporary") {
        isSelected = true;
        break;
      }
    }

    return isSelected;
  }, [changeParts]);

  const dirtyValues = (allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
    return newVal;
  };

  const handleSubmitSpareRequestForm = async (data) => {
    if (_id && Object.keys(dirtyFields).length === 0) return;

    const unavailable = partsWithoutAvailableStock(data?.changeParts);
    if (unavailable.length) {
      toastifyContainer({
        type: "error",
        variant: "alert",
        message: `No quantity available for: ${unavailable.join(
          ", ",
        )}. Stock the part in before issuing it.`,
      });
      return;
    }

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
      // A new sheet is not in any list the caller holds; let it reload.
      if (!_id && onSaved) onSaved();
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
                {isOtherIssue && (
                  <Row className="m-0 pb-2 d-flex align-items-center">
                    <Col>
                      <ChartsToolbar
                        baseUrlForFiltering="/getFiltrationValue/all-filtration"
                        // A Spare screen: gives a tool-room user the plant-wide
                        // lists. See server/utils/userScope.js.
                        queryParams={{ scopeModule: "Spare" }}
                        reduceState={hierarchyFilters}
                        reducerDispatch={hierarchyFiltersDispatch}
                        sectionFiltration
                        subSectionFiltration
                        cellFiltration
                        lineFiltration
                        machineFiltration
                      />
                      {errors?.machine?._id && (
                        <p className="text-error mb-1">
                          {errors.machine._id.message}
                        </p>
                      )}
                    </Col>
                  </Row>
                )}
                <Row>
                  <Col lg={6} className={isOtherIssue ? "d-none" : undefined}>
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
                  </Col>

                  {isTemporaryPartSelected && (
                    <ReminderEmailsSelection
                      register={register}
                      errors={errors}
                    />
                  )}
                </Row>

                <Row className="m-0  d-flex align-items-center">
                  <Col>
                    <p className="mb-0 pt-1">
                      <b>Spare parts: </b>
                    </p>
                    <PartListV2
                      watch={watch}
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
