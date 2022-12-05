import React from 'react';
import TableColumn from './col';
import { useContext } from "../../../modules/PageModules";
import RoutingContext from "../../../context/routing/RoutingContext";


const Row = ({ rData, checkSheet_status, rIndex }) => {
    const context = useContext(RoutingContext);
    // console.log(rIndex)


    return (
        <tr className='ar-table-row' > {
            rData.map((colData) =>
                <

                    TableColumn colData={colData}
                    checkSheet_status={checkSheet_status}
                    user_type={context.user_type}
                    rIndex={rIndex}
                />
            )
        } </tr>
    );
}

export default Row;