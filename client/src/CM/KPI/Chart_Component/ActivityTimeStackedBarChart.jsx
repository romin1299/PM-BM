import React from 'react'
import BarChartCommon from './BarChartCommon'

const ActivityTimeStackedBarChart = () => {
  return (
    <>
    <BarChartCommon
      stacked={false}
      xTitleText={"Months"}
      yTitleText={"Nos"}
      title="Activity Time"
    />
  </>
  )
}

export default ActivityTimeStackedBarChart