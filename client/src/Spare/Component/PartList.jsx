import React from "react";
import { Col, Row, Form } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import {
  newPartRequestForRadioOptions,
  partQtyOptions,
  partTypes,
} from "../Utils/dropdownUtils";

const initialState = {};

const PartList = ({
  register,
  control,
  watch,
  sectionBudget,
  budgetStatus,
  requiredBudget,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "changeParts",
  });

  return (
    <div className="mtd-parts-section">
      <div className="d-flex align-items-center flex-wrap">
        {fields.map((item, index) => (
          <div key={item.id} className="m-0 p-0 w-50">
            <Row key={item.id} className="m-0 p-1 d-flex flex-column">
              <Col className="d-flex border col-auto gap-1 m-2 mt-0 mb-0 p-2 flex-wrap align-items-center justify-content-between">
                <small>
                  <b>Part Details {index + 1}</b>
                </small>
                <button
                  className="bg-danger text-white border-0"
                  onClick={() => remove(index)}
                >
                  Delete
                </button>
              </Col>

              <Col className="d-flex flex-column border col-auto m-2 mt-0 mb-1 p-2 pt-0 pb-0 flex-wrap align-items-center justify-content-between">
                <Col
                  className={`w-100 m-0 d-flex align-items-center justify-content-between pt-1`}
                >
                  <small>Part name</small>
                  <input
                    type="text"
                    className="w-75"
                    {...register(`changeParts.${index}.partName`)}
                  />
                </Col>
                <Col
                  className={`w-100 m-0 d-flex align-items-center justify-content-between `}
                >
                  <small>Part model</small>
                  <input
                    type="text"
                    className="w-75"
                    {...register(`changeParts.${index}.partModel`)}
                  />
                </Col>
                {watch("newPartFor") ===
                  newPartRequestForRadioOptions?.[1]?.value && (
                  <Col
                    className={`w-100 m-0 d-flex align-items-center justify-content-between `}
                  >
                    <small>Min quantity</small>
                    <input
                      type="number"
                      className="w-75"
                      {...register(`changeParts.${index}.minQuantity`)}
                    />
                  </Col>
                )}
                <Col
                  className={`w-100 m-0 d-flex align-items-center justify-content-between `}
                >
                  <small>
                    {watch("newPartFor") ===
                    newPartRequestForRadioOptions?.[0]?.value
                      ? "Quantity required"
                      : "Max quantity"}
                  </small>
                  <input
                    type="number"
                    className="w-75"
                    {...register(`changeParts.${index}.quantityRequired`)}
                  />
                </Col>

                <Col
                  className={`w-100 m-0 d-flex align-items-center justify-content-between `}
                >
                  <small>Manufacture</small>
                  <input
                    type="text"
                    className="w-75"
                    {...register(`changeParts.${index}.manufacture`)}
                  />
                </Col>

                <Col
                  className={`w-100 m-0 d-flex align-items-center justify-content-between `}
                >
                  <small>Supplier</small>
                  <input
                    type="text"
                    className="w-75"
                    {...register(`changeParts.${index}.supplier`)}
                  />
                </Col>
                <Col
                  className={`w-100 m-0 d-flex align-items-center justify-content-between `}
                >
                  <small>Approx unit price(Inr)</small>
                  <input
                    type="number"
                    className="w-75"
                    {...register(`changeParts.${index}.approxUnitPrice`)}
                  />
                </Col>
                <Col
                  className={`w-100 m-0 d-flex align-items-center justify-content-between `}
                >
                  <small>Stander/Manufacturing part</small>
                  {partTypes?.map((item) => (
                    <Form.Check
                      key={item?.value}
                      style={{ fontSize: "14px" }}
                      type="radio"
                      className="m-1"
                      {...item}
                      {...register(
                        `changeParts.${index}.standerOrManufacturingPart`
                      )}
                    />
                  ))}
                </Col>

                {watch(`changeParts.${index}.standerOrManufacturingPart`) ===
                  partTypes?.[1]?.value && (
                  <>
                    <Col
                      className={`w-100 m-0 d-flex align-items-center justify-content-between pb-1`}
                    >
                      <small>Drawing attach</small>
                      <input
                        type="file"
                        className="w-75 "
                        style={{ fontSize: "13px" }}
                        {...register(`changeParts.${index}.drawingAttach`)}
                      />
                    </Col>

                    {watch(
                      `changeParts.${index}.drawingAttachOriginalName`
                    ) && (
                      <Col
                        className={`w-100 m-0 d-flex align-items-center justify-content-between pb-1`}
                      >
                        <small>Previously uploaded drawing attach</small>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`${
                            process.env.REACT_APP_BASE_URL
                          }/v1/spare/${watch(
                            `changeParts.${index}.drawingAttach`
                          )}`}
                        >
                          {watch(
                            `changeParts.${index}.drawingAttachOriginalName`
                          )}
                        </a>
                      </Col>
                    )}
                  </>
                )}
              </Col>
            </Row>
          </div>
        ))}
      </div>

      <Row className="m-2 p-1 border">
        {((watch("partQty") === partQtyOptions?.[0]?.value &&
          watch("changeParts")?.length <= 0) ||
          watch("partQty") === partQtyOptions?.[1]?.value) && (
          <Col className="col-auto">
            <button
              className="bg-warning text-white border-0"
              type="button"
              onClick={() => append(initialState)}
            >
              Add Part
            </button>
          </Col>
        )}
        <Col className="col-auto">
          <small>Section-wise budget:</small>
          &nbsp; {sectionBudget}
        </Col>
        <Col className="col-auto">
          <small>Required budget:</small>
          &nbsp;
          {requiredBudget}
        </Col>
        <Col className="col-auto">
          <small>Budget:</small>
          &nbsp;
          {budgetStatus}
        </Col>
      </Row>
    </div>
  );
};

export default PartList;
