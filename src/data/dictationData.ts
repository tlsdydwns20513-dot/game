export interface DictationQuestion {
  id: string;
  sentence: string;
  tip: string;
  distractors: string[];
  isBoss?: boolean;
}

export interface StageConfig {
  id: number;
  title: string;
  subtitle: string;
  focus: string;
  monsterName: string;
  monsterColor: string;
  accentColor: string;
  rewardCoins: number;
  questions: DictationQuestion[];
}

export interface StickerConfig {
  id: string;
  name: string;
  description: string;
  conditionText: string;
  color: string;
  iconType: 'star' | 'sprout' | 'pencil' | 'crown' | 'rabbit' | 'rainbow' | 'book' | 'shield' | 'rocket' | 'heart' | 'medal' | 'trophy';
}

export const STAGES: StageConfig[] = [
  {
    id: 1,
    title: '1단계 · 글자 숲',
    subtitle: '받침이 없는 쉬운 낱말',
    focus: '기본 자음과 모음',
    monsterName: '먹물 슬라임',
    monsterColor: '#0EA5E9',
    accentColor: '#0284C7',
    rewardCoins: 30,
    questions: [
      { id: '1-1', sentence: '아기 오리', tip: '받침이 없는 글자예요. 띄어쓰기에 주의해요.', distractors: ['우', '어', '라'] },
      { id: '1-2', sentence: '나비 날다', tip: "'나비'와 '날다' 사이를 한 칸 띄어 써요.", distractors: ['너', '바', '고'] },
      { id: '1-3', sentence: '포도 우유', tip: "둥근 입 모양 'ㅗ'와 'ㅜ'를 잘 구별해요.", distractors: ['부', '유', '도'] },
      { id: '1-4', sentence: '바다 파도', tip: "'바'와 '파'의 첫소리 소리를 잘 들어보세요.", distractors: ['마', '타', '고'] },
      { id: '1-5', sentence: '어머니 아버지', tip: "가족을 부르는 소중한 낱말이에요.", distractors: ['오', '누', '하'] },
      { id: '1-6', sentence: '무지개 구름', tip: "보스 문제! 여섯 글자를 차근차근 적어 보아요.", distractors: ['모', '그', '가'], isBoss: true }
    ]
  },
  {
    id: 2,
    title: '2단계 · 받침 마을',
    subtitle: '기초 받침 익히기',
    focus: 'ㄱ, ㄴ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ',
    monsterName: '지우개 도깨비',
    monsterColor: '#10B981',
    accentColor: '#059669',
    rewardCoins: 40,
    questions: [
      { id: '2-1', sentence: '밥을 먹어요.', tip: "문장 끝에 마침표(.)를 꼭 찍어 주세요.", distractors: ['박', '먹', '다'] },
      { id: '2-2', sentence: '손을 씻어요.', tip: "'씻'은 쌍시옷(ㅆ) 아래 시옷(ㅅ) 받침이에요.", distractors: ['실', '신', '아'] },
      { id: '2-3', sentence: '달이 밝아요.', tip: "'밝'에는 겹받침 ㄹㄱ이 들어가요.", distractors: ['박', '발', '아'] },
      { id: '2-4', sentence: '꽃이 피어요.', tip: "'꽃'의 받침은 치읓(ㅊ)이에요.", distractors: ['꼳', '곳', '피'] },
      { id: '2-5', sentence: '학교에 가요.', tip: "'학'의 ㄱ 받침을 잊지 마세요.", distractors: ['하', '교', '오'] },
      { id: '2-6', sentence: '별이 반짝여요.', tip: "보스 문제! '반짝'의 받침과 쌍지읒(ㅉ)을 기억해요.", distractors: ['벌', '작', '어'], isBoss: true }
    ]
  },
  {
    id: 3,
    title: '3단계 · 소리 다리',
    subtitle: '소리 나는 대로와 다르게 적기',
    focus: '연음과 바른 표기',
    monsterName: '엉뚱 박사',
    monsterColor: '#6366F1',
    accentColor: '#4F46E5',
    rewardCoins: 50,
    questions: [
      { id: '3-1', sentence: '음악이 좋아요.', tip: "'으마기'라고 들리지만 '음악이'라고 써요.", distractors: ['마', '조', '아'] },
      { id: '3-2', sentence: '동생과 놀아요.', tip: "'노라요'라고 들려도 '놀아요'가 바른 글자예요.", distractors: ['노', '라', '랑'] },
      { id: '3-3', sentence: '우산을 써요.', tip: "'써요'는 쌍시옷(ㅆ)을 사용해요.", distractors: ['서', '산', '를'] },
      { id: '3-4', sentence: '친구가 웃어요.', tip: "'우서요'로 들리지만 받침 ㅅ을 살려 '웃어요'로 써요.", distractors: ['우', '서', '었'] },
      { id: '3-5', sentence: '책을 읽어요.', tip: "'일거요'로 소리 나지만 '읽어요'라고 적어요.", distractors: ['일', '거', '에'] },
      { id: '3-6', sentence: '선생님 안녕하세요.', tip: "보스 문제! 바른 인사말을 정확하게 적어 보아요.", distractors: ['선', '녕', '하'], isBoss: true }
    ]
  },
  {
    id: 4,
    title: '4단계 · 쌍둥이 언덕',
    subtitle: '쌍자음과 거센소리',
    focus: 'ㄲ, ㄸ, ㅃ, ㅆ, ㅉ',
    monsterName: '쌍둥이 유령',
    monsterColor: '#EC4899',
    accentColor: '#DB2777',
    rewardCoins: 60,
    questions: [
      { id: '4-1', sentence: '토끼가 뛰어요.', tip: "'끼'와 '뛰'에 쌍자음이 들어가요.", distractors: ['기', '뒤', '어'] },
      { id: '4-2', sentence: '코끼리 코가 길어요.', tip: "'코끼리'의 둘째 글자는 쌍기역(ㄲ)이에요.", distractors: ['기', '길', '오'] },
      { id: '4-3', sentence: '쓰레기를 주워요.', tip: "'쓰'는 쌍시옷, '주워요'는 ㅜ+ㅓ(ㅝ)예요.", distractors: ['스', '주', '어'] },
      { id: '4-4', sentence: '짜장면이 맛있어요.', tip: "'맛있어요'의 '있'은 ㅆ 받침이에요.", distractors: ['자', '이', '서'] },
      { id: '4-5', sentence: '치타가 빨리 달려요.', tip: "'빨리'는 ㅃ과 ㄹ 받침이 이어져요.", distractors: ['발', '달', '리'] },
      { id: '4-6', sentence: '떡볶이가 정말 매워요.', tip: "보스 문제! '볶'에는 쌍기역(ㄲ) 받침이 들어가요.", distractors: ['덕', '복', '매'], isBoss: true }
    ]
  },
  {
    id: 5,
    title: '5단계 · 모음 바다',
    subtitle: '헷갈리는 모음 구별하기',
    focus: 'ㅐ/ㅔ, ㅘ/ㅝ, ㅢ',
    monsterName: '모음 문어',
    monsterColor: '#F59E0B',
    accentColor: '#D97706',
    rewardCoins: 70,
    questions: [
      { id: '5-1', sentence: '개미가 지나가요.', tip: "곤충 '개미'는 아이 'ㅐ'를 써요.", distractors: ['게', '메', '지'] },
      { id: '5-2', sentence: '게가 옆으로 걸어요.', tip: "바다에 사는 '게'는 어이 'ㅔ'를 써요.", distractors: ['개', '여', '프'] },
      { id: '5-3', sentence: '과자가 달콤해요.', tip: "'과'는 ㅗ+ㅏ(ㅘ), '해요'는 'ㅐ'예요.", distractors: ['가', '헤', '요'] },
      { id: '5-4', sentence: '의자에 바르게 앉아요.', tip: "'의'는 ㅡ+ㅣ, '앉'은 ㄴㅈ 받침이에요.", distractors: ['이', '안', '자'] },
      { id: '5-5', sentence: '내일이 소풍날이에요.', tip: "'내일'은 'ㅐ', '이에요'는 'ㅔ'예요.", distractors: ['네', '애', '이'] },
      { id: '5-6', sentence: '시계가 똑딱거려요.', tip: "보스 문제! '계'는 ㅖ, '거려요'는 ㅕ예요.", distractors: ['게', '개', '려'], isBoss: true }
    ]
  },
  {
    id: 6,
    title: '6단계 · 겹받침 성',
    subtitle: '어려운 겹받침 정복하기',
    focus: 'ㄺ, ㄻ, ㄼ, ㄵ, ㅄ',
    monsterName: '겹받침 기사',
    monsterColor: '#8B5CF6',
    accentColor: '#7C3AED',
    rewardCoins: 80,
    questions: [
      { id: '6-1', sentence: '교실이 넓어요.', tip: "'넓'은 ㄹㅂ 겹받침을 써요.", distractors: ['널', '어', '보'] },
      { id: '6-2', sentence: '하늘이 맑아요.', tip: "'맑'은 ㄹㄱ 겹받침이에요.", distractors: ['말', '막', '가'] },
      { id: '6-3', sentence: '여덟 시에 만나요.', tip: "'덟'은 ㄹㅂ 겹받침을 쓰는 숫자예요.", distractors: ['덜', '덥', '만'] },
      { id: '6-4', sentence: '삶은 달걀을 먹어요.', tip: "'삶'에는 ㄹㅁ 겹받침이 들어가요.", distractors: ['삼', '살', '먹'] },
      { id: '6-5', sentence: '닭이 꼬끼오 울어요.', tip: "'닭'은 ㄹㄱ 겹받침이에요.", distractors: ['닥', '달', '기'] },
      { id: '6-6', sentence: '값이 아주 싸요.', tip: "보스 문제! '값'에는 ㅂㅅ 겹받침이 들어가요.", distractors: ['갑', '갓', '사'], isBoss: true }
    ]
  },
  {
    id: 7,
    title: '7단계 · 띄어쓰기 공원',
    subtitle: '문장 부호와 띄어쓰기',
    focus: '온점(.), 물음표(?), 느낌표(!)',
    monsterName: '깜빡 두더지',
    monsterColor: '#14B8A6',
    accentColor: '#0D9488',
    rewardCoins: 90,
    questions: [
      { id: '7-1', sentence: '우리 같이 놀자!', tip: "신나는 마음은 느낌표(!)로 나타내요.", distractors: ['가', '치', '.'] },
      { id: '7-2', sentence: '이름이 무엇인가요?', tip: "물어보는 문장 끝에는 물음표(?)를 써요.", distractors: ['무', '어', '!'] },
      { id: '7-3', sentence: '오늘 날씨가 참 좋아요.', tip: "설명하는 문장은 마침표(.)로 끝나요.", distractors: ['날', '시', '조'] },
      { id: '7-4', sentence: '조심해서 건너요.', tip: "'조심해서'와 '건너요' 사이를 띄어요.", distractors: ['건', '너', '해'] },
      { id: '7-5', sentence: '사랑해요, 고마워요.', tip: "쉼표(,) 다음에도 한 칸 띄어 써요.", distractors: ['고', '마', '워'] },
      { id: '7-6', sentence: '내일 다시 만나요!', tip: "보스 문제! 띄어쓰기와 느낌표를 정확히 써요.", distractors: ['네', '일', '.'], isBoss: true }
    ]
  },
  {
    id: 8,
    title: '8단계 · 받아쓰기 왕궁',
    subtitle: '1학년 급수왕 최종 도전',
    focus: '모든 규칙 종합 실전',
    monsterName: '받아쓰기 대왕',
    monsterColor: '#E11D48',
    accentColor: '#BE123C',
    rewardCoins: 120,
    questions: [
      { id: '8-1', sentence: '친구와 사이좋게 지내요.', tip: "'좋게'는 ㅎ 받침, '지내요'는 ㅐ예요.", distractors: ['조', '게', '네'] },
      { id: '8-2', sentence: '도서관에서 조용히 읽어요.', tip: "'읽어요'의 겹받침 ㄹㄱ을 잊지 마세요.", distractors: ['일', '거', '히'] },
      { id: '8-3', sentence: '맑은 하늘에 무지개가 떴어요!', tip: "'떴어요'는 쌍디귿(ㄸ)과 쌍시옷(ㅆ)이 있어요.", distractors: ['말', '떠', '서'] },
      { id: '8-4', sentence: '아침에 일찍 세수를 해요.', tip: "'일찍'의 ㅉ과 ㄱ 받침에 주의해요.", distractors: ['직', '세', '해'] },
      { id: '8-5', sentence: '할아버지 댁에 사과가 열렸어요.', tip: "'댁'은 ㅐ, '열렸어요'는 ㅆ 받침이에요.", distractors: ['덱', '려', '서'] },
      { id: '8-6', sentence: '내가 그린 그림이 최고예요!', tip: "최종 보스! 마지막까지 집중해서 최고예요!", distractors: ['네', '예', '.'], isBoss: true }
    ]
  }
];

