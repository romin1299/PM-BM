import React, { useEffect, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import { useNavigate } from "react-router-dom";
import {
  CATEGORIES_OF_CM,
  FREQUENCY_OF_CM,
} from "../../../CM/GlobalDataAccess/GlobalData";

const initialState = {
  cmBasicDataFilledByMTD_TL: {
    id: "",
    activityOfCM: "",
    frequencyType: "",
    frequencyValue: "",
    categories: "",
    actionForLTPM: "",
    inspectionItem: "",
    lineId: "",
    machineId: "",
    other_categories: "",
  },
  targetDateOfCM: "",
};

const BMReflectionYokotenkai = ({
  dataOfTheCM,
  setDataOfTheCM,
  handleOnchangeFlag,
  isEditable,
  clearErrors,
  setValue,
}) => {
  // console.clear();

  const [isAdding, setIsAdding] = useState(false);
  const [editedDataOfCM, setEditedDataOfCM] = useState(null);
  const [newDataOfCM, setNewDataOfCM] = useState(initialState);
  const [lineandMachineList, setLineandMachineList] = useState({
    machines: [],
    lines: [],
  });
  const addData = (event) => {
    event.preventDefault();
    if (
      newDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId &&
      newDataOfCM?.cmBasicDataFilledByMTD_TL?.machineId &&
      newDataOfCM?.cmBasicDataFilledByMTD_TL?.activityOfCM &&
      newDataOfCM?.cmBasicDataFilledByMTD_TL?.frequencyType &&
      newDataOfCM?.cmBasicDataFilledByMTD_TL?.categories &&
      newDataOfCM?.targetDateOfCM
    ) {
      // Assign a new id by incrementing the maximum id
      newDataOfCM.cmBasicDataFilledByMTD_TL.id = dataOfTheCM?.length;
      let updatedDataOfCM = [
        ...dataOfTheCM,
        {
          ...newDataOfCM,
          cmBasicDataFilledByMTD_TL: {
            ...newDataOfCM.cmBasicDataFilledByMTD_TL,
            line: lineandMachineList?.lines?.find(
              (value) =>
                value?._id === newDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId
            )?.line_name,
            machineName: lineandMachineList?.machines?.find(
              (value) =>
                value?._id === newDataOfCM?.cmBasicDataFilledByMTD_TL?.machineId
            )?.machine_name,
          },
        },
      ];
      setDataOfTheCM(updatedDataOfCM);
      setValue &&
        setValue("changedDataOfCM", updatedDataOfCM, { shouldDirty: true });
      handleOnchangeFlag && handleOnchangeFlag("cmData_val_flag");
      clearErrors && clearErrors("changedDataOfCM");
      setNewDataOfCM(initialState);
      setIsAdding(false);
    }
  };
  const editData = (event, data) => {
    console.log(data);
    event.preventDefault();
    setEditedDataOfCM({ ...data });
  };

  const updateData = (event) => {
    event.preventDefault();
    if (
      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId &&
      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.machineId &&
      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.activityOfCM &&
      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.frequencyType &&
      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.categories &&
      editedDataOfCM?.targetDateOfCM
    ) {
      let updatedDataOfCM = dataOfTheCM.map((data, index) =>
        (data.id || index) === editedDataOfCM.id ? editedDataOfCM : data
      );
      updatedDataOfCM[0].cmBasicDataFilledByMTD_TL.line =
        lineandMachineList?.lines?.find(
          (value) =>
            value?._id === editedDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId
        )?.line_name;

      updatedDataOfCM[0].cmBasicDataFilledByMTD_TL.machineName =
        lineandMachineList?.machines?.find(
          (value) =>
            value?._id === editedDataOfCM?.cmBasicDataFilledByMTD_TL?.machineId
        )?.machine_name;
      setDataOfTheCM(updatedDataOfCM);
      setValue &&
        setValue("changedDataOfCM", updatedDataOfCM, { shouldDirty: true });
      handleOnchangeFlag && handleOnchangeFlag("cmData_val_flag");
      setEditedDataOfCM(null);
    }
  };

  const cancelEdit = (event) => {
    event.preventDefault();

    setNewDataOfCM(initialState);
    setEditedDataOfCM(null);
    setIsAdding(false);
  };

  const deleteData = (event, CMdataID) => {
    event.preventDefault();

    const updatedDataOfCM = dataOfTheCM.filter(
      (data, index) => (data?.id || index) !== CMdataID
    );
    setDataOfTheCM(updatedDataOfCM);
    setValue &&
      setValue("changedDataOfCM", updatedDataOfCM, { shouldDirty: true });
    handleOnchangeFlag && handleOnchangeFlag("cmData_val_flag");
  };

  const navigate = useNavigate();
  const getAllLineAndMachineForCM = async () => {
    try {
      const res = await fetch(
        `/getAllLineAndMachineForCM/?line_names=${
          newDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId ||
          editedDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId
        }`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.status === 404) {
        navigate("/bm", { replace: true });
      } else {
        const { allLinesList, allMachineRelatedToSelectedLine } =
          await res.json();
        if (allLinesList || allMachineRelatedToSelectedLine) {
          setLineandMachineList({
            ...lineandMachineList,
            lines: allLinesList || [],
            machines: allMachineRelatedToSelectedLine || [],
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllLineAndMachineForCM();
  }, [
    newDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId,
    editedDataOfCM?.cmBasicDataFilledByMTD_TL.lineId,
  ]);

  return (
    <div className="mtd-parts-section">
      <Row className="m-0 d-flex">
        <Col sm={2} className="border col-auto d-flex align-items-center gap-1">
          <small>
            <b>LINE</b>
          </small>
        </Col>
        <Col sm={2} className="border col-auto d-flex align-items-center gap-1">
          <small>
            <b>MACHINE</b>
          </small>
        </Col>
        <Col sm={2} className="border col-auto d-flex align-items-center gap-1">
          <small>
            <b>ACTIVITY</b>
          </small>
        </Col>
        <Col sm={2} className="border col-auto d-flex align-items-center gap-1">
          <small>
            <b>CATEGORY</b>
          </small>
        </Col>
        <Col sm={1} className="border col-auto d-flex align-items-center gap-1">
          <small>
            <b>FREQUENCY</b>
          </small>
        </Col>
        <Col sm={2} className="border col-auto d-flex align-items-center gap-1">
          <small>
            <b>TARGET DATE</b>
          </small>
        </Col>
        <Col
          sm={1}
          className="border col-auto d-flex align-items-center gap-1 "
          // className="border col-auto d-flex align-items-center gap-1 p-1"
        >
          <small>
            <b>UPDATE</b>
          </small>
          {/* <AddBoxIcon onClick={() => setIsAdding(true)} /> */}
        </Col>
      </Row>

      {dataOfTheCM?.map((data, index) =>
        editedDataOfCM && editedDataOfCM?.id === index ? (
          <Row key={index} className="m-0 d-flex">
            {/* Render input fields for editing */}
            <Col sm={2} className="border">
              <select
                aria-label=".form-select-sm example"
                id="standard-select-currency"
                autoComplete="off"
                className="w-100 mb-2 mt-2"
                onChange={(e) =>
                  setEditedDataOfCM({
                    ...editedDataOfCM,
                    cmBasicDataFilledByMTD_TL: {
                      ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                      lineId: e.target.value,
                    },
                  })
                }
                variant="standard"
                value={editedDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId}
              >
                <option selected disabled value="">
                  Please select
                </option>
                {lineandMachineList?.lines?.map((option, idx) => {
                  return (
                    <option value={option?._id}>{option?.line_name}</option>
                  );
                })}
              </select>
            </Col>
            <Col sm={2} className="border">
              <select
                aria-label=".form-select-sm example"
                id="standard-select-currency"
                autoComplete="off"
                className="w-100 mb-2 mt-2"
                onChange={(e) =>
                  setEditedDataOfCM({
                    ...editedDataOfCM,
                    cmBasicDataFilledByMTD_TL: {
                      ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                      machineId: e.target.value,
                    },
                  })
                }
                value={editedDataOfCM?.cmBasicDataFilledByMTD_TL?.machineId}
                variant="standard"
              >
                <option selected disabled value="">
                  Please select
                </option>
                {lineandMachineList?.machines?.map((option, idx) => {
                  return (
                    <option value={option?._id}>{option?.machine_name}</option>
                  );
                })}
              </select>
            </Col>
            <Col sm={2} className="border">
              <input
                type="text"
                className="mb-2 mt-2"
                value={editedDataOfCM?.cmBasicDataFilledByMTD_TL?.activityOfCM}
                onChange={(e) =>
                  setEditedDataOfCM({
                    ...editedDataOfCM,
                    cmBasicDataFilledByMTD_TL: {
                      ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                      activityOfCM: e.target.value,
                    },
                  })
                }
              />
            </Col>
            <Col sm={2} className="border">
              {CATEGORIES_OF_CM.map((value, idx) => (
                <React.Fragment key={idx}>
                  <Form.Check
                    // flex
                    idx={idx}
                    label={value}
                    type="radio"
                    value={value}
                    name={`categories`}
                    checked={
                      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.categories ===
                      value
                    }
                    onChange={(e) =>
                      setEditedDataOfCM({
                        ...editedDataOfCM,
                        cmBasicDataFilledByMTD_TL: {
                          ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                          categories: e.target.value,
                          inspectionItem: "",
                          actionForLTPM: "",
                          other_categories: "",
                        },
                      })
                    }
                  />
                </React.Fragment>
              ))}
              {editedDataOfCM?.cmBasicDataFilledByMTD_TL?.categories ===
                "LTPM" && (
                <>
                  <input
                    type="text"
                    className="mb-2 mt-2"
                    placeholder="Inspection Item"
                    value={
                      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.inspectionItem
                    }
                    onChange={(e) =>
                      setEditedDataOfCM({
                        ...editedDataOfCM,
                        cmBasicDataFilledByMTD_TL: {
                          ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                          inspectionItem: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    className="mb-2 mt-2"
                    placeholder="Action"
                    value={
                      editedDataOfCM?.cmBasicDataFilledByMTD_TL?.actionForLTPM
                    }
                    onChange={(e) =>
                      setEditedDataOfCM({
                        ...editedDataOfCM,
                        cmBasicDataFilledByMTD_TL: {
                          ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                          actionForLTPM: e.target.value,
                        },
                      })
                    }
                  />
                </>
              )}
              {editedDataOfCM?.cmBasicDataFilledByMTD_TL?.categories ===
                "Others" && (
                <input
                  type="text"
                  className="mb-2 mt-2"
                  placeholder="Other Category"
                  value={
                    editedDataOfCM?.cmBasicDataFilledByMTD_TL?.other_categories
                  }
                  onChange={(e) =>
                    setEditedDataOfCM({
                      ...editedDataOfCM,
                      cmBasicDataFilledByMTD_TL: {
                        ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                        other_categories: e.target.value,
                      },
                    })
                  }
                />
              )}
            </Col>
            <Col sm={1} className="border">
              {FREQUENCY_OF_CM?.map((value, idx) => (
                <div key={idx}>
                  <Col>
                    <input
                      type="radio"
                      id={`frequencyType_${idx}`}
                      name="frequencyType"
                      className="m-1 mb-2"
                      value={value?.frequencyType}
                      checked={
                        editedDataOfCM?.cmBasicDataFilledByMTD_TL
                          ?.frequencyType === value?.frequencyType
                      }
                      onChange={(e) =>
                        setEditedDataOfCM({
                          ...editedDataOfCM,
                          cmBasicDataFilledByMTD_TL: {
                            ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                            frequencyType: e.target.value,
                            frequencyValue: "",
                          },
                        })
                      }
                    />
                    <label htmlFor={`frequencyType_${idx}`}>
                      {value?.frequencyType}
                    </label>
                  </Col>

                  {editedDataOfCM?.cmBasicDataFilledByMTD_TL?.frequencyType ===
                    value?.frequencyType &&
                    value?.frequencyType === "Scheduled" && (
                      <Col className="justify-content-center align-items-center">
                        {value?.frequencyValue?.length > 0 &&
                          value?.frequencyValue?.map((type, idx1) => (
                            <>
                              <Col key={idx1}>
                                <input
                                  type="radio"
                                  id={`frequencyValue_${idx1}`}
                                  name="frequencyValue"
                                  className="m-1 mb-2"
                                  value={type}
                                  checked={
                                    editedDataOfCM?.cmBasicDataFilledByMTD_TL
                                      ?.frequencyValue === type
                                  }
                                  onChange={(e) =>
                                    setEditedDataOfCM({
                                      ...editedDataOfCM,
                                      cmBasicDataFilledByMTD_TL: {
                                        ...editedDataOfCM?.cmBasicDataFilledByMTD_TL,
                                        frequencyValue: e.target.value,
                                      },
                                    })
                                  }
                                />
                                <label htmlFor={`frequencyValue_${idx1}`}>
                                  {type}
                                </label>
                              </Col>
                            </>
                          ))}
                      </Col>
                    )}
                </div>
              ))}
            </Col>
            <Col sm={2} className="border">
              <input
                type="datetime-local"
                id="targetDateOfCM"
                className="mt-2 mb-2 w-100"
                name="targetDateOfCM"
                value={editedDataOfCM?.targetDateOfCM}
                onChange={(e) =>
                  setEditedDataOfCM({
                    ...editedDataOfCM,
                    targetDateOfCM: e.target.value,
                  })
                }
              />
            </Col>
            <Col sm={1} className="border d-block align-items-center gap-1 p-1">
              <button class="bg-info text-white border-0" onClick={updateData}>
                Update
              </button>
              <br />
              <button
                class="bg-danger text-white border-0"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </Col>
          </Row>
        ) : (
          <Row key={index} className="m-0">
            {/* Render part information */}
            <Col sm={2} className="border">
              {data?.cmBasicDataFilledByMTD_TL?.line}
            </Col>
            <Col sm={2} className="border">
              {data?.cmBasicDataFilledByMTD_TL?.machineName}
            </Col>
            <Col sm={2} className="border">
              {data?.cmBasicDataFilledByMTD_TL?.activityOfCM}
            </Col>
            <Col sm={2} className="border">
              {data?.cmBasicDataFilledByMTD_TL?.categories}
              {data?.cmBasicDataFilledByMTD_TL?.categories === "LTPM" && (
                <>
                  <div>
                    <b>Inspection Item: </b>
                    {data?.cmBasicDataFilledByMTD_TL?.inspectionItem}
                  </div>
                  <div>
                    <b>Action: </b>
                    {data?.cmBasicDataFilledByMTD_TL?.actionForLTPM}
                  </div>
                </>
              )}
              {data?.cmBasicDataFilledByMTD_TL?.categories === "Others" && (
                <div>{data?.cmBasicDataFilledByMTD_TL?.other_categories}</div>
              )}
            </Col>
            <Col sm={1} className="border">
              {data?.cmBasicDataFilledByMTD_TL?.frequencyType}
              <br />
              {data?.cmBasicDataFilledByMTD_TL?.frequencyValue}
            </Col>
            <Col sm={2} className="border">
              {data?.targetDateOfCM}
            </Col>
            <Col sm={1} className="d-flex border col-auto gap-1 p-1 flex-wrap">
              {!data?._id && (
                <>
                  <button
                    class="bg-warning text-white border-0"
                    style={{
                      display: isEditable ? "block" : "none",
                    }}
                    onClick={(event) => {
                      editData(event, {
                        ...data,
                        id: index,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    class="bg-danger text-white border-0"
                    style={{
                      display: isEditable ? "block" : "none",
                    }}
                    onClick={(event) => {
                      deleteData(event, index);
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </Col>
          </Row>
        )
      )}

      {isAdding ? (
        <Row className="m-0">
          <Col sm={2} className="border">
            <select
              aria-label=".form-select-sm example"
              id="standard-select-currency"
              autoComplete="off"
              className="w-100 mb-2 mt-2"
              onChange={(e) =>
                setNewDataOfCM({
                  ...newDataOfCM,
                  cmBasicDataFilledByMTD_TL: {
                    ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                    lineId: e.target.value,
                  },
                })
              }
              variant="standard"
              value={newDataOfCM?.cmBasicDataFilledByMTD_TL?.lineId}
            >
              <option selected disabled value="">
                Please select
              </option>
              {lineandMachineList?.lines?.map((option, idx) => {
                return <option value={option?._id}>{option?.line_name}</option>;
              })}
            </select>
          </Col>
          <Col sm={2} className="border">
            <select
              aria-label=".form-select-sm example"
              id="standard-select-currency"
              autoComplete="off"
              className="w-100 mb-2 mt-2"
              onChange={(e) =>
                setNewDataOfCM({
                  ...newDataOfCM,
                  cmBasicDataFilledByMTD_TL: {
                    ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                    machineId: e.target.value,
                  },
                })
              }
              value={newDataOfCM?.cmBasicDataFilledByMTD_TL?.machineId}
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {lineandMachineList?.machines?.map((option, idx) => {
                return (
                  <option value={option?._id}>{option?.machine_name}</option>
                );
              })}
            </select>
          </Col>
          <Col sm={2} className="border">
            <input
              type="text"
              className="mb-2 mt-2"
              placeholder="Activity"
              value={newDataOfCM?.cmBasicDataFilledByMTD_TL?.activityOfCM}
              onChange={(e) =>
                setNewDataOfCM({
                  ...newDataOfCM,
                  cmBasicDataFilledByMTD_TL: {
                    ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                    activityOfCM: e.target.value,
                  },
                })
              }
            />
          </Col>
          <Col sm={2} className="border">
            {CATEGORIES_OF_CM.map((value, idx) => (
              <React.Fragment key={idx}>
                <Form.Check
                  // flex
                  idx={idx}
                  label={value}
                  type="radio"
                  value={value}
                  name={`categories`}
                  onChange={(e) =>
                    setNewDataOfCM({
                      ...newDataOfCM,
                      cmBasicDataFilledByMTD_TL: {
                        ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                        categories: e.target.value,
                      },
                    })
                  }
                />
              </React.Fragment>
            ))}
            {newDataOfCM?.cmBasicDataFilledByMTD_TL?.categories === "LTPM" && (
              <>
                <input
                  type="text"
                  className="mb-2 mt-2"
                  placeholder="Inspection Item"
                  value={newDataOfCM?.cmBasicDataFilledByMTD_TL?.inspectionItem}
                  onChange={(e) =>
                    setNewDataOfCM({
                      ...newDataOfCM,
                      cmBasicDataFilledByMTD_TL: {
                        ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                        inspectionItem: e.target.value,
                      },
                    })
                  }
                />
                <input
                  type="text"
                  className="mb-2 mt-2"
                  placeholder="Action"
                  value={newDataOfCM.actionForLTPM}
                  onChange={(e) =>
                    setNewDataOfCM({
                      ...newDataOfCM,
                      cmBasicDataFilledByMTD_TL: {
                        ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                        actionForLTPM: e.target.value,
                      },
                    })
                  }
                />
              </>
            )}
            {newDataOfCM?.cmBasicDataFilledByMTD_TL?.categories ===
              "Others" && (
              <input
                type="text"
                className="mb-2 mt-2"
                placeholder="Other Category"
                value={newDataOfCM?.cmBasicDataFilledByMTD_TL?.other_categories}
                onChange={(e) =>
                  setNewDataOfCM({
                    ...newDataOfCM,
                    cmBasicDataFilledByMTD_TL: {
                      ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                      other_categories: e.target.value,
                    },
                  })
                }
              />
            )}
          </Col>
          <Col sm={1} className="border">
            {FREQUENCY_OF_CM?.map((value, idx) => (
              <div key={idx}>
                <Col>
                  <input
                    type="radio"
                    id={`frequencyType_${idx}`}
                    name="frequencyType"
                    className="m-1 mb-2"
                    value={value?.frequencyType}
                    onChange={(e) =>
                      setNewDataOfCM({
                        ...newDataOfCM,
                        cmBasicDataFilledByMTD_TL: {
                          ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                          frequencyType: e.target.value,
                        },
                      })
                    }
                  />
                  <label htmlFor={`frequencyType_${idx}`}>
                    {value?.frequencyType}
                  </label>
                </Col>

                {newDataOfCM?.cmBasicDataFilledByMTD_TL?.frequencyType ===
                  value?.frequencyType &&
                  value?.frequencyType === "Scheduled" && (
                    <Col className="justify-content-center align-items-center">
                      {value?.frequencyValue?.length > 0 &&
                        value?.frequencyValue?.map((type, idx1) => (
                          <>
                            <Col key={idx1}>
                              <input
                                type="radio"
                                id={`frequencyValue_${idx1}`}
                                name="frequencyValue"
                                className="m-1 mb-2"
                                value={type}
                                onChange={(e) =>
                                  setNewDataOfCM({
                                    ...newDataOfCM,
                                    cmBasicDataFilledByMTD_TL: {
                                      ...newDataOfCM?.cmBasicDataFilledByMTD_TL,
                                      frequencyValue: e.target.value,
                                    },
                                  })
                                }
                              />
                              <label htmlFor={`frequencyValue_${idx1}`}>
                                {type}
                              </label>
                            </Col>
                          </>
                        ))}
                    </Col>
                  )}
              </div>
            ))}
          </Col>
          <Col sm={2} className="border">
            <input
              type="datetime-local"
              id="targetDateOfCM"
              className="mt-2 mb-2 w-100"
              name="targetDateOfCM"
              onChange={(e) =>
                setNewDataOfCM({
                  ...newDataOfCM,
                  targetDateOfCM: e.target.value,
                })
              }
            />
          </Col>
          <Col sm={1} className="border d-block align-items-center gap-1 p-1">
            <button class="bg-success text-white border-0" onClick={addData}>
              Add
            </button>
            <br />
            <button class="bg-danger text-white border-0" onClick={cancelEdit}>
              Cancel
            </button>
          </Col>
        </Row>
      ) : (
        <Row className="m-0  p-1 border">
          <Col lg={4}>
            <button
              class="bg-warning text-white border-0"
              onClick={() => setIsAdding(true)}
            >
              Add CM Data
            </button>
          </Col>
        </Row>
      )}

      {Array.from({ length: 2 - dataOfTheCM?.length }).map((_, index) => (
        <Row key={index} className="m-0 p-1 border">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Row>
      ))}
    </div>
  );
};

export default BMReflectionYokotenkai;
