import { VerseaError } from './error';

/**
 * 保证输入矩阵的元素是不重复的
 * @description 一种特殊的不重复规则，第一列是基准列，仅仅允许基准列可以连续重复，不允许基准列间断重复，也不允许其他列有重复的元素
 * ```
 * [
 *   [A, B],
 *   [A],
 *   [C],
 *   [C, D],
 * ] // 正确
 *
 * [
 *   [A, B],
 *   [A],
 *   [C],
 *   [A, D],
 * ] // 不正确，不允许间断重复
 *
 * [
 *   [A, B],
 *   [A],
 *   [C],
 *   [C, A],
 * ] // 不正确，不允许其他列有重复的元素
 * ```
 */
export function ensureDiffMatrixWithBaseColumn<T extends object>(matrix: T[][]): void {
  if (matrix.length == 0) {
    return;
  }

  const map: WeakMap<T, boolean> = new WeakMap();

  function add(element: T): void {
    if (map.has(element)) {
      throw new VerseaError(`Matrix Error With BaseColumn.`);
    }
    map.set(element, true);
  }

  // 获取最大列数
  const length = Math.max.apply(
    null,
    matrix.map((line) => line.length),
  );

  // 基准列可以连续重复
  let lastElement = matrix[0][0];
  matrix.forEach((line) => {
    const element = line[0];
    if (element !== lastElement) {
      add(lastElement);
      lastElement = element;
    }
  });
  add(lastElement);

  // 第二列开始不允许重复
  for (let i = 1; i < length; i++) {
    for (const line of matrix) {
      if (line[i]) {
        add(line[i]);
      }
    }
  }
}

/**
 * 计算二维数组的差集
 * @description 一种特殊的计算差集的方式，第一列是基准列，同行计算差集
 * ------
 * 定义如下差集计算规则
 * - 同行计算，因为第一列是基准列，先计算没一行第一个元素，发现第一个元素不等，则之后的不需要计算，全部输出
 * ```
 * [
 *   [A],
 *   [B],
 *   [C],
 * ]
 * // 减
 * [
 *   [A],
 *   [D],
 *   [E],
 * ]
 * // 等于
 * [
 *   [B],
 *   [C],
 * ]
 * ```
 *
 * - 同行计算，非第一个元素（非基准列元素），后面不分顺序，计算差集
 * ```
 * [
 *   [A, B, C],
 *   [D],
 * ]
 * // 减
 * [
 *   [A, C, E],
 *   [D],
 * ]
 * // 等于
 * [
 *   [B],
 * ]
 * ```
 *
 * - 基准列可以连续重复，输出结果会去除第一列重复的元素
 * ```
 * [
 *   [A],
 *   [A],
 *   [B],
 *   [B],
 *   [C],
 *   [C]
 * ]
 * // 减
 * [
 *   [A],
 *   [A],
 *   [A],
 * ]
 * // 等于 [[B], [C]] 而不是 [[B], [B], [C], [C]]
 * ```
 *
 * - 特殊规则：已经判断过相等的基准列元素也要去除
 * ```
 * [
 *   [A],
 *   [A],
 *   [B],
 * ]
 * // 减
 * [
 *   [A],
 *   [C],
 *   [D],
 * ]
 * // 等于 [[B]]，而不是 [[A], [B]]，因为 A 在第一行已经判断为相等
 * ```
 */
export function minusMatrixWithBaseColumn<T>(minuend: T[][], subtrahend: T[][]): T[][] {
  const diff: T[][] = [];

  if (!minuend.length) {
    return diff;
  }

  // 记录从某一行开始需要全部输出的位置
  let breakIndex = -1;

  // 记录上一行基准列相同的元素
  let lastElement: T | null = null;

  for (let i = 0; i < minuend.length; i++) {
    const minuendLine = minuend[i];
    const subtrahendLine = subtrahend[i];
    // 同行比较，发现某一行没有 subtrahendLine，则该行以及之后的行全部输出
    if (!subtrahendLine) {
      breakIndex = i;
      break;
    }

    const diffLine: T[] = [];
    minuendLine.forEach((element, index) => {
      if (index >= 1 && !subtrahendLine.includes(element)) {
        diffLine.push(element);
      }
    });

    let toBreak = false;
    // 同行比较，只要发现某一行基准列的 Element 不一致，则下一行以及之后的行全部输出
    if (minuendLine[0] !== subtrahendLine[0]) {
      if (!lastElement || lastElement !== minuendLine[0]) {
        diffLine.unshift(minuendLine[0]);
      }
      breakIndex = i + 1;
      toBreak = true;
    }

    lastElement = minuendLine[0];
    if (diffLine.length) {
      diff.push(diffLine);
    }

    if (toBreak) {
      break;
    }
  }

  // breakIndex 开始的行以及之后每一行全部加入 unmount 数组
  if (breakIndex >= 0 && breakIndex < minuend.length) {
    for (let i = breakIndex; i < minuend.length; i++) {
      const minuendLine = minuend[i];
      if (lastElement === minuendLine[0]) {
        const diffLine = minuendLine.slice(1);
        if (diffLine.length) {
          diff.push(diffLine);
        }
      } else {
        lastElement = minuendLine[0];
        diff.push(minuendLine.slice());
      }
    }
  }

  return diff;
}
