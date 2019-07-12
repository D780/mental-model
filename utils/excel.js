/**
 * 新加的excel导出 基于 exceljs 简单封装 支持大数据处理
 */
/* eslint-disable*/

'use strict';

const Promise = require('bluebird');
const path    = require('path');
const _       = require('lodash');
const moment  = require('moment');
const fs      = require('fs-extra');
const uuid    = require('uuid');
const Excel   = require('exceljs');

// 项目设置了 global.Promise= require('bluebird'), exclejs 使用的 promise 是 promish, 在这种情况下会冲突
// （ bluebird检查报错 the promise constructor cannot be invoked directly）
// 这里使用 exceljs 自带的 setConfigValue 可以把 promish 替换成 bluebird 这样才能正常使用
const setConfigValue = require('exceljs/dist/es5/config/set-value');
setConfigValue('promise', require('bluebird'), true);


exports.generateTable = generateTable;

const colMap = {
  1 : 'A',
  2 : 'B',
  3 : 'C',
  4 : 'D',
  5 : 'E',
  6 : 'F',
  7 : 'G',
  8 : 'H',
  9 : 'I',
  10: 'J',
  11: 'K',
  12: 'L',
  13: 'M',
  14: 'N',
  15: 'O',
  16: 'P',
  17: 'Q',
  18: 'R',
  19: 'S',
  20: 'T',
  21: 'U',
  22: 'V',
  23: 'W',
  24: 'X',
  25: 'Y',
  26: 'Z',
  27: 'AA',
  28: 'AB',
  29: 'AC',
  30: 'AD',
  31: 'AE',
  32: 'AF',
  33: 'AG',
  34: 'AH',
  35: 'AI',
  36: 'AJ',
  37: 'AK',
  38: 'AL',
  39: 'AM',
  40: 'AN',
  41: 'AO',
  42: 'AP',
  43: 'AQ',
  44: 'AR',
  45: 'AS',
  46: 'AT',
  47: 'AU',
  48: 'AV',
  49: 'AW',
  50: 'AX',
  51: 'AY',
  52: 'AZ',
};

