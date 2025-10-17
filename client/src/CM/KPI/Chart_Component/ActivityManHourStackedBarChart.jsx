import React from 'react'
import BarChartCommon from './BarChartCommon'

const ActivityManHourStackedBarChart = () => {
  return (
    <>
      <BarChartCommon
        stacked={false}
        xTitleText={"Months"}
        yTitleText={"Nos"}
        title="Activity Manhour Summary"
      />
    </>
  )
}

export default ActivityManHourStackedBarChart