import React, {
  Component
} from "react";
import EastIcon from "@mui/icons-material/East";

class TableColumn extends Component {
  render() {
    const monthKeyArray = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
    return this.props.checkSheet_status === "Implementation" && this.props.user_type === "Operator" ? (
      this.props.colData.print == true ?
        (<td className={this.props.colData.value === "" ?
          "ar-table-col2" : this.props.colData.key === "inspection_parent_name" ||
            this.props.colData.key === "inspection_child_name" ||
            this.props.colData.key === "inspection_point" ||
            this.props.colData.key === "judgement_criteria" ||
            this.props.colData.key === "action" ?
            "table_text_alignment" : "ar-table-col"
        }
          rowSpan={
            this.props.colData.rowspan
          }
          colSpan={
            this.props.colData.colspan
          } >
          {
            " "
          } {
            this.props.colData.value[0] === "0" && (this.props.colData.key !== "cycle" && this.props.colData.key !== "PM_time" && this.props.colData.key !== "inspection_parent_name" && this.props.colData.key !== "inspection_point" && this.props.colData.key !== "judgement_criteria" && this.props.colData.key !== "action") ? (
              ""
            ) : (this.props.colData.value[0] === "1" || this.props.colData.value[0] === "2") && (this.props.colData.key !== "cycle" && this.props.colData.key !== "PM_time" && this.props.colData.key !== "inspection_parent_name" && this.props.colData.key !== "inspection_point" && this.props.colData.key !== "judgement_criteria" && this.props.colData.key !== "action") ? (
              this.props.colData.key === monthForCompareSystemMonth ? (<>
                {
                  " "
                }
                            --> < br /> {
                  " "
                } </>
              ) : (
                "-->"
              )
            ) : (this.props.colData.value)
          } </td>
        ) : (
          ""
        )
    ) : this.props.colData.print == true ? (
      <td
        className={
          this.props.colData.value === ""
            ? "ar-table-col2"
            : this.props.colData.key === "inspection_parent_name" ||
              this.props.colData.key === "inspection_child_name" ||
              this.props.colData.key === "inspection_point" ||
              this.props.colData.key === "judgement_criteria" ||
              this.props.colData.key === "action"
              ? "table_text_alignment"
              : this.props.colData.value.length === 2 &&
                this.props.colData.value[0] === "1" &&
                this.props.colData.value[1] === "dummy"
                ? "table-col-bg-ongoing"
                : this.props.colData.value.length === 2 &&
                  this.props.colData.value[0] === "1" &&
                  this.props.colData.value[1] === "delay"
                  ? "table-col-bg-delay"
                  : this.props.colData.value.length === 2 &&
                    this.props.colData.value[0] === "1" &&
                    this.props.colData.value[1] === "skip"
                    ? "table-col-bg-skip"
                    : "ar-table-col"
          //ar-table-col
        }
        rowSpan={this.props.colData.rowspan}
        colSpan={this.props.colData.colspan}
      >
        {" "}
        {this.props.colData.value[0] === "0" &&
          this.props.colData.key !== "tableRowId" &&
          this.props.colData.key !== "cycle" &&
          this.props.colData.key !== "PM_time" && 
          this.props.colData.key !== "inspection_parent_name" && 
          this.props.colData.key !== "inspection_point" && 
          this.props.colData.key !== "judgement_criteria" && 
          this.props.colData.key !== "action" ? (
          ""
        ) : (this.props.colData.value[0] === "1" ||
          this.props.colData.value[0] === "2") &&
          this.props.colData.key !== "tableRowId" &&
          this.props.colData.key !== "cycle" &&
          this.props.colData.key !== "PM_time"&& 
          this.props.colData.key !== "inspection_parent_name" && 
          this.props.colData.key !== "inspection_point" && 
          this.props.colData.key !== "judgement_criteria" && 
          this.props.colData.key !== "action"  ? (
          this.props.colData.value.length === 1 &&
            this.props.colData.key === monthForCompareSystemMonth ? (
            <>
              {" "}
              <div style={{ fontWeight: "900" }}>--></div>
              <br />{" "}
            </>
          ) : this.props.colData.value.length === 1 &&
            this.props.colData.value[0] === "1" ? (
            <p style={{ fontWeight: "900" }}>--></p>
          ) : this.props.colData.value[0] === "1" &&
            (this.props.colData.value[1] === "Yes" ||
              this.props.colData.value[1] === "Rectify") ? (
            <>
              <div style={{ fontWeight: "900" }}>
              -->
                <br />
                <EastIcon fontSize="small" />
                <br />
              </div>
              {this.props.colData.value[2] ? (
                <p className="remarksText">
                  {this.props.colData.value[2]}
                </p>
              ) : (
                ""
              )}
            </>
          ) : this.props.colData.value[0] === "2" &&
            (this.props.colData.value[1] === "Yes" ||
              this.props.colData.value[1] === "Rectify") ? (
            <>
              <div style={{ fontWeight: "900" }}>
                <EastIcon fontSize="small" />
                <br />
              </div>
              {this.props.colData.value[2] ? (
                <p className="remarksText">
                  {this.props.colData.value[2]}
                </p>
              ) : (
                ""
              )}
            </>
          ) : this.props.colData.value.length === 2 &&
            this.props.colData.value[0] === "1" &&
            (this.props.colData.value[1] === "dummy" ||
              this.props.colData.value[1] === "delay") ? (
            <p
              className="d-flex justify-content-center align-items-center"
              style={{ fontWeight: "900" }}
            >
              {" "}
            -->
            </p>
          ) : this.props.colData.value.length === 2 &&
            this.props.colData.value[0] === "1" &&
            this.props.colData.value[1] === "skip" ? (
            <p
              className="d-flex justify-content-center align-items-center"
              style={{ fontWeight: "900" }}
            >
              {" "}
            -->
            </p>
          ) : this.props.colData.value.length === 1 &&
            this.props.colData.value[0] === "2" ? (
            <p
              className="d-flex justify-content-center align-items-center"
              style={{ fontWeight: "900" }}
            >
              {" "}
            -->
            </p>
          ) : this.props.colData.value.length === 2 &&
            this.props.colData.value[0] === "2" &&
            this.props.colData.value[1] === "skip_previous" ? (
            <p
              className="d-flex justify-content-center align-items-center"
              style={{ fontWeight: "900" }}
            >
              {" "}
            -->
            </p>
          ) : (
            <>
              <div style={{ fontWeight: "900" }}>
              --> *
                <br />
              </div>
              {this.props.colData.value[2] ? (
                <p className="remarksText">
                  {this.props.colData.value[2]}
                </p>
              ) : (
                ""
              )}
              {this.props.colData.value[3] ? (
                <p className="remarksText">
                  &#x2B24; &nbsp;
                  {this.props.colData.value[3]}
                </p>
              ) : (
                ""
              )}
            </>
          )
        ) : (
          this.props.colData.value
        )}{" "}

      </td>
    ) : (
      ""
    );
  }
}

export default TableColumn;