/**
 * 通用excel表格生成
 * 暂每行元素项最多支持26项
 * 本文件底部有完整的使用样例
 * @param {Array}   tmpPath - 生成的临时文件存放目录
 * @param {Array}   sheets  - sheets数据 sheets = {sheet1: {rows:rows1,colsStyle:colsStyle1,headRowsStyle:headRowsStyle1,rowsStyle:rowsStyle1}} ;
 *                            rows1 为 表格数据;
 *                            colsStyle1,headRowsStyle1,rowsStyle1 可选, 为sheet1 的独立样式,
 *                  rows的数据格式说明如下
 *                  单列中使用null , 代表横向的合并单元格 如下面的 new Date(1965,1,7), null, null 合并单元格
 *                  元素项中使用了数组形式 , 代表纵向的合并[其他项]单元格 如下面的
 *                  会分别将 2, 'Jane Doe', new Date(1965,1,7), null, null | 'fsdfs' 与接下来的两行合并单元格
 *                  一个row里面仅可有一个数组形式的元素项 （若有多个则只取第一个）
 *                  [
 *                    [2, 'Jane Doe', new Date(1965,1,7), null, null,
 *                      [
 *                        // 这里面用了数组形式 , 将会提取出来进行处理
 *                        ['435','543','543'],
 *                        ['543','22','3'],
 *                        ['1','2','3']
 *                      ],
 *                      'fsdfs'
 *                    ]
 *                  ]
 *
 *                 如此这个数据导出结果是
 *                 -------------------------------------------------------------------------------------------
 *                      |            |                                 |  '435'  |  '543'  |  '543' |
 *                    2 | 'Jane Doe' | new Date(1965,1,7)     _    _   |  '543'  |  '22'   |  '543' |  fsdfs
 *                      |            |                                 |  '1'    |  '2'    |  '3'   |
 *                 -------------------------------------------------------------------------------------------
 *                ================
 *                colsStyle      -  对应列的样式 (主要是设置列宽等通用属性)
 *                headRowsStyle  -  头部行的样式（可以设置多行, 用于设置表头的样式）
 *                      如 [[cellStyle],rowStyle,[cellStyle]], 这样就设置了前三行的样式了
 *                      如果项是 cellStyle(数组)则设置每一个单元格的样式, 如果是 rowStyle(对象) 则设置整一行的样式
 *                rowsStyle   基本行的样式（用于设置表格内容每一行的样式, 可不设置使用默认样式）
 *                        从 headRowsStyle.length+1 行开始设置后面所有行的样式 ,
 *                        如果是数组则设置每一个单元格的样式, 如果是对象则设置整一行的样式
 *                ---
 *                colsStyle 列样式常用属性 width  hidden   outlineLevel 以及 `单元格样式` (见下面)
 *                                         列宽  是否隐藏   大纲级别
 *                          实际上没什么特别需要设置列宽就够用了
 *                ---
 *                cellStyle rowStyle 样式格式一致的, 这里统一称为 `单元格样式`吧
 *                          可以设置相应的 numFmt font alignment fill border 5种主要的样式
 *                                         格式   字体 对齐方式  填充 边框
 *                   > numFmt 值为字符串, 如 yyyy/m/d, 具体格式与 excel 的一致 (即单元格格式)
 *                   > font = {name,family,scheme,charset,color,size,underline,bold,italic,strike,outline}
 *                       常用的就 name family color size underline bold italic
 *                         name   字体名称
 *                         family 字体家族 1 - Serif, 2 - Sans Serif, 3 - Mono (没特别要求也不需要管这个参数)
 *                         color  颜色 { argb: 'FF00FF00' }
 *                         size   字号
 *                         underline 下划线 可以简单设置true|false, 如有需要 也可以设置 double 设置双下划线
 *                         bold   是否加粗
 *                         italic 是否倾斜
 *                   > alignment = {horizontal,vertical,wrapText,indent,readingOrder,textRotation}
 *                       horizontal 水平对齐方式 可选值 left center right fill justify centerContinuous distributed
 *                       vertical   垂直对齐方式 可选值 top middle bottom distributed justify
 *                       wrapText   是否启用自动换行
 *                       indent     缩进
 *                       readingOrder 阅读方向 可选值 rtl ltr
 *                       textRotation 文字旋转 可选值 0 to 90 -1 to -90 vertical
 *                   > fill 必要参数 type 有两个值 pattern(图案填充) gradient(渐变填充)
 *                       根据 type 的选择对应的格式有两种
 *                       {type='pattern', pattern, fgColor, bgColor}
 *                       {type='gradient', gradient, degree, center, stops}
 *                       没特别需要的话仅用 pattern 即可, 这里就不推荐用 gradient 了, 一般也不会去搞这些花样的, 也不做过多说明了
 *                       pattern 可选挺多的, 没什么特殊要求用 solid 即可
 *                       fgColor, bgColor 跟其他地方颜色一样 { argb: 'FF00FF00' }
 *                   > border = {top, left, bottom, right, diagonal}
 *                       5 个参数共有属性 style(边框样式) color(边框颜色)
 *                       style 可选 thin dotted dashDot hair dashDotDot slantDashDot
 *                                  mediumDashed mediumDashDotDot mediumDashDot medium double thick
 *                       diagonal 是对角线的意思, 它除了 style color 外, 还有 up down 两个属性(true|false), 表示对角线的样式
 *                                up 即从左下到右上的对角线 ╱ , down 为从左上到右下的对角线 ╲ (同时设置为true, 就像是给单元格打个×了)
 *                --------
 *                另外 colsStyle 上设置 `单元格样式` 有一个 bug
 *                如果设置如下
 *                [{width: '30', font: {bold: true}, fill: {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFCC99'}}},
 *                {width: '30'},
 *                {width: '30'},
 *                {width: '10'}]
 *                那么 width 为 '30' 的3行都会用同样的样式，经测试是由于 width 导致的，只要设置了样式的列的width跟下一列设置的width不一样即可(包括数据类型)
 *                width可以是数字可以是字符串
 *                所以这里可以这么处理
 *                [{width: '30', font: {bold: true}, fill: {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFCC99'}}},
 *                {width: 30},
 *                {width: '30'},
 *                {width: '10'}]
 *                或者索性就用不同的宽度
 *
 *
 */
