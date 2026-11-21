import { describe, expect, it } from 'vitest';
import {
  eventPostcards,
  events,
  postOfficeCatalog,
  schools,
  seasonLeaves,
  seasonOrder,
} from '../src/data/catalog';

describe('V6 Catalog & Asset Mapping Integrity', () => {
  it('defines all three universities with authentic flowers and A6 assets', () => {
    expect(schools.map((s) => s.name)).toEqual(['澳门大学', '澳门理工大学', '澳门旅游大学']);
    expect(schools.map((s) => s.flower)).toEqual(['木棉花', '炮仗花', '桃花']);
    schools.forEach((s) => {
      expect(s.frontImage).toMatch(/^\/assets\/postcards\/schools\/.*-front\.webp$/);
      expect(s.backImage).toMatch(/^\/assets\/postcards\/schools\/.*-back\.webp$/);
    });
  });

  it('preserves all 6 demonstration events with bidirectional postcard ID matching', () => {
    expect(events).toHaveLength(6);
    expect(eventPostcards).toHaveLength(6);
    events.forEach((ev) => {
      const card = eventPostcards.find((p) => p.id === ev.postcardId && p.eventId === ev.id);
      expect(card).toBeDefined();
    });
  });

  it('defines all 4 seasonal bougainvillea leaf cards and poster variants without mixing vase set', () => {
    expect(seasonOrder).toEqual(['spring', 'summer', 'autumn', 'winter']);
    expect(seasonOrder.map((id) => seasonLeaves[id].variety)).toEqual([
      '绿樱',
      '同安红',
      '加州黄金',
      '漳红樱',
    ]);
    seasonOrder.forEach((id) => {
      const s = seasonLeaves[id];
      expect(s.frontImage).toBe(`/assets/postcards/leaf/${id}-front.png`);
      expect(s.backImage).toBe(`/assets/postcards/leaf/${id}-back.png`);
      expect(s.posterFront).toBe(`/assets/postcards/seasons/${id}-front.webp`);
      expect(s.posterBack).toBe(`/assets/postcards/seasons/${id}-back.webp`);
    });
  });

  it('provides 7 unified Time Post Office cards (3 school A6 + 4 season posters)', () => {
    expect(postOfficeCatalog).toHaveLength(7);
    expect(postOfficeCatalog.filter((c) => c.series === 'school')).toHaveLength(3);
    expect(postOfficeCatalog.filter((c) => c.series === 'season')).toHaveLength(4);
  });
});
