import { expect, it } from 'vitest';
import { cardHint, stampsWord } from './card-hint';

it('points a new card at the first reward', () => {
  const h = cardHint(0);
  expect(h.available).toBeNull();
  expect(h.next?.stop.stamps).toBe(3);
  expect(h.next?.missing).toBe(3);
  expect(h.full).toBe(false);
});

it('offers the best reached reward and the next one', () => {
  const h = cardHint(6);
  expect(h.available?.stamps).toBe(5);
  expect(h.next?.stop.stamps).toBe(7);
  expect(h.next?.missing).toBe(1);
});

it('has nothing further on a full card', () => {
  const h = cardHint(13);
  expect(h.available?.stamps).toBe(13);
  expect(h.next).toBeNull();
  expect(h.full).toBe(true);
});

it('agrees in number', () => {
  expect(stampsWord(1)).toBe('tampon');
  expect(stampsWord(2)).toBe('tampons');
});