async function generateTable(tmpPath, sheets) {
  // console.log(sheets)
  // colsStyle, headRowsStyle, rowsStyle
  // rows         = [
  //   [2, 'Jane Doe', new Date(1965, 1, 7), null, null,
  //    [
  //      // 这里面用了数组形式 , 将会提取出来进行处理
  //      ['435', '543', '543'],
  //      ['543', null, '3'],
  //      ['1', '2', null]
  //    ],
  //    'fsdfs']
  // ];
  const filepath = path.join(tmpPath, `${uuid.v4()  }.xlsx`);
  if (_.keys(sheets).length <= 0) {
    return Promise.reject('未找到 sheet');
  }

  fs.ensureFileSync(filepath);
  const workbook = new Excel.stream.xlsx.WorkbookWriter({
    filename        : filepath,
    useStyles       : true,
    useSharedStrings: true,
  });

  for (const key in sheets) {
    const sheet = sheets[key];
    if (!sheet.rows) {
      return Promise.reject(`未找到 sheet(${key}) 的 rows 数据`);
    }
    const rows          = sheet.rows;
    const colsStyle     = sheet.colsStyle || [];
    const headRowsStyle = sheet.headRowsStyle || [];
    const rowsStyle     = sheet.rowsStyle || [];
    const worksheet     = workbook.addWorksheet(key, {});
    let line            = 1;
    for (let i = 0; i < rows.length; i++) {
      const rowOri = rows[i];
      // 数据整理
      let rowLen   = 1;
      let colStart = -1;
      let colEnd   = -1;
      for (let j = 0; j < rowOri.length; j++) {
        if (Array.isArray(rowOri[j])) {
          rowLen = rowOri[j].length;
          if (rowLen >= 2) {
            colStart = j;
            colEnd   = j + rowOri[j][0].length - 1;
          }
        }
      }

      const newRow = [];
      for (let k = 0; k < rowLen; k++) {
        let row = [];
        for (let j = 0; j < rowOri.length; j++) {
          if (Array.isArray(rowOri[j])) {
            row = row.concat(rowOri[j][k]);
          } else {
            row.push(rowOri[j]);
          }
        }
        newRow.push(row);
        worksheet.addRow(row);
      }
      // 整理需要合并的单元格信息
      const mergeInfo = [];
      let lineTmp     = line;
      for (let j = 0; j < newRow.length; j++) {
        let rowStart = -1;
        let rowEnd   = -1;
        let k        = 0;
        for (k = 0; k < newRow[j].length; k++) {
          if (newRow[j][k] === null) {
            rowEnd++;
          } else {
            if (rowLen >= 2 && k > 0 && (k - 1 < colStart || k - 1 > colEnd)) {
              // 包含纵向合并
              if (rowStart !== rowEnd || line !== (line + rowLen - 1)) {
                mergeInfo.push(`${colMap[rowStart + 1]}${line}:${colMap[rowEnd + 1]}${line + rowLen - 1}`);
              }
            } else if (rowStart !== rowEnd) {
                mergeInfo.push(`${colMap[rowStart + 1]}${lineTmp}:${colMap[rowEnd + 1]}${lineTmp}`);
              }
            rowStart = k;
            rowEnd   = rowStart;
          }
        }
        // 最后一列处理
        if (rowLen >= 2 && k === newRow[j].length && (k - 1 < colStart || k - 1 > colEnd)) {
          // 包含纵向合并
          if (rowStart !== rowEnd || line !== (line + rowLen - 1)) {
            mergeInfo.push(`${colMap[rowStart + 1]}${line}:${colMap[rowEnd + 1]}${line + rowLen - 1}`);
          }
        } else if (rowStart !== rowEnd) {
            mergeInfo.push(`${colMap[rowStart + 1]}${lineTmp}:${colMap[rowEnd + 1]}${lineTmp}`);
          }
        lineTmp++;
      }
      _.map(_.uniq(mergeInfo), minfo => {
        worksheet.mergeCells(minfo);
      });

      line += rowLen;
    }
    // 初始化样式
    worksheet.eachRow({ includeEmpty: true }, row => {
      row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      row.eachCell({ includeEmpty: true }, cell => {
        cell.border = {
          top   : { style: 'thin', color: { argb: 'FF000000' } },
          left  : { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right : { style: 'thin', color: { argb: 'FF000000' } },
        };
      });
    });
    // 载入自定义样式
    if (colsStyle) {
      _.map(colsStyle, (style, idx) => {
        if (style) {
          _.assign(worksheet.getColumn(idx + 1), style);
        }
        // worksheet.getColumn(idx + 1).width = style.width;
      });
    }
    if (headRowsStyle) {
      _.map(headRowsStyle, (rowStyle, idxi) => {
        if (rowStyle) {
          if (Array.isArray(rowStyle) && rowStyle.length) {
            _.map(rowStyle, (cellStyle, idxj) => {
              if (cellStyle) {
                _.assign(worksheet.getCell(`${colMap[idxj + 1]}${idxi + 1}`), cellStyle);
              }
            });
          } else {
            _.assign(worksheet.getRow(`${idxi + 1}`), rowStyle);
          }
        }
      });
    }
    if (rowsStyle) {
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber > headRowsStyle.length || 0) {
          if (rowsStyle) {
            if (Array.isArray(rowsStyle) && rowsStyle.length) {
              row.eachCell({ includeEmpty: true }, (cell, celNumber) => {
                if (rowsStyle[celNumber - 1]) {
                  _.assign(cell, rowsStyle[celNumber - 1]);
                }
              });
            } else {
              _.assign(row, rowsStyle);
            }
          }
        }
      });
    }
    worksheet.commit();
  }
  return await workbook.commit()
    .then(() => {
      return filepath;
    });
}


/**
 * example
 */
// let rows          = [
//   ['订单号', null, '订单类型', '事项类型', '姓名', '火星号', '部门', '日期', '时段', '人数', '金额'],
//   [
//     'OR2018100811463813',
//     222222,
//     '个人消费',
//     'newBee火锅餐厅',
//     '曹蕾',
//     2669,
//     '1234的一部门',
//     '2018-10-08T16:00:00.000Z',
//     '中午',
//     0,
//     '123.00'
//   ],
//   [
//     'OR2018093014412305',
//     null,
//     '个人消费',
//     'newBee火锅餐厅',
//     '曹蕾',
//     2669,
//     '1234的一部门',
//     '2018-09-30T16:00:00.000Z',
//     '晚上',
//     2,
//     '0.00'
//   ],
//   [
//     'OR2018092915315336',
//     3333333,
//     '个人消费',
//     'newBee火锅餐厅',
//     '曹蕾',
//     2669,
//     '1234的一部门',
//     '2018-09-29T16:00:00.000Z',
//     '中午',
//     2,
//     '0.00'
//   ],
//   [
//     'OR2018092914289188',
//     null,
//     '个人消费',
//     'newBee火锅餐厅',
//     '曹蕾',
//     2669,
//     '1234的一部门',
//     '2018-09-29T16:00:00.000Z',
//     '晚上',
//     12,
//     '0.00'
//   ],
//   [
//     'OR201806131367',
//     323232,
//     '个人消费',
//     'newBee火锅餐厅',
//     '徐骞',
//     8905,
//     '技术工程中心-人事招聘系统',
//     '1970-01-01T00:00:00.000Z',
//     '',
//     0,
//     '0.00'
//   ]
// ];
// let colsStyle     = [
//   {width: '22'},
//   {width: '10'},
//   {width: '10'},
//   {width: '16'},
//   {width: '10'},
//   {width: '30', font: {bold: true}, fill: {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFCC99'}}, border: {bottom: {style: 'dotted'}}},
//   {width: '10'},
//   {width: '30'},
//   {width: '10'},
//   {width: '10'},
//   {width: '10'}
// ];
// let headRowsStyle = [
//   [
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'none', bgColor: {argb: 'FFFFCC99'}, fgColor: {argb: 'FFCCFFFF'}},
//       border: {bottom: {style: 'thin'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFCCFFFF'}},
//       border: {bottom: {style: 'dotted'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightHorizontal', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFFFFCC'}},
//       border: {bottom: {style: 'dashDot'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightVertical', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FF339966'}},
//       border: {bottom: {style: 'hair'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightDown', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFFFF00'}},
//       border: {bottom: {style: 'dashDotDot'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightUp', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFFCC99'}},
//       border: {bottom: {style: 'slantDashDot'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightGrid', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFFCC99'}},
//       border: {bottom: {style: 'mediumDashed'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightTrellis', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFFCC99'}},
//       border: {bottom: {style: 'mediumDashDotDot'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightGrid', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFF99CC'}},
//       border: {bottom: {style: 'mediumDashDot'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'lightGray', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFF99CC'}},
//       border: {bottom: {style: 'medium'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'gray125', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FF99FFCC'}},
//       border: {bottom: {style: 'double'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'gray0625', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FF99FFCC'}},
//       border: {bottom: {style: 'thick'}}
//     },
//     {
//       font  : {bold: true},
//       fill  : {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FFCCFFFF'}, fgColor: {argb: 'FFFF99CC'}},
//       border: {diagonal: {up: true, down: true, style: 'thick'}}
//     }
//   ]
// ];
// let rowsStyle     = {alignment: {vertical: 'middle', horizontal: 'left', wrapText: false}};
//
// let sheets = {
//   sheet1: {
//     rows,
//     colsStyle,
//     headRowsStyle,
//     rowsStyle
//   }
// };
// generateTable('./', sheets);
