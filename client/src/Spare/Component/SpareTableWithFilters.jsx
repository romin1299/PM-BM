import { memo, useCallback, useMemo } from "react";
import { Row } from "react-bootstrap";

import SpareSheetTable from "../Component/SpareSheetTable";
import WithFilters from "./Common/WithFilters";

const SpareTableWithFilters = memo(
  ({
    title = "Spare Requests",
    OtherCompo = () => <></>,
    url = "/v1/spare/spareRequestSheet/approval",
    tableProps = {
      exportMenu: {
        exportFileNamePrefix: "Approval List of Request-Sheet",
      },
    },
  }) => {
    const memoTableProps = useMemo(() => tableProps, [tableProps]);

    const renderContent = useCallback(
      (reduceState) => (
        <>
          <Row className="gap-2 g-0">
            <OtherCompo {...reduceState} />
          </Row>
          <Row className="g-0">
            <SpareSheetTable
              {...reduceState}
              url={url}
              tableProps={memoTableProps}
            />
          </Row>
        </>
      ),
      [url, memoTableProps],
    );

    return <WithFilters title={title} PropComp={renderContent} />;
  },
);

export default SpareTableWithFilters;
