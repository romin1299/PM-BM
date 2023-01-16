import React from 'react';
import TableColumn from './col';
import { useContext } from "../../../modules/PageModules";
import RoutingContext from "../../../context/routing/RoutingContext";


const Row = ({ rData, checkSheet_status, rIndex, isDeletedExists }) => {
    const context = useContext(RoutingContext);
    // console.log(rData)


    return (
        <tr className={isDeletedExists === true ? 'ar-table-row table-col-mid-year-delete' : 'ar-table-row'} > {
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