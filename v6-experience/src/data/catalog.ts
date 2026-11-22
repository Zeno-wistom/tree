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
  kind?: 'school' | 'garden';
  verified?: boolean;
  source?: string;
}

export interface PostcardItem {
  id: string;
  series: 'school' | 'season' | 'garden';
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
  { id: 'um', name: '澳门大学', nameEn: 'University of Macau', flower: '木棉花', accent: '#D94A2B', accentSoft: '#EFE5A8', ink: '#1F4B4A', frontImage: '/assets/postcards/schools/um-front.webp', backImage: '/assets/postcards/schools/um-back.webp' },
  { id: 'mpu', name: '澳门理工大学', nameEn: 'Macao Polytechnic University', flower: '炮仗花', accent: '#E88224', accentSoft: '#F8D487', ink: '#204386', frontImage: '/assets/postcards/schools/upm-front.webp', backImage: '/assets/postcards/schools/upm-back.webp' },
  { id: 'utm', name: '澳门旅游大学', nameEn: 'Macao University of Tourism', flower: '桃花', accent: '#D87D90', accentSoft: '#F3C8D2', ink: '#5A394D', frontImage: '/assets/postcards/schools/utm-front.webp', backImage: '/assets/postcards/schools/utm-back.webp' },
];

export const events: CampusEvent[] = [
  {
    id: 'nobel', title: '澳大45周年 · 诺贝尔奖得主讲座', schoolId: 'um', category: '澳大公告 · 讲座',
    startTime: '2026-11-24T10:00:00+08:00', endTime: '', location: 'N6-G010',
    description: '在澳大45周年校庆之际，走近诺贝尔奖得主的学术分享，让一次专注的聆听成为新的思考起点。',
    coverKey: 'campus', postcardId: 'pc-nobel', status: 'upcoming', color: '#c9ddca', verified: true, source: 'https://e-bulletin.um.edu.mo/notice/561818/',
  },
  {
    id: 'thanksgiving', title: '英语中心 · 感恩节节庆工作坊', schoolId: 'um', category: '澳大公告 · 工作坊',
    startTime: '2026-11-25T14:30:00+08:00', endTime: '2026-11-25T16:00:00+08:00', location: 'E3-1032',
    description: '从节日历史、文化意涵到饮食习俗，在主题活动中认识感恩节，也与朋友共享秋日、食物与感谢。',
    coverKey: 'campus', postcardId: 'pc-thanksgiving', status: 'upcoming', color: '#e8ce70', verified: true, source: 'https://e-bulletin.um.edu.mo/notice/561743/',
  },
  {
    id: 'ai-history', title: '人工智能——让历史告诉未来', schoolId: 'um', category: '澳琴讲坛第四期 · 梅宏院士讲座',
    startTime: '2026-11-28T10:30:00+08:00', endTime: '2026-11-28T11:30:00+08:00', location: '大学城第一期校区6栋1层102多功能厅',
    description: '从历史视角回望人工智能的发展，在技术与时代的交汇处，理解它如何走向未来。',
    coverKey: 'campus', postcardId: 'pc-ai-history', status: 'upcoming', color: '#bdcbdc', verified: true, source: '澳大科教发展研究院讲座邀请邮件',
  },
  {
    id: 'print', title: '把冬天印在纸上', schoolId: 'mpu', category: '课程演示活动 · 非官方资讯',
    startTime: '2026-12-13T14:00:00+08:00', endTime: '2026-12-13T17:00:00+08:00', location: '创意工作室 · 演示地点',
    description: '以叶片拓印与双色拼贴留下冬日纹理，从观察材料到组合图形，把校园灵感变成可以珍藏的画面。',
    coverKey: 'print', postcardId: 'pc-print', status: 'upcoming', color: '#ebba9e',
  },
  {
    id: 'taste', title: '一口暖暖的澳门', schoolId: 'utm', category: '课程演示活动 · 非官方资讯',
    startTime: '2026-12-19T14:30:00+08:00', endTime: '2026-12-19T17:00:00+08:00', location: '校园文化空间 · 演示地点',
    description: '以一杯热饮与一份点心为线索，听见澳门的日常故事，发现传统滋味与新想法相遇的瞬间。',
    coverKey: 'taste', postcardId: 'pc-taste', status: 'upcoming', color: '#e8ce70',
  },
  {
    id: 'garden-memory', title: '德智广场 · 拾花一叶', schoolId: 'um', category: '广场纪念 · 项目原创演示卡',
    startTime: '2026-11-01T00:00:00+08:00', endTime: '2027-12-31T23:59:00+08:00', location: '澳门 · 德智广场',
    description: '风经过树梢，花叶落在纸面。收下这张广场纪念卡，把一次停留、一封来信和这段相遇带在身边。',
    coverKey: 'campus', postcardId: 'pc-garden-memory', status: 'upcoming', color: '#d9c68e', kind: 'garden',
  },
];

