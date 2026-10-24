// 统一图表配置工具，减少各页面重复的 tooltip/grid/color 等配置

export const CHART_COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#13c2c2', '#722ed1', '#909399', '#52c41a']

export const ALERT_COLORS = ['#f56c6c', '#e6a23c', '#faad14', '#722ed1', '#13c2c2', '#409eff', '#909399', '#52c41a']

// 通用坐标轴网格配置
export function axisGrid(overrides = {}) {
  return {
    left: 50,
    right: 20,
    top: 20,
    bottom: 30,
    ...overrides
  }
}

// 通用柱状图基础配置
export function barOption({ xData, series, color = '#409eff', horizontal = false, label = true } = {}) {
  const isHorizontal = horizontal
  return {
    tooltip: { trigger: 'axis' },
    grid: axisGrid(isHorizontal ? { left: 80, right: 30 } : {}),
    xAxis: isHorizontal
      ? { type: 'value' }
      : { type: 'category', data: xData, axisLabel: { fontSize: 11, rotate: xData.length > 6 ? 15 : 0 } },
    yAxis: isHorizontal
      ? { type: 'category', data: xData, axisLabel: { fontSize: 11 } }
      : { type: 'value' },
    series: [{
      type: 'bar',
      data: series,
      itemStyle: { color, borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
      barWidth: '50%',
      label: label ? { show: true, position: isHorizontal ? 'right' : 'top', fontSize: 10 } : undefined
    }]
  }
}

// 通用饼图基础配置
export function pieOption({ data, radius = ['40%', '70%'], colors = CHART_COLORS, roseType = false } = {}) {
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius,
      roseType,
      center: ['50%', roseType ? '42%' : '50%'],
      data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
      label: { fontSize: 10, formatter: roseType ? '{b}' : '{b}: {c} ({d}%)' }
    }]
  }
}

// 通用折线图基础配置
export function lineOption({ xData, series, color = '#409eff', smooth = true, area = false } = {}) {
  return {
    tooltip: { trigger: 'axis' },
    grid: axisGrid(),
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value' },
    series: Array.isArray(series[0])
      ? series.map((s, i) => ({
          name: s.name, type: 'line', smooth, data: s.data,
          itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
          areaStyle: area ? { opacity: 0.15 } : undefined
        }))
      : [{
          name: series.name, type: 'line', smooth, data: series.data,
          itemStyle: { color },
          areaStyle: area ? { opacity: 0.15 } : undefined
        }]
  }
}
