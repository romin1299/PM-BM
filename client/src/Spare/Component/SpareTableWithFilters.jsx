import React from "react";
import { Row } from "react-bootstrap";

import SpareSheetTable from "../Component/SpareSheetTable";
import WithFilters from "./Common/WithFilters";

const SpareTableWithFilters = ({
  OtherCompo = () => <></>,
  url = "/v1/spare/spareRequestSheet/approval",
  tableProps = {
    exportMenu: {
      exportFileNamePrefix: "Approval List of Request-Sheet",
    },
  },
}) => {
  return (
    <WithFilters
      title="Approval Dashboard"
      PropComp={(reduceState) => (
        <>
          <Row className="gap-2 g-0">
            <OtherCompo {...reduceState} />
          </Row>
          <Row className="g-0">
            <SpareSheetTable
              {...reduceState}
              url={url}
              tableProps={tableProps}
            />
          </Row>
        </>
      )}
    />
  );
};

export default SpareTableWithFilters;
