import { VerseaError } from './error';

/**
 * 判断数组是否没有重复元素
 */
function isUniqueArray(value: unknown[]): boolean {
  const uniqueValue = [...new Set(value)];
  return uniqueValue.length === value.length;
}

/**
 * 双向链表节点
 */
export class LinkedListNode<T> {
  public value: T[];

  public previous: LinkedListNode<T> | null = null;

  public next: LinkedListNode<T> | null = null;

  constructor(value: T[]) {
    this.value = value;
  }

  public equal(node: LinkedListNode<T>): boolean {
    if (this.value.length !== node.value.length) {
      return false;
    }

    return this.value.every((item) => node.value.includes(item));
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected toJSON(): Record<string, unknown> {
    const props = Object.keys(this);
    return props
      .filter((key) => !['previous'].includes(key))
      .reduce<Record<string, unknown>>((prev, key: string) => {
        prev[key] = this[key as keyof LinkedListNode<T>];
        return prev;
      }, {});
  }
}

/**
 * 双向链表
 * @description 一种简化的双向链表，仅仅只允许从尾部添加和尾部删除
 */
export class LinkedList<T> {
  public head: LinkedListNode<T>;

  public last: LinkedListNode<T>;

  public length: number;

  public previous: LinkedList<T> | null = null;

  public next: LinkedList<T> | null = null;

  constructor(value: T[]) {
    this.head = new LinkedListNode(value);
    this.last = this.head;
    this.length = 1;
  }

  public get values(): T[] {
    if (this.length === 0) {
      return [];
    }

    let node = this.head;
    let values = [...node.value];
    while (node.next) {
      node = node.next;
      values = [...values, ...node.value];
    }
    return values;
  }

  public push(value: T[]): void {
    if (this.length === 0) {
      throw new VerseaError('Can not push data to destroyed linkedList.');
    }

    const node = new LinkedListNode(value);
    this.last.next = node;
    node.previous = this.last;
    this.last = node;
    this.length++;
  }

  public pop(): LinkedListNode<T> {
    if (this.length === 0) {
      throw new VerseaError('Can not pop destroyed linkedList.');
    }

    const node = this.last;
    if (node.previous) {
      this.last = node.previous;
      node.previous = null;
      this.last.next = null;
    }
    this.length--;
    return node;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected toJSON(): Record<string, unknown> {
    const props = Object.keys(this);
    return props
      .filter((key) => !['previous'].includes(key))
      .reduce<Record<string, unknown>>((prev, key: string) => {
        prev[key] = this[key as keyof LinkedList<T>];
        return prev;
      }, {});
  }
}

/**
 * 生成一种特殊类型的双向链表图
 * @description 将多个 LinkedLink 的 head 拼接成一个新的双向链表
 * ------
 * ```
 * A ⇄ B
 * ⇅
 * C ⇄ D ⇄ E
 * ```
 */

//  A ⇄ B
//  ⇅
//  C ⇄ D

export class LinkedMap<T> {
  public head: LinkedList<T> | null = null;

  public last: LinkedList<T> | null = null;

  constructor(matrix: T[][]) {
    const list = [];

    let startIndex = 0;
    for (let i = 1; i < matrix.length; i++) {
      if (matrix[i][0] !== matrix[i - 1][0]) {
        list.push(this._createLinkedList(matrix.slice(startIndex, i)));
        startIndex = i;
      }
    }
    list.push(this._createLinkedList(matrix.slice(startIndex)));

    this._createLinkedMap(list);
    this._ensureUniqueValues();
  }

  public push(node: LinkedList<T>): void {
    if (!this.last) {
      throw new VerseaError('Can not push data to destroyed LinkedMap.');
    }

    this.last.next = node;
    node.previous = this.last;
    this.last = node;
  }

  public pop(): LinkedList<T> {
    const node = this.last;
    if (!node) {
      throw new VerseaError('Can not pop destroyed LinkedMap.');
    }

    if (node.previous) {
      this.last = node.previous;
      node.previous = null;
      this.last.next = null;
    }
    return node;
  }

  /**
   * 比较两个双向链表图不同的开始位置
   * @description 一行一行的比较，找出一行中不同的位置
   */
  public compare(map: LinkedMap<T>): LinkedListNode<T> {
    console.log(map);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return map.head!.head;
  }

  protected _createLinkedList(matrix: T[][]): LinkedList<T> {
    let linkedList: LinkedList<T> | null = null;
    matrix.forEach((line) => {
      const [first, ...other] = line;
      if (!linkedList) {
        linkedList = new LinkedList([first]);
      }
      linkedList.push(other);
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return linkedList!;
  }

  protected _createLinkedMap(list: LinkedList<T>[]): void {
    list.forEach((node, index) => {
      if (index === 0) {
        this.head = node;
        this.last = this.head;
      } else {
        this.push(node);
      }
    });
  }

  protected _ensureUniqueValues(): void {
    let node = this.head;
    if (!node) {
      return;
    }

    let values = [...node.values];
    while (node.next) {
      node = node.next;
      values = [...values, ...node.values];
    }

    if (!isUniqueArray(values)) {
      throw new Error('The matrix element is not unique.');
    }
  }
}

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
export function ensureDiffMatrix<T extends object>(matrix: T[][]): void {
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
 * - 同行计算，因为第一列是基准列，先计算每一行第一个元素，发现第一个元素不等，则之后的不需要计算，全部输出
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
export function minusMatrix<T>(minuend: T[][], subtrahend: T[][]): T[][] {
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

/**
 * 删除矩阵中的元素
 * @description 一种特殊的计算差集的方式，第一列是基准列，删除基准列的元素要保证它后面的行没有其他元素，不能垮行删除元素
 */
export function removeMatrixElement<T>(matrix: T[][], elements: T[]): T[][] {
  const newMatrix = matrix.map((line) => line.map((element) => element));

  if (!elements.length) {
    return newMatrix;
  }

  // 找到包含 elements 的那一行
  const lineIndex = newMatrix.findIndex((line) => line.includes(elements[0]));
  if (lineIndex < 0) {
    throw new VerseaError('Can not find elements in matrix.');
  }

  const line = newMatrix[lineIndex];

  function remove(element: T): void {
    const index = line.indexOf(element);
    if (index <= 0) {
      throw new VerseaError('Remove element error.');
    }

    line.splice(index, 1);
  }

  // 删除非第一个元素
  elements.forEach((element, elementIndex) => {
    if (elementIndex >= 1) {
      remove(element);
    }
  });

  // 删除的第一个元素不是基准列的元素
  if (elements[0] !== line[0]) {
    remove(elements[0]);
    return newMatrix;
  }

  if (lineIndex >= 1 && newMatrix[lineIndex - 1][0] !== line[0]) {
    throw new VerseaError('Can not remove element in base column that is not the first one.');
  }

  if (line.length > 0) {
    // line.splice(0, 1, undefined);
  }

  return matrix;
}