export const STICKERS: StickerConfig[] = [
  { id: 'first_clear', name: '첫 모험 새싹', description: '첫 번째 받아쓰기 스테이지를 깼어요!', conditionText: '아무 스테이지 1개 완료', color: '#10B981', iconType: 'sprout' },
  { id: 'star_3', name: '완벽한 연필', description: '실수 없이 별 3개로 스테이지를 깼어요!', conditionText: '별 3개 획득 1회', color: '#2563EB', iconType: 'pencil' },
  { id: 'combo_5', name: '불꽃 콤보', description: '5문제 연속으로 정답을 맞혔어요!', conditionText: '5연속 콤보 달성', color: '#F59E0B', iconType: 'rocket' },
  { id: 'stage_2', name: '받침 탐험가', description: '받침 마을의 지우개 도깨비를 이겼어요.', conditionText: '2단계 완료', color: '#059669', iconType: 'shield' },
  { id: 'stage_4', name: '쌍자음 히어로', description: '쌍둥이 언덕을 무사히 통과했어요.', conditionText: '4단계 완료', color: '#EC4899', iconType: 'rabbit' },
  { id: 'stage_5', name: '모음 항해사', description: '헷갈리는 모음 바다를 건넜어요!', conditionText: '5단계 완료', color: '#D97706', iconType: 'rainbow' },
  { id: 'stage_6', name: '겹받침 박사', description: '어려운 겹받침 문제들을 척척 풀어냈어요.', conditionText: '6단계 완료', color: '#7C3AED', iconType: 'book' },
  { id: 'stage_8', name: '1학년 급수왕', description: '받아쓰기 왕궁의 대왕을 물리쳤어요!', conditionText: '8단계 최종 보스 완료', color: '#E11D48', iconType: 'crown' },
  { id: 'stars_12', name: '별빛 수집가', description: '별을 12개 이상 모았어요.', conditionText: '누적 별 12개 달성', color: '#0EA5E9', iconType: 'star' },
  { id: 'stars_24', name: '전설의 올스타', description: '모든 스테이지에서 별 3개를 받았어요!', conditionText: '전체 별 24개 달성', color: '#F59E0B', iconType: 'trophy' },
  { id: 'review_hero', name: '복습 천사', description: '오답 노트에서 틀린 문제를 모두 고쳤어요!', conditionText: '오답 노트 1회 완료', color: '#14B8A6', iconType: 'heart' },
  { id: 'rich_coins', name: '알뜰 저축왕', description: '별빛 코인을 200개 이상 모았어요.', conditionText: '코인 200개 누적', color: '#6366F1', iconType: 'medal' }
];
