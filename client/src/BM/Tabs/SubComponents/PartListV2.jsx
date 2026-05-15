import React from "react";
import { Col, Row } from "react-bootstrap";

const PartListV2 = ({ fields, register }) => {
  console.log(fields);

  return (
    <div className="mtd-parts-section">
      <Row className="m-0 d-flex">
        <Col
          lg={2}
          md={2}
          sm={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>PART NO.</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          sm={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>PART NAME</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          sm={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>MAKER</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          sm={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>QUANTITY</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          sm={2}
          className="border col-auto d-flex align-items-center gap-1"
        >
          <small>
            <b>COST</b>
          </small>
        </Col>
        <Col
          lg={2}
          md={2}
          sm={2}
          className="border col-auto d-flex align-items-center gap-1 "
        >
          <small>
            <b>UPDATE</b>
          </small>
        </Col>
      </Row>

      {fields?.map((item, index) => (
        <Row className="m-0 d-flex">
          <Col
            lg={2}
            md={2}
            sm={2}
            className={`border col-auto d-flex align-items-center gap-1 `}
          >
            <input
              type="text"
              className="mb-2 mt-2"
              {...register(`changeParts.${index}.partNo`)}
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="text"
              className="mb-2 mt-2"
              {...register(`changeParts.${index}.partName`)}
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="text"
              className="mb-2 mt-2"
              {...register(`changeParts.${index}.makerName`)}
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="number"
              className="mb-2 mt-2"
              {...register(`changeParts.${index}.quantity`)}
            />
          </Col>
          <Col lg={2} md={2} sm={2} className="border">
            <input
              type="number"
              className="mb-2 mt-2"
              {...register(`changeParts.${index}.cost`)}
            />
          </Col>
          <Col
            lg={2}
            md={2}
            sm={2}
            className="border d-block align-items-center gap-1 p-1"
          >
            <button class="bg-danger text-white border-0" onClick={() => {}}>
              Cancel
            </button>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export default PartListV2;
