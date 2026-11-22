import { describe, expect, it } from 'vitest';
import {
  eventStatus,
  events,
  postOfficeCatalog,
  schools,
  seasonLeaves,
  seasonOrder,
} from '../src/data/catalog';
import { gardenCard } from '../src/data/gardenCard';

describe('V6 Catalog & Asset Mapping Integrity', () => {
  it('defines all three universities with authentic flowers and A6 assets', () => {
    expect(schools.map((s) => s.name)).toEqual(['澳门大学', '澳门理工大学', '澳门旅游大学']);
    expect(schools.map((s) => s.flower)).toEqual(['木棉花', '炮仗花', '桃花']);
    schools.forEach((s) => {
      expect(s.frontImage).toMatch(/^\/assets\/postcards\/schools\/.*-front\.webp$/);
      expect(s.backImage).toMatch(/^\/assets\/postcards\/schools\/.*-back\.webp$/);
    });
  });

  it('defines three verified UM notices, two marked demonstrations and one garden card', () => {
    expect(events).toHaveLength(6);
    expect(events.filter((event) => event.verified)).toHaveLength(3);
    expect(events.filter((event) => event.category.includes('非官方资讯'))).toHaveLength(2);
    expect(events.filter((event) => event.kind === 'garden')).toHaveLength(1);
  });

  it('derives ended status from the actual start and end times', () => {
    const lecture = events.find((event) => event.id === 'thanksgiving')!;
    expect(eventStatus(lecture, Date.parse('2026-11-25T14:30:00+08:00'))).toBe('ongoing');
    expect(eventStatus(lecture, Date.parse('2026-11-25T16:01:00+08:00'))).toBe('ended');
    expect(eventStatus(lecture, Date.parse('2026-11-22T12:00:00+08:00'))).toBe('upcoming');
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

  it('provides original garden artwork without presenting it as a fourth school', () => {
    expect(gardenCard.name).toBe('德智广场');
    expect(gardenCard.frontImage).toContain('dezhi-front');
    expect(postOfficeCatalog.some((card) => card.title.includes('德智广场'))).toBe(false);
  });
});
