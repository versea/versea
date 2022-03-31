import { LinkedMap } from './linked-list';

/**
 * unit
 * @author huchao
 */
describe('LinkedMap', () => {
  describe('Create', () => {
    test('只有一个数据的二维数组，应该可以创建成功', () => {
      const map = new LinkedMap([['A']]);
      expect(map.head.head.next.value).toStrictEqual([]);
    });

    test('没有数据的数组，应该可以创建成功', () => {
      const map = new LinkedMap([]);
      expect(map.head).toBeNull();
    });

    test('创建复杂的数据，应该可以创建成功', () => {
      const map = new LinkedMap([['A', 'B'], ['A'], ['A', 'C'], ['D', 'E', 'F'], ['G']]);
      expect(map.head.length).toBe(4);
      expect(map.head.next.length).toBe(2);
      expect(map.head.next.next.length).toBe(2);
    });
  });
});