export const eventStatus = (event: CampusEvent, now = Date.now()): CampusEvent['status'] => {
  const start = Date.parse(event.startTime);
  const end = event.endTime ? Date.parse(event.endTime) : start + 60 * 60 * 1000;
  return now < start ? 'upcoming' : now <= end ? 'ongoing' : 'ended';
};

export const seasonLeaves: Record<SeasonId, SeasonLeafCard> = {
  spring: { id: 'spring', label: '春', labelEn: 'SPRING', variety: '绿樱', poeticLine: '嫩绿苞片携微风轻落，记下春日枝头的新芽。', frontImage: '/assets/postcards/leaf/spring-front.png', backImage: '/assets/postcards/leaf/spring-back.png', posterFront: '/assets/postcards/seasons/spring-front.webp', posterBack: '/assets/postcards/seasons/spring-back.webp', accent: '#2D6B5E', tint: '#DCE9C6', tileBg: '#195E59' },
  summer: { id: 'summer', label: '夏', labelEn: 'SUMMER', variety: '同安红', poeticLine: '盛夏一抹炽烈同安红，把晴朗日光折进叶脉。', frontImage: '/assets/postcards/leaf/summer-front.png', backImage: '/assets/postcards/leaf/summer-back.png', posterFront: '/assets/postcards/seasons/summer-front.webp', posterBack: '/assets/postcards/seasons/summer-back.webp', accent: '#C93B32', tint: '#F5D5D0', tileBg: '#A62D27' },
  autumn: { id: 'autumn', label: '秋', labelEn: 'AUTUMN', variety: '加州黄金', poeticLine: '暖金秋意缀满枝梢，随风落入掌心的丰收色。', frontImage: '/assets/postcards/leaf/autumn-front.png', backImage: '/assets/postcards/leaf/autumn-back.png', posterFront: '/assets/postcards/seasons/autumn-front.webp', posterBack: '/assets/postcards/seasons/autumn-back.webp', accent: '#D46D22', tint: '#F5DEC2', tileBg: '#57284E' },
  winter: { id: 'winter', label: '冬', labelEn: 'WINTER', variety: '漳红樱', poeticLine: '粉白点樱如冬日初晴，留住德智广场温柔一刻。', frontImage: '/assets/postcards/leaf/winter-front.png', backImage: '/assets/postcards/leaf/winter-back.png', posterFront: '/assets/postcards/seasons/winter-front.webp', posterBack: '/assets/postcards/seasons/winter-back.webp', accent: '#2F4FA2', tint: '#E2DDF3', tileBg: '#1E3C94' },
};

export const seasonOrder: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];

export const postOfficeCatalog: PostcardItem[] = [
  ...schools.map((sc) => ({ id: `po-school-${sc.id}`, series: 'school' as const, title: `${sc.name} · ${sc.flower}`, subtitle: '三校 A6 典藏明信片', flower: sc.flower, frontImage: sc.frontImage, backImage: sc.backImage, accent: sc.accent, ink: sc.ink, schoolId: sc.id, postcardText: `在德智广场拾起一朵${sc.flower}，写给未来的自己。` })),
  ...seasonOrder.map((sid) => {
    const s = seasonLeaves[sid];
    return { id: `po-season-${sid}`, series: 'season' as const, title: `${s.label} · ${s.variety}`, subtitle: `四季海报限定 · ${s.labelEn}`, flower: s.variety, frontImage: s.posterFront, backImage: s.posterBack, accent: s.accent, ink: s.tileBg, seasonId: sid, postcardText: s.poeticLine };
  }),
];

export const sessionConfig = { idleMs: 90_000, warningMs: 15_000 };
export const getSchool = (id: SchoolId) => schools.find((s) => s.id === id) ?? schools[0];
export const schoolName = (id: SchoolId) => getSchool(id).name;
export const dateLabel = (event: CampusEvent) => {
  if (event.kind === 'garden') return '德智广场 · 纪念收藏';
  const [year, month, day] = event.startTime.slice(0, 10).split('-');
  return `${year}年${Number(month)}月${Number(day)}日`;
};
export const timeLabel = (event: CampusEvent) => {
  if (event.kind === 'garden') return '';
  return event.endTime ? `${event.startTime.slice(11, 16)} — ${event.endTime.slice(11, 16)}` : `${event.startTime.slice(11, 16)} 开始`;
};
