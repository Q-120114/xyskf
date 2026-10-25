/**
 * CSV 导出工具
 * 将二维数据生成 UTF-8 带 BOM 的 CSV 文件并触发浏览器下载。
 * BOM 头用于保证 Excel 直接打开时中文不乱码。
 */

/** 单元格转义：含逗号、引号、换行的字段用双引号包裹，内部引号转为两个引号 */
function escapeCell(value) {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * 导出 CSV 文件
 * @param {string} filename - 下载文件名（可省略 .csv 后缀）
 * @param {string[]} headers - 表头行
 * @param {Array<Array>} rows - 数据行（与表头列数一致）
 */
export function exportCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map(row => row.map(escapeCell).join(','))
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
