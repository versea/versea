import { b } from './index';

describe('normal action', () => {
  test('no action', () => {
    expect(b('1', '2')).toBe('12');
  });
});
