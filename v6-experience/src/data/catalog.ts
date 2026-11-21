export type SchoolId = 'um' | 'mpu' | 'utm';
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';
export type RouteId = 'home' | 'explore' | 'swing' | 'leaf-drop' | 'post-office';

export interface School {
  id: SchoolId;
  name: string;
  nameEn: string;
  flower: string;
  accent: string;
  accentSoft: string;
  ink: string;
  frontImage: string;
  backImage: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  schoolId: SchoolId;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  coverKey: 'campus' | 'print' | 'taste' | 'music';
  postcardId: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  featured?: boolean;
  color: string;
}

export interface PostcardItem {
  id: string;
  series: 'school' | 'season';
  title: string;
  subtitle: string;
  flower: string;
  frontImage: string;
  backImage: string;
  accent: string;
  ink: string;
  eventId?: string;
  schoolId?: SchoolId;
  seasonId?: SeasonId;
  postcardText: string;
}

export interface SeasonLeafCard {
  id: SeasonId;
  label: string;
  labelEn: string;
  variety: string;
  poeticLine: string;
  frontImage: string;
  backImage: string;
  posterFront: string;
  posterBack: string;
  accent: string;
  tint: string;
  tileBg: string;
}

export const schools: School[] = [
  {
    id: 'um',
    name: '澳门大学',
    nameEn: 'University of Macau',
    flower: '木棉花',
    accent: '#D94A2B',
    accentSoft: '#EFE5A8',
    ink: '#1F4B4A',
    frontImage: '/assets/postcards/schools/um-front.webp',
    backImage: '/assets/postcards/schools/um-back.webp',
  },
  {
    id: 'mpu',
    name: '澳门理工大学',
    nameEn: 'Macao Polytechnic University',
    flower: '炮仗花',
    accent: '#E88224',
    accentSoft: '#F8D487',
    ink: '#204386',
    frontImage: '/assets/postcards/schools/upm-front.webp',
    backImage: '/assets/postcards/schools/upm-back.webp',
  },
  {
    id: 'utm',
    name: '澳门旅游大学',
    nameEn: 'Macao University of Tourism',
    flower: '桃花',
    accent: '#D87D90',
    accentSoft: '#F3C8D2',
    ink: '#5A394D',
    frontImage: '/assets/postcards/schools/utm-front.webp',
    backImage: '/assets/postcards/schools/utm-back.webp',
  },
];

// Preserved verbatim from V5 src/data.ts — clearly marked as demonstration content.
export const events: CampusEvent[] = [
  {
    id: 'winter',
    title: '冬日校园漫游',
    schoolId: 'um',
    category: '校园探索',
    startTime: '2026-12-12T15:00:00+08:00',
    endTime: '2026-12-12T18:00:00+08:00',
    location: '校园中央步道 · 演示地点',
    description:
      '沿着冬日的树影，重新发现熟悉的校园。跟随一份小小的探索地图，从拱廊走到花园，收集那些平日匆匆经过的风景。\n在这一场不赶时间的漫游里，让建筑、自然与偶遇的故事，成为写给校园的一封信。',
    coverKey: 'campus',
    postcardId: 'pc-winter',
    status: 'upcoming',
    featured: true,
    color: '#c9ddca',
  },
  {
    id: 'print',
    title: '把冬天印在纸上',
    schoolId: 'mpu',
    category: '创意工坊',
    startTime: '2026-12-13T14:00:00+08:00',
    endTime: '2026-12-13T17:00:00+08:00',
    location: '创意工作室 · 演示地点',
    description:
      '用树叶、几何色块和一点想象力，拼出自己的冬日风景。体验纸张拓印与双色拼贴，将校园里的一小片灵感变成可以珍藏的画面。\n演示流程包含材料观察、图形组合与作品分享，无需美术基础。',
    coverKey: 'print',
    postcardId: 'pc-print',
    status: 'upcoming',
    color: '#ebba9e',
  },
  {
    id: 'taste',
    title: '一口暖暖的澳门',
    schoolId: 'utm',
    category: '文化体验',
    startTime: '2026-12-19T14:30:00+08:00',
    endTime: '2026-12-19T17:00:00+08:00',
    location: '校园文化空间 · 演示地点',
    description:
      '从一杯热饮、一份点心开始，认识澳门文化的多种滋味。以食物为线索，聆听城市的日常故事，发现传统与新想法相遇的瞬间。\n这是一份文化体验的演示内容，页面不提供报名或实际餐饮服务。',
    coverKey: 'taste',
    postcardId: 'pc-taste',
    status: 'upcoming',
    color: '#e8ce70',
  },
  {
    id: 'music',
    title: '树下的冬日旋律',
    schoolId: 'um',
    category: '音乐现场',
    startTime: '2026-12-20T17:00:00+08:00',
    endTime: '2026-12-20T19:00:00+08:00',
    location: '户外草坪 · 演示地点',
    description:
      '当夕阳落在树梢，让旋律接住一天最后的光。坐在草地上，听一段轻轻的和声，与朋友分享属于校园的悠闲时刻。\n本页为音乐活动场景演示，演出安排并非学校官方资讯。',
    coverKey: 'music',
    postcardId: 'pc-music',
    status: 'upcoming',
    color: '#bdcbdc',
  },
  {
    id: 'light',
    title: '看见光的形状',
    schoolId: 'mpu',
    category: '艺术展览',
    startTime: '2026-12-21T10:00:00+08:00',
    endTime: '2026-12-21T18:00:00+08:00',
    location: '校园展览厅 · 演示地点',
    description:
      '透过纸、颜色与光影，观察日常空间的新表情。在缓慢的观看中，找到一个属于你的角度。\n以校园艺术展为背景的演示内容，展品与展览安排均为示意。',
    coverKey: 'print',
    postcardId: 'pc-light',
    status: 'upcoming',
    color: '#c9c3dc',
  },
  {
    id: 'city',
    title: '城市故事交换所',
    schoolId: 'utm',
    category: '文化分享',
    startTime: '2026-12-22T15:00:00+08:00',
    endTime: '2026-12-22T17:00:00+08:00',
    location: '共享交流空间 · 演示地点',
    description:
      '一张照片，一处街角，一段关于澳门的记忆。邀请你在故事之间走走，听见来自不同人的城市声音。\n此处展示文化分享活动的数字交互示例，并非正式活动公告。',
    coverKey: 'campus',
    postcardId: 'pc-city',
    status: 'upcoming',
    color: '#d7d4b3',
  },
];

