export interface School { id: string; name: string; nameEn: string }
export interface CampusEvent { id: string; title: string; schoolId: string; category: string; startTime: string; endTime: string; location: string; description: string; coverImage: string; postcardId: string; status: 'upcoming' | 'ongoing' | 'ended'; featured?: boolean; subtitle: string; color: string }
export interface Postcard { id: string; eventId: string; frontImage: string; backImage: string; postcardText: string }
export const schools: School[] = [
  { id: 'um', name: '澳门大学', nameEn: 'University of Macau' },
  { id: 'mpu', name: '澳门理工大学', nameEn: 'Macao Polytechnic University' },
  { id: 'utm', name: '澳门旅游大学', nameEn: 'Macao University of Tourism' },
];
// All content is fictional demonstration material, not an official university announcement.
export const events: CampusEvent[] = [
  { id: 'winter', title: '冬日校园漫游', schoolId: 'um', category: '校园探索', startTime: '2026-12-12T15:00:00+08:00', endTime: '2026-12-12T18:00:00+08:00', location: '校园中央步道 · 演示地点', description: '沿着冬日的树影，重新发现熟悉的校园。跟随一份小小的探索地图，从拱廊走到花园，收集那些平日匆匆经过的风景。\n在这一场不赶时间的漫游里，让建筑、自然与偶遇的故事，成为写给校园的一封信。', coverImage: 'campus', postcardId: 'pc-winter', status: 'upcoming', featured: true, subtitle: 'A little walk, a lovely discovery.', color: '#c9ddca' },
  { id: 'print', title: '把冬天印在纸上', schoolId: 'mpu', category: '创意工坊', startTime: '2026-12-13T14:00:00+08:00', endTime: '2026-12-13T17:00:00+08:00', location: '创意工作室 · 演示地点', description: '用树叶、几何色块和一点想象力，拼出自己的冬日风景。体验纸张拓印与双色拼贴，将校园里的一小片灵感变成可以珍藏的画面。\n演示流程包含材料观察、图形组合与作品分享，无需美术基础。', coverImage: 'print', postcardId: 'pc-print', status: 'upcoming', subtitle: 'Make a mark. Keep a moment.', color: '#ebba9e' },
  { id: 'taste', title: '一口暖暖的澳门', schoolId: 'utm', category: '文化体验', startTime: '2026-12-19T14:30:00+08:00', endTime: '2026-12-19T17:00:00+08:00', location: '校园文化空间 · 演示地点', description: '从一杯热饮、一份点心开始，认识澳门文化的多种滋味。以食物为线索，聆听城市的日常故事，发现传统与新想法相遇的瞬间。\n这是一份文化体验的演示内容，页面不提供报名或实际餐饮服务。', coverImage: 'taste', postcardId: 'pc-taste', status: 'upcoming', subtitle: 'A taste of the city we call home.', color: '#e8ce70' },
  { id: 'music', title: '树下的冬日旋律', schoolId: 'um', category: '音乐现场', startTime: '2026-12-20T17:00:00+08:00', endTime: '2026-12-20T19:00:00+08:00', location: '户外草坪 · 演示地点', description: '当夕阳落在树梢，让旋律接住一天最后的光。坐在草地上，听一段轻轻的和声，与朋友分享属于校园的悠闲时刻。\n本页为音乐活动场景演示，演出安排并非学校官方资讯。', coverImage: 'music', postcardId: 'pc-music', status: 'upcoming', subtitle: 'Meet me where the music grows.', color: '#bdcbdc' },
  { id: 'light', title: '看见光的形状', schoolId: 'mpu', category: '艺术展览', startTime: '2026-12-21T10:00:00+08:00', endTime: '2026-12-21T18:00:00+08:00', location: '校园展览厅 · 演示地点', description: '透过纸、颜色与光影，观察日常空间的新表情。在缓慢的观看中，找到一个属于你的角度。\n以校园艺术展为背景的演示内容，展品与展览安排均为示意。', coverImage: 'print', postcardId: 'pc-light', status: 'upcoming', subtitle: 'Find your own point of view.', color: '#c9c3dc' },
  { id: 'city', title: '城市故事交换所', schoolId: 'utm', category: '文化分享', startTime: '2026-12-22T15:00:00+08:00', endTime: '2026-12-22T17:00:00+08:00', location: '共享交流空间 · 演示地点', description: '一张照片，一处街角，一段关于澳门的记忆。邀请你在故事之间走走，听见来自不同人的城市声音。\n此处展示文化分享活动的数字交互示例，并非正式活动公告。', coverImage: 'campus', postcardId: 'pc-city', status: 'upcoming', subtitle: 'Every corner holds a story.', color: '#d7d4b3' },
];
export const postcards: Postcard[] = events.map(event => ({ id: event.postcardId, eventId: event.id, frontImage: event.coverImage, backImage: 'letter', postcardText: `把「${event.title}」的这一刻，留在心里。愿每一次校园里的相遇，都成为值得收藏的小事。` }));
export const theme = { id: 'winter-post', name: '冬日来信', background: '#f4efdf', colorPalette: { ink: '#263e32', accent: '#d9432e', paper: '#fffaf0', mint: '#c9ddca' }, decorations: ['stamp', 'tree', 'postmark'], animationPreset: 'paper' };
export const sessionConfig = { idleMs: 90_000, warningMs: 15_000 };
export const schoolName = (id: string) => schools.find(school => school.id === id)?.name ?? '大学城';
export const dateLabel = (event: CampusEvent) => { const date = event.startTime.slice(5, 10).split('-'); return `${Number(date[0])}月${Number(date[1])}日`; };
export const timeLabel = (event: CampusEvent) => `${event.startTime.slice(11,16)} — ${event.endTime.slice(11,16)}`;
