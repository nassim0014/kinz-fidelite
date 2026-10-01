import { expect, it } from 'vitest';
import { redeemMessage, stampMessage } from './messages';

it('summarises a stamp', () => {
  expect(
    stampMessage({
      stampsAdded: 1,
      pepinsAdded: 2,
      cardStamps: 1,
      lifetimePepins: 2,
      levelBefore: 1,
      levelAfter: 2,
      cardFull: false,
    }),
  ).toBe('+1 tampon · +2 pépins · Niveau 2 atteint !');
  expect(
    stampMessage({
      stampsAdded: 2,
      pepinsAdded: 3,
      cardStamps: 13,
      lifetimePepins: 10,
      levelBefore: 5,
      levelAfter: 5,
      cardFull: true,
    }),
  ).toBe('+2 tampons · +3 pépins · Carte pleine — utilisez la récompense');
});

it('summarises a redeem', () => {
  expect(
    redeemMessage({
      stop: 11,
      label: '1 produit offert (≤ 49 TND) + 11 pépins',
      bonusPepins: 11,
      cardStamps: 0,
      lifetimePepins: 40,
      levelAfter: 9,
    }),
  ).toBe('Récompense appliquée : 1 produit offert (≤ 49 TND) + 11 pépins. Carte remise à 0.');
});