export const seasonLeaves: Record<SeasonId, SeasonLeafCard> = {
  spring: {
    id: 'spring',
    label: '春',
    labelEn: 'SPRING',
    variety: '绿樱',
    poeticLine: '嫩绿苞片携微风轻落，记下春日枝头的新芽。',
    frontImage: '/assets/postcards/leaf/spring-front.png',
    backImage: '/assets/postcards/leaf/spring-back.png',
    posterFront: '/assets/postcards/seasons/spring-front.webp',
    posterBack: '/assets/postcards/seasons/spring-back.webp',
    accent: '#2D6B5E',
    tint: '#DCE9C6',
    tileBg: '#195E59',
  },
  summer: {
    id: 'summer',
    label: '夏',
    labelEn: 'SUMMER',
    variety: '同安红',
    poeticLine: '盛夏一抹炽烈同安红，把晴朗日光折进叶脉。',
    frontImage: '/assets/postcards/leaf/summer-front.png',
    backImage: '/assets/postcards/leaf/summer-back.png',
    posterFront: '/assets/postcards/seasons/summer-front.webp',
    posterBack: '/assets/postcards/seasons/summer-back.webp',
    accent: '#C93B32',
    tint: '#F5D5D0',
    tileBg: '#A62D27',
  },
  autumn: {
    id: 'autumn',
    label: '秋',
    labelEn: 'AUTUMN',
    variety: '加州黄金',
    poeticLine: '暖金秋意缀满枝梢，随风落入掌心的丰收色。',
    frontImage: '/assets/postcards/leaf/autumn-front.png',
    backImage: '/assets/postcards/leaf/autumn-back.png',
    posterFront: '/assets/postcards/seasons/autumn-front.webp',
    posterBack: '/assets/postcards/seasons/autumn-back.webp',
    accent: '#D46D22',
    tint: '#F5DEC2',
    tileBg: '#57284E',
  },
  winter: {
    id: 'winter',
    label: '冬',
    labelEn: 'WINTER',
    variety: '漳红樱',
    poeticLine: '粉白点樱如冬日初晴，留住德智广场温柔一刻。',
    frontImage: '/assets/postcards/leaf/winter-front.png',
    backImage: '/assets/postcards/leaf/winter-back.png',
    posterFront: '/assets/postcards/seasons/winter-front.webp',
    posterBack: '/assets/postcards/seasons/winter-back.webp',
    accent: '#2F4FA2',
    tint: '#E2DDF3',
    tileBg: '#1E3C94',
  },
};

export const seasonOrder: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];

export const eventPostcards: PostcardItem[] = events.map((ev) => {
  const sc = schools.find((s) => s.id === ev.schoolId)!;
  return {
    id: ev.postcardId,
    series: 'school',
    title: ev.title,
    subtitle: `${sc.name} · ${sc.flower}`,
    flower: sc.flower,
    frontImage: sc.frontImage,
    backImage: sc.backImage,
    accent: sc.accent,
    ink: sc.ink,
    eventId: ev.id,
    schoolId: ev.schoolId,
    postcardText: `把「${ev.title}」的这一刻，留在心里。愿每一次校园里的相遇，都成为值得收藏的小事。`,
  };
});

export const postOfficeCatalog: PostcardItem[] = [
  ...schools.map((sc) => ({
    id: `po-school-${sc.id}`,
    series: 'school' as const,
    title: `${sc.name} · ${sc.flower}`,
    subtitle: '三校 A6 典藏明信片',
    flower: sc.flower,
    frontImage: sc.frontImage,
    backImage: sc.backImage,
    accent: sc.accent,
    ink: sc.ink,
    schoolId: sc.id,
    postcardText: `在德智广场拾起一朵${sc.flower}，写给未来的自己。`,
  })),
  ...seasonOrder.map((sid) => {
    const s = seasonLeaves[sid];
    return {
      id: `po-season-${sid}`,
      series: 'season' as const,
      title: `${s.label} · ${s.variety}`,
      subtitle: `四季海报限定 · ${s.labelEn}`,
      flower: s.variety,
      frontImage: s.posterFront,
      backImage: s.posterBack,
      accent: s.accent,
      ink: s.tileBg,
      seasonId: sid,
      postcardText: s.poeticLine,
    };
  }),
];

export const sessionConfig = {
  idleMs: 90_000,
  warningMs: 15_000,
};

export const getSchool = (id: SchoolId) => schools.find((s) => s.id === id) ?? schools[0];
export const schoolName = (id: SchoolId) => getSchool(id).name;
export const dateLabel = (event: CampusEvent) => {
  const parts = event.startTime.slice(5, 10).split('-');
  return `${Number(parts[0])}月${Number(parts[1])}日`;
};
export const timeLabel = (event: CampusEvent) =>
  `${event.startTime.slice(11, 16)} — ${event.endTime.slice(11, 16)}`;
