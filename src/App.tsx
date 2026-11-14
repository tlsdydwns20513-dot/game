/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Download,
  Ear,
  Eye,
  Lightbulb,
  RotateCcw,
  Delete,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  ArrowLeft,
  ArrowRight,
  Search,
  Heart,
  Swords,
} from 'lucide-react';
import { STAGES, STICKERS, DictationQuestion, StageConfig } from './data/dictationData';
import { audioEngine, speakKorean } from './utils/audioEngine';
import { CompanionHeroSvg, MonsterSvg, StickerBadgeSvg } from './components/GameIllustrations';
import { FireworksOverlay } from './components/FireworksOverlay';

type Screen = 'MAP' | 'PLAYING' | 'RESULT' | 'STICKERS' | 'REVIEW';
type InputMode = 'BLOCK' | 'TYPE';

interface SaveData {
  coins: number;
  stars: Record<number, number>;
  stickers: string[];
  wrongIds: string[];
  unlockAll: boolean;
  bestCombo: number;
}

interface SessionState {
  isReview: boolean;
  stage: StageConfig;
  questions: DictationQuestion[];
  idx: number;
  hearts: number;
  maxHearts: number;
  combo: number;
  maxCombo: number;
  mistakes: number;
  earnedCoins: number;
  score: number;
  answer: string;
  tiles: string[];
  usedTileIdxs: number[];
  feedback: { ok: boolean; expected: string; actual: string } | null;
  heroMood: 'idle' | 'attack' | 'hurt' | 'happy';
  monsterHit: boolean;
  beamActive: boolean;
  showTip: boolean;
  peekVisible: boolean;
  newlyUnlockedStickers: string[];
}

const STORAGE_KEY = 'kr_dictation_g1_save_v1';

function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as SaveData;
    }
  } catch {
    // ignore storage errors
  }
  return {
    coins: 50,
    stars: {},
    stickers: [],
    wrongIds: [],
    unlockAll: false,
    bestCombo: 0,
  };
}

function buildShuffledTiles(q: DictationQuestion): string[] {
  const pool = [...Array.from(q.sentence), ...(q.distractors || [])];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('MAP');
  const [inputMode, setInputMode] = useState<InputMode>('BLOCK');
  const [muted, setMuted] = useState(false);
  const [save, setSave] = useState<SaveData>(() => loadSaveData());
  const [session, setSession] = useState<SessionState | null>(null);
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [fireworksTrigger, setFireworksTrigger] = useState(0);

  const peekTimerRef = useRef<number | null>(null);
  const typeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      // ignore storage errors
    }
  }, [save]);

  useEffect(() => {
    return () => {
      if (peekTimerRef.current) window.clearTimeout(peekTimerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (screen === 'PLAYING' && inputMode === 'TYPE' && !session?.feedback) {
      typeInputRef.current?.focus();
    }
  }, [screen, inputMode, session?.idx, session?.feedback]);

  const totalStars = Object.values(save.stars).reduce((acc, v) => acc + v, 0);
  const clearedStagesCount = Object.keys(save.stars).length;

  const navigate = (nextScreen: Screen) => {
    audioEngine.playPop();
    if (nextScreen !== 'PLAYING' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setScreen(nextScreen);
  };

  const handleToggleMute = () => {
    const next = !muted;
    audioEngine.muted = next;
    setMuted(next);
    if (!next) audioEngine.playPop();
  };

  const handleDownloadSingleHtml = async () => {
    audioEngine.playPop();
    setDownloadingHtml(true);
    try {
      const res = await fetch('/badasseugi-1st-grade.html');
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '초등학교1학년_받아쓰기_게임.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: nothing broken
    } finally {
      setDownloadingHtml(false);
    }
  };

  const computeNewStickers = (candidateSave: SaveData, reviewCleared = false): string[] => {
    const earned = new Set(candidateSave.stickers);
    const starsSum = Object.values(candidateSave.stars).reduce((a, b) => a + b, 0);
    const unlockedNow: string[] = [];

    const check = (id: string, condition: boolean) => {
      if (condition && !earned.has(id)) {
        earned.add(id);
        unlockedNow.push(id);
      }
    };

    check('first_clear', Object.keys(candidateSave.stars).length >= 1);
    check('star_3', Object.values(candidateSave.stars).some((v) => v === 3));
    check('combo_5', candidateSave.bestCombo >= 5);
    check('stage_2', (candidateSave.stars[2] || 0) > 0);
    check('stage_4', (candidateSave.stars[4] || 0) > 0);
    check('stage_5', (candidateSave.stars[5] || 0) > 0);
    check('stage_6', (candidateSave.stars[6] || 0) > 0);
    check('stage_8', (candidateSave.stars[8] || 0) > 0);
    check('stars_12', starsSum >= 12);
    check('stars_24', starsSum >= 24);
    check('review_hero', reviewCleared);
    check('rich_coins', candidateSave.coins >= 200);

    return unlockedNow;
  };

  const startStage = (stageId: number, isReview = false) => {
    audioEngine.playPop();
    let questions: DictationQuestion[] = [];
    let stageInfo: StageConfig;

    if (isReview) {
      const allQ = STAGES.flatMap((s) => s.questions);
      questions = allQ.filter((q) => save.wrongIds.includes(q.id));
      if (questions.length === 0) return;
      stageInfo = {
        id: 0,
        title: '오답 물리치기 복습',
        subtitle: '틀렸던 문장을 다시 정복해요',
        focus: '오답 집중 훈련',
        monsterName: '실수 도깨비',
        monsterColor: '#F59E0B',
        accentColor: '#D97706',
        rewardCoins: questions.length * 10,
        questions,
      };
    } else {
      const found = STAGES.find((s) => s.id === stageId);
      if (!found) return;
      stageInfo = found;
      questions = found.questions;
    }

    const firstQ = questions[0];
    setSession({
      isReview,
      stage: stageInfo,
      questions,
      idx: 0,
      hearts: 3,
      maxHearts: 3,
      combo: 0,
      maxCombo: 0,
      mistakes: 0,
      earnedCoins: 0,
      score: 0,
      answer: '',
      tiles: buildShuffledTiles(firstQ),
      usedTileIdxs: [],
      feedback: null,
      heroMood: 'idle',
      monsterHit: false,
      beamActive: false,
      showTip: false,
      peekVisible: false,
      newlyUnlockedStickers: [],
    });
    setScreen('PLAYING');
    window.setTimeout(() => {
      speakKorean(firstQ.sentence, 0.88);
    }, 250);
  };

  const currentQuestion = session ? session.questions[session.idx] : null;

  const handlePickTile = (tileIdx: number) => {
    if (!session || session.feedback?.ok || session.usedTileIdxs.includes(tileIdx)) return;
    audioEngine.playPop();
    const nextUsed = [...session.usedTileIdxs, tileIdx];
    const nextAnswer = nextUsed.map((i) => session.tiles[i]).join('');
    setSession({
      ...session,
      usedTileIdxs: nextUsed,
      answer: nextAnswer,
      feedback: null,
    });
  };

  const handleBackspaceTile = () => {
    if (!session || !session.usedTileIdxs.length || session.feedback?.ok) return;
    audioEngine.playPop();
    const nextUsed = session.usedTileIdxs.slice(0, -1);
    setSession({
      ...session,
      usedTileIdxs: nextUsed,
      answer: nextUsed.map((i) => session.tiles[i]).join(''),
      feedback: null,
    });
  };

  const handleClearAnswer = () => {
    if (!session || session.feedback?.ok) return;
    audioEngine.playPop();
    setSession({
      ...session,
      usedTileIdxs: [],
      answer: '',
      feedback: null,
    });
  };

  const handlePeekSentence = () => {
    if (!session) return;
    audioEngine.playPop();
    if (peekTimerRef.current) window.clearTimeout(peekTimerRef.current);
    setSession((prev) => (prev ? { ...prev, peekVisible: true } : prev));
    peekTimerRef.current = window.setTimeout(() => {
      setSession((prev) => (prev ? { ...prev, peekVisible: false } : prev));
    }, 2800);
  };

  const handleUseItem = (itemType: 'SLOW' | 'HINT' | 'HEAL') => {
    if (!session || !currentQuestion) return;

    if (itemType === 'SLOW') {
      if (save.coins < 5) return;
      setSave((prev) => ({ ...prev, coins: prev.coins - 5 }));
      audioEngine.playCoin();
      speakKorean(currentQuestion.sentence, 0.6);
      return;
    }

    if (itemType === 'HINT') {
      if (save.coins < 10 || session.feedback?.ok) return;
      const targetChars = Array.from(currentQuestion.sentence);
      if (session.answer.length >= targetChars.length) return;
      const nextChar = targetChars[session.answer.length];
      setSave((prev) => ({ ...prev, coins: prev.coins - 10 }));
      audioEngine.playCoin();

      if (inputMode === 'BLOCK') {
        const availIdx = session.tiles.findIndex(
          (t, i) => t === nextChar && !session.usedTileIdxs.includes(i)
        );
        if (availIdx !== -1) {
          const nextUsed = [...session.usedTileIdxs, availIdx];
          setSession({
            ...session,
            usedTileIdxs: nextUsed,
            answer: nextUsed.map((i) => session.tiles[i]).join(''),
          });
        }
      } else {
        setSession({
          ...session,
          answer: session.answer + nextChar,
        });
      }
      return;
    }

    if (itemType === 'HEAL') {
      if (save.coins < 15 || session.hearts >= session.maxHearts) return;
      setSave((prev) => ({ ...prev, coins: prev.coins - 15 }));
      audioEngine.playCoin();
      setSession({
        ...session,
        hearts: session.hearts + 1,
      });
    }
  };

  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session || !currentQuestion || session.feedback?.ok) return;

    const actual = session.answer.trim().replace(/\s+/g, ' ');
    const expected = currentQuestion.sentence;
    if (!actual) return;

    if (actual === expected) {
      const nextCombo = session.combo + 1;
      const nextMaxCombo = Math.max(session.maxCombo, nextCombo);
      const fever = nextCombo >= 3 ? 2 : 1;
      const coinGain = (currentQuestion.isBoss ? 15 : 8) * fever;

      if (nextCombo >= 3) audioEngine.playCombo();
      else audioEngine.playCorrect();

      const updatedSave: SaveData = {
        ...save,
        coins: save.coins + coinGain,
        bestCombo: Math.max(save.bestCombo, nextCombo),
        wrongIds: session.isReview
          ? save.wrongIds.filter((id) => id !== currentQuestion.id)
          : save.wrongIds,
      };
      const newStickers = computeNewStickers(updatedSave, false);
      if (newStickers.length > 0) {
        updatedSave.stickers = [...updatedSave.stickers, ...newStickers];
      }
      setSave(updatedSave);

      setSession({
        ...session,
        combo: nextCombo,
        maxCombo: nextMaxCombo,
        earnedCoins: session.earnedCoins + coinGain,
        score: session.score + 100 * fever,
        heroMood: 'attack',
        monsterHit: true,
        beamActive: true,
        feedback: { ok: true, expected, actual },
        newlyUnlockedStickers: [...session.newlyUnlockedStickers, ...newStickers],
      });

      window.setTimeout(() => {
        setSession((prev) => (prev ? { ...prev, beamActive: false, monsterHit: false } : prev));
      }, 450);
    } else {
      audioEngine.playWrong();
      const nextHearts = Math.max(0, session.hearts - 1);
      setSave((prev) => ({
        ...prev,
        wrongIds: prev.wrongIds.includes(currentQuestion.id)
          ? prev.wrongIds
          : [...prev.wrongIds, currentQuestion.id],
      }));
      setSession({
        ...session,
        combo: 0,
        mistakes: session.mistakes + 1,
        hearts: nextHearts,
        heroMood: 'hurt',
        feedback: { ok: false, expected, actual },
      });
    }
  };

  const handleRetryCurrent = () => {
    if (!session || !currentQuestion) return;
    audioEngine.playPop();
    setSession({
      ...session,
      answer: '',
      tiles: buildShuffledTiles(currentQuestion),
      usedTileIdxs: [],
      feedback: null,
      heroMood: 'idle',
    });
    window.setTimeout(() => speakKorean(currentQuestion.sentence, 0.88), 180);
  };

  const handleNextQuestion = () => {
    if (!session) return;
    if (session.hearts <= 0) {
      setScreen('RESULT');
      return;
    }

    if (session.idx + 1 >= session.questions.length) {
      audioEngine.playVictory();
      let updatedSave = { ...save };
      let addedCoins = 0;

      if (!session.isReview) {
        const starsEarned = session.mistakes === 0 ? 3 : session.mistakes <= 2 ? 2 : 1;
        const prevStar = updatedSave.stars[session.stage.id] || 0;
        addedCoins = session.stage.rewardCoins;
        updatedSave = {
          ...updatedSave,
          stars: {
            ...updatedSave.stars,
            [session.stage.id]: Math.max(prevStar, starsEarned),
          },
          coins: updatedSave.coins + addedCoins,
        };
      }

      const newStickers = computeNewStickers(updatedSave, session.isReview);
      if (newStickers.length > 0) {
        updatedSave.stickers = [...updatedSave.stickers, ...newStickers];
      }
      setSave(updatedSave);
      setSession({
        ...session,
        earnedCoins: session.earnedCoins + addedCoins,
        newlyUnlockedStickers: [...session.newlyUnlockedStickers, ...newStickers],
      });
      setScreen('RESULT');
      return;
    }

    const nextIdx = session.idx + 1;
    const nextQ = session.questions[nextIdx];
    setSession({
      ...session,
      idx: nextIdx,
      answer: '',
      tiles: buildShuffledTiles(nextQ),
      usedTileIdxs: [],
      feedback: null,
      heroMood: 'idle',
      monsterHit: false,
      showTip: false,
      peekVisible: false,
    });
    window.setTimeout(() => speakKorean(nextQ.sentence, 0.88), 220);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F7FC] text-[#0F172A]">
      <FireworksOverlay
        active={screen === 'RESULT' && Boolean(session && session.hearts > 0)}
        burstTrigger={fireworksTrigger}
      />
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#DCE6F2]">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => navigate('MAP')}
            className="font-display text-xl tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#2563EB] transition-colors"
          >
            한글 받아쓰기 모험
          </button>

          <nav className="hidden md:flex items-center gap-6" aria-label="주 메뉴">
            <button
              type="button"
              onClick={() => navigate('MAP')}
              className={`py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                screen === 'MAP'
                  ? 'text-[#2563EB] border-[#2563EB]'
                  : 'text-[#475569] border-transparent hover:text-[#0F172A]'
              }`}
            >
              모험 지도
            </button>
            <button
              type="button"
              onClick={() => navigate('REVIEW')}
              className={`py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                screen === 'REVIEW'
                  ? 'text-[#2563EB] border-[#2563EB]'
                  : 'text-[#475569] border-transparent hover:text-[#0F172A]'
              }`}
            >
              오답 노트 <span className="font-mono-num">({save.wrongIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('STICKERS')}
              className={`py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                screen === 'STICKERS'
                  ? 'text-[#2563EB] border-[#2563EB]'
                  : 'text-[#475569] border-transparent hover:text-[#0F172A]'
              }`}
            >
              스티커북 <span className="font-mono-num">({save.stickers.length}/12)</span>
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? '소리 켜기' : '소리 끄기'}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 text-sm font-semibold text-[#334155] bg-white border border-[#DCE6F2] rounded-xl hover:bg-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-[#E11D48]" /> : <Volume2 className="w-4 h-4 text-[#2563EB]" />}
              <span className="hidden sm:inline">{muted ? '음소거' : '효과음'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSingleHtml}
              disabled={downloadingHtml}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>HTML 단일파일 저장</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Row */}
        <div className="flex md:hidden items-center justify-around border-t border-[#DCE6F2] px-2 py-1 bg-white">
          <button
            type="button"
            onClick={() => navigate('MAP')}
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap ${
              screen === 'MAP' ? 'text-[#2563EB]' : 'text-[#475569]'
            }`}
          >
            모험 지도
          </button>
          <button
            type="button"
            onClick={() => navigate('REVIEW')}
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap ${
              screen === 'REVIEW' ? 'text-[#2563EB]' : 'text-[#475569]'
            }`}
          >
            오답 노트 ({save.wrongIds.length})
          </button>
          <button
            type="button"
            onClick={() => navigate('STICKERS')}
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap ${
              screen === 'STICKERS' ? 'text-[#2563EB]' : 'text-[#475569]'
            }`}
          >
            스티커북 ({save.stickers.length}/12)
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-7">
        {/* SCREEN: ADVENTURE MAP */}
        {screen === 'MAP' && (
          <div className="space-y-7">
            <section className="bg-white border border-[#DCE6F2] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="animate-float-slow shrink-0">
                  <CompanionHeroSvg mood="happy" className="w-24 h-24 sm:w-28 sm:h-28" />
                </div>
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] leading-snug text-balance">
                    달콩이와 함께하는 1학년 받아쓰기 모험
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base text-[#475569]">
                    <span>
                      모은 별 <strong className="font-mono-num text-[#D97706]">{totalStars} / 24</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      별빛 코인 <strong className="font-mono-num text-[#2563EB]">{save.coins}개</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      완료한 단계 <strong className="font-mono-num text-[#0F172A]">{clearedStagesCount} / 8</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      최고 콤보 <strong className="font-mono-num text-[#059669]">{save.bestCombo}연속</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-[#475569] whitespace-nowrap">쓰기 방법</span>
                  <div className="inline-flex p-1 bg-[#E2E8F0] rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playPop();
                        setInputMode('BLOCK');
                      }}
                      className={`px-3.5 py-2 min-h-[40px] rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        inputMode === 'BLOCK'
                          ? 'bg-white text-[#0F172A] shadow-sm'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      글자 블록 맞추기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playPop();
                        setInputMode('TYPE');
                      }}
                      className={`px-3.5 py-2 min-h-[40px] rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        inputMode === 'TYPE'
                          ? 'bg-white text-[#0F172A] shadow-sm'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      직접 키보드 쓰기
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playPop();
                    setSave((prev) => ({ ...prev, unlockAll: !prev.unlockAll }));
                  }}
                  className="text-xs font-semibold text-[#475569] hover:text-[#2563EB] underline underline-offset-4 py-1 cursor-pointer whitespace-nowrap"
                >
                  {save.unlockAll ? '단계 순서대로 잠금 적용하기' : '선생님·부모님용: 전체 8단계 바로 열기'}
                </button>
              </div>
            </section>

            <section aria-label="받아쓰기 모험 단계">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STAGES.map((stage) => {
                  const prevCleared = stage.id === 1 || (save.stars[stage.id - 1] || 0) > 0;
                  const unlocked = save.unlockAll || prevCleared;
                  const earnedStars = save.stars[stage.id] || 0;

                  return (
                    <article
                      key={stage.id}
                      className={`bg-white border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-transform duration-150 ${
                        unlocked
                          ? 'border-[#DCE6F2] hover:-translate-y-0.5 hover:border-[#93C5FD]'
                          : 'border-[#E2E8F0] bg-[#F8FAFC] opacity-70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold tracking-tight" style={{ color: stage.accentColor }}>
                            {stage.focus}
                          </span>
                          <span className="font-mono-num text-base text-[#F59E0B] tracking-widest" aria-label={`별 ${earnedStars}개`}>
                            {'★'.repeat(earnedStars)}
                            {'☆'.repeat(3 - earnedStars)}
                          </span>
                        </div>
                        <h2 className="font-display text-xl text-[#0F172A] mb-1">{stage.title}</h2>
                        <p className="text-sm text-[#475569]">{stage.subtitle}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MonsterSvg stageId={stage.id} color={stage.monsterColor} state="idle" className="w-11 h-11 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-[#64748B]">등장 몬스터</div>
                            <div className="text-sm font-semibold text-[#0F172A] truncate">{stage.monsterName}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => startStage(stage.id)}
                          className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            unlocked
                              ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer'
                              : 'bg-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                          }`}
                        >
                          {unlocked ? (
                            <>
                              <Swords className="w-4 h-4" />
                              <span>도전하기</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>잠김</span>
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* SCREEN: PLAYING ARENA */}
        {screen === 'PLAYING' && session && currentQuestion && (
          <div className="space-y-5">
            {/* Arena Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('MAP')}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 bg-white border border-[#DCE6F2] rounded-xl text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>지도로</span>
                </button>
                <div>
                  <h1 className="font-display text-xl sm:text-2xl text-[#0F172A] leading-tight">
                    {session.stage.title}
                  </h1>
                  <div className="text-xs sm:text-sm text-[#475569]">
                    {session.stage.subtitle}
                    {currentQuestion.isBoss ? ' · 마지막 보스 문제' : ''}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#334155]">
                <span>
                  문제 <strong className="font-mono-num text-[#0F172A]">{session.idx + 1} / {session.questions.length}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  점수 <strong className="font-mono-num text-[#2563EB]">{session.score}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  코인 <strong className="font-mono-num text-[#D97706]">{save.coins}개</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className={session.combo >= 3 ? 'text-[#D97706]' : 'text-[#334155]'}>
                  콤보 <strong className="font-mono-num">{session.combo}</strong>
                  {session.combo >= 3 ? ' (피버 2배!)' : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Battle Stage */}
              <section className="lg:col-span-4 bg-gradient-to-b from-[#EFF6FF] to-white border border-[#DCE6F2] rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="flex items-center gap-1.5 text-[#0F172A]">
                    <Heart className="w-4 h-4 text-[#E11D48] fill-[#E11D48]" />
                    <span>달콩이</span>
                    <span className="font-mono-num text-[#E11D48]">{session.hearts}/{session.maxHearts}</span>
                  </span>
                  <span className="text-[#0F172A]">
                    {session.stage.monsterName}{' '}
                    <span className="font-mono-num" style={{ color: session.stage.accentColor }}>
                      {session.questions.length - session.idx - (session.feedback?.ok ? 1 : 0)}/{session.questions.length}
                    </span>
                  </span>
                </div>

                <div className="relative flex items-center justify-between gap-2 py-3 px-2 bg-white/75 rounded-xl border border-[#DCE6F2]">
                  <div className={`flex-1 flex flex-col items-center ${session.heroMood === 'hurt' ? 'animate-shake-gentle' : ''}`}>
                    <CompanionHeroSvg mood={session.heroMood} className="w-24 h-24" />
                    <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-[#10B981] rounded-full transition-all duration-200"
                        style={{ width: `${Math.round((session.hearts / session.maxHearts) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="relative flex flex-col items-center justify-center w-12 shrink-0">
                    {session.beamActive ? (
                      <div className="animate-beam-strike text-[#F59E0B]">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    ) : (
                      <span className="font-display text-lg text-[#64748B]">VS</span>
                    )}
                  </div>

                  <div className={`flex-1 flex flex-col items-center ${session.monsterHit ? 'animate-hit-flash' : ''}`}>
                    <MonsterSvg
                      stageId={session.stage.id || 1}
                      color={session.stage.monsterColor}
                      state={session.monsterHit ? 'hit' : 'idle'}
                      className="w-24 h-24"
                    />
                    <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${Math.round(
                            ((session.questions.length - session.idx - (session.feedback?.ok ? 1 : 0)) /
                              session.questions.length) *
                              100
                          )}%`,
                          backgroundColor: session.stage.monsterColor,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#DCE6F2] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#2563EB] flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      선생님 꿀팁
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playPop();
                        setSession({ ...session, showTip: !session.showTip });
                      }}
                      className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] underline cursor-pointer"
                    >
                      {session.showTip ? '숨기기' : '힌트 보기'}
                    </button>
                  </div>
                  <p className="text-sm text-[#334155] leading-relaxed">
                    {session.showTip
                      ? currentQuestion.tip
                      : '받침이나 띄어쓰기가 헷갈릴 때 "힌트 보기"를 눌러 도움을 받아보세요.'}
                  </p>
                </div>

                {/* Input mode switcher during play */}
                <div className="flex items-center justify-between pt-2 border-t border-[#DCE6F2]">
                  <span className="text-xs font-semibold text-[#475569]">입력 방식</span>
                  <div className="inline-flex p-1 bg-[#E2E8F0] rounded-lg gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playPop();
                        setInputMode('BLOCK');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        inputMode === 'BLOCK' ? 'bg-white text-[#0F172A]' : 'text-[#475569]'
                      }`}
                    >
                      블록 맞추기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playPop();
                        setInputMode('TYPE');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        inputMode === 'TYPE' ? 'bg-white text-[#0F172A]' : 'text-[#475569]'
                      }`}
                    >
                      직접 쓰기
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Dictation Notebook Card */}
              <section className="lg:col-span-8 bg-white border border-[#DCE6F2] rounded-2xl p-6 space-y-5">
                {/* Audio & Peek Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playPop();
                        speakKorean(currentQuestion.sentence, 0.88);
                      }}
                      className="inline-flex items-center gap-2 min-h-[46px] px-5 py-2.5 bg-[#2563EB] text-white rounded-xl font-semibold text-base hover:bg-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>문제 소리 듣기</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playPop();
                        speakKorean(currentQuestion.sentence, 0.6);
                      }}
                      className="inline-flex items-center gap-2 min-h-[46px] px-4 py-2.5 bg-white border border-[#DCE6F2] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#F8FAFC] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Ear className="w-4 h-4 text-[#0EA5E9]" />
                      <span>천천히 듣기</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePeekSentence}
                      className="inline-flex items-center gap-2 min-h-[46px] px-4 py-2.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-xl font-semibold text-sm hover:bg-[#FDE68A] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" />
                      <span>3초 눈으로 보기</span>
                    </button>
                  </div>
                </div>

                {session.peekVisible && (
                  <div className="animate-pop-in bg-[#FEF3C7] border border-[#FDE68A] rounded-xl py-3.5 px-4 text-center">
                    <div className="text-xs font-semibold text-[#B45309] mb-1">눈으로 기억해 보아요 (잠깐 보여요)</div>
                    <div className="font-display text-2xl sm:text-3xl text-[#78350F]">{currentQuestion.sentence}</div>
                  </div>
                )}

                {/* Notebook Character Grid */}
                <div
                  className="bg-[#F8FAFC] border border-[#DCE6F2] rounded-2xl p-5 flex flex-wrap items-center justify-center gap-2 min-h-[100px]"
                  aria-label="받아쓰기 공책 칸"
                >
                  {Array.from(currentQuestion.sentence).map((targetCh, idx) => {
                    const answerChars = Array.from(session.answer);
                    const typedCh = answerChars[idx];
                    const isSpace = targetCh === ' ';
                    const hasFeedback = session.feedback !== null;
                    const isMatch = typedCh === targetCh;

                    let slotClass = 'border-[#CBD5E1] bg-white text-[#0F172A]';
                    if (isSpace) {
                      slotClass = 'border-dashed border-[#93C5FD] bg-[#EFF6FF] text-[#64748B] w-7 text-xs';
                    }
                    if (hasFeedback) {
                      slotClass = isMatch
                        ? 'border-[#10B981] bg-[#ECFDF5] text-[#065F46]'
                        : 'border-[#E11D48] bg-[#FFF1F2] text-[#9F1239]';
                    } else if (typedCh !== undefined && !isSpace) {
                      slotClass = 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]';
                    }

                    return (
                      <div
                        key={idx}
                        className={`h-14 ${isSpace ? 'w-7' : 'w-12'} rounded-xl border-2 flex items-center justify-center font-display text-2xl transition-colors ${slotClass}`}
                      >
                        {isSpace ? (typedCh === ' ' ? '␣' : '띄') : typedCh || ''}
                      </div>
                    );
                  })}
                </div>

                {/* Input Area */}
                {inputMode === 'BLOCK' ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {session.tiles.map((tile, idx) => {
                        const used = session.usedTileIdxs.includes(idx);
                        return (
                          <button
                            key={`${tile}-${idx}`}
                            type="button"
                            disabled={used || Boolean(session.feedback?.ok)}
                            onClick={() => handlePickTile(idx)}
                            className={`min-w-[54px] h-[54px] px-3.5 rounded-xl border-2 border-b-4 font-display text-2xl transition-transform ${
                              used || session.feedback?.ok
                                ? 'border-[#E2E8F0] bg-[#F1F5F9] text-[#94A3B8] opacity-35 cursor-default'
                                : 'border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#60A5FA] hover:bg-[#EFF6FF] active:translate-y-0.5 cursor-pointer'
                            }`}
                          >
                            {tile === ' ' ? '띄어쓰기' : tile}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleBackspaceTile}
                        disabled={!session.usedTileIdxs.length || Boolean(session.feedback?.ok)}
                        className="inline-flex items-center gap-1.5 min-h-[46px] px-4 py-2.5 bg-white border border-[#DCE6F2] rounded-xl text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Delete className="w-4 h-4" />
                        <span>한 글자 지우기</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAnswer}
                        disabled={!session.usedTileIdxs.length || Boolean(session.feedback?.ok)}
                        className="inline-flex items-center gap-1.5 min-h-[46px] px-4 py-2.5 bg-white border border-[#DCE6F2] rounded-xl text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>모두 지우기</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubmitAnswer()}
                        disabled={!session.answer.length || Boolean(session.feedback?.ok)}
                        className="inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 bg-[#2563EB] text-white rounded-xl text-base font-semibold hover:bg-[#1D4ED8] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>정답 확인하기</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAnswer} className="space-y-3 flex flex-col items-center">
                    <input
                      ref={typeInputRef}
                      type="text"
                      value={session.answer}
                      readOnly={Boolean(session.feedback?.ok)}
                      onChange={(e) => setSession({ ...session, answer: e.target.value, feedback: null })}
                      placeholder="소리를 듣고 여기에 직접 써 보세요"
                      autoComplete="off"
                      className="w-full max-w-lg px-5 py-4 text-center font-display text-2xl bg-white border-2 border-[#CBD5E1] rounded-2xl focus:outline-none focus:border-[#2563EB] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!session.answer.trim().length || Boolean(session.feedback?.ok)}
                      className="inline-flex items-center justify-center gap-2 min-h-[46px] px-8 py-2.5 bg-[#2563EB] text-white rounded-xl text-base font-semibold hover:bg-[#1D4ED8] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>정답 확인하기 (Enter)</span>
                    </button>
                  </form>
                )}

                {/* Feedback Banner */}
                {session.feedback && (
                  <div
                    className={`animate-pop-in rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      session.feedback.ok
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                        : 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-display text-xl">
                        {session.feedback.ok ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-[#059669] shrink-0" />
                            <span>참 잘했어요! 완벽한 글자예요!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-6 h-6 text-[#E11D48] shrink-0" />
                            <span>아쉬워요! 바른 글자와 비교해 보아요.</span>
                          </>
                        )}
                      </div>
                      {!session.feedback.ok && (
                        <div className="text-sm">
                          바른 정답:{' '}
                          <strong className="font-display text-lg text-[#0F172A] ml-1">
                            {session.feedback.expected}
                          </strong>
                        </div>
                      )}
                      <div className="text-sm opacity-90">{currentQuestion.tip}</div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {!session.feedback.ok && session.hearts > 0 && (
                        <button
                          type="button"
                          onClick={handleRetryCurrent}
                          className="min-h-[44px] px-4 py-2 bg-white border border-[#FECDD3] text-[#9F1239] rounded-xl text-sm font-semibold hover:bg-[#FFF5F5] cursor-pointer whitespace-nowrap"
                        >
                          다시 써보기
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className={`inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap ${
                          session.feedback.ok
                            ? 'bg-[#10B981] hover:bg-[#059669]'
                            : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                        }`}
                      >
                        <span>
                          {session.hearts <= 0 || session.idx + 1 >= session.questions.length
                            ? '결과 보기'
                            : '다음 문제'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Power-Up Item Bar */}
                <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold text-[#475569] mr-1">코인 아이템 상점</span>
                  <button
                    type="button"
                    onClick={() => handleUseItem('HINT')}
                    disabled={save.coins < 10 || Boolean(session.feedback?.ok)}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 bg-white border border-[#DCE6F2] rounded-xl text-xs sm:text-sm font-semibold text-[#0F172A] hover:bg-[#EFF6FF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Search className="w-4 h-4 text-[#2563EB]" />
                    <span>다음 글자 돋보기 (10코인)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseItem('SLOW')}
                    disabled={save.coins < 5}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 bg-white border border-[#DCE6F2] rounded-xl text-xs sm:text-sm font-semibold text-[#0F172A] hover:bg-[#EFF6FF] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Ear className="w-4 h-4 text-[#0EA5E9]" />
                    <span>달팽이 느린 소리 (5코인)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseItem('HEAL')}
                    disabled={save.coins < 15 || session.hearts >= session.maxHearts}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 bg-white border border-[#DCE6F2] rounded-xl text-xs sm:text-sm font-semibold text-[#0F172A] hover:bg-[#FFF1F2] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Heart className="w-4 h-4 text-[#E11D48]" />
                    <span>딸기우유 하트+1 (15코인)</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* SCREEN: RESULT */}
        {screen === 'RESULT' && session && (
          <section className="max-w-xl mx-auto bg-white border border-[#DCE6F2] rounded-2xl p-8 text-center animate-pop-in space-y-6">
            <div className="flex justify-center">
              <CompanionHeroSvg mood={session.hearts > 0 ? 'happy' : 'hurt'} className="w-28 h-28" />
            </div>

            <div>
              <h1 className="font-display text-3xl text-[#0F172A]">
                {session.hearts > 0 ? `${session.stage.title} 완료!` : '아쉬워요! 다시 도전해 볼까요?'}
              </h1>
              {session.hearts > 0 && !session.isReview && (
                <div className="font-mono-num text-4xl text-[#F59E0B] tracking-widest mt-3">
                  {'★'.repeat(session.mistakes === 0 ? 3 : session.mistakes <= 2 ? 2 : 1)}
                  {'☆'.repeat(3 - (session.mistakes === 0 ? 3 : session.mistakes <= 2 ? 2 : 1))}
                </div>
              )}
              <p className="text-base text-[#475569] mt-2">
                {session.hearts > 0
                  ? `${session.stage.monsterName}를 물리치고 코인 ${session.earnedCoins}개를 얻었어요!`
                  : '하트가 모두 닳았어요. 천천히 듣기와 오답 노트로 다시 도전해 보아요.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-[#F8FAFC] border border-[#DCE6F2] rounded-2xl p-4">
              <div>
                <div className="text-xs text-[#64748B]">획득 점수</div>
                <div className="font-mono-num text-xl font-bold text-[#0F172A] mt-1">{session.score}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">최대 콤보</div>
                <div className="font-mono-num text-xl font-bold text-[#2563EB] mt-1">{session.maxCombo}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">실수 횟수</div>
                <div className="font-mono-num text-xl font-bold text-[#E11D48] mt-1">{session.mistakes}</div>
              </div>
            </div>

            {session.newlyUnlockedStickers.length > 0 && (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 text-left">
                <div className="text-sm font-bold text-[#1D4ED8] mb-2">새로 얻은 칭찬 스티커!</div>
                <div className="flex flex-wrap gap-3">
                  {session.newlyUnlockedStickers.map((sId) => {
                    const st = STICKERS.find((item) => item.id === sId);
                    if (!st) return null;
                    return (
                      <div key={sId} className="flex items-center gap-2 bg-white border border-[#DCE6F2] rounded-xl px-3 py-2">
                        <StickerBadgeSvg sticker={st} unlocked />
                        <div>
                          <div className="font-display text-sm text-[#0F172A]">{st.name}</div>
                          <div className="text-xs text-[#475569]">{st.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {session.hearts > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playPop();
                    setFireworksTrigger((n) => n + 1);
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[46px] px-5 py-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl font-semibold text-[#92400E] hover:bg-[#FDE68A] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>폭죽 다시 터뜨리기</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => startStage(session.stage.id, session.isReview)}
                className="min-h-[46px] px-6 py-2.5 bg-white border border-[#DCE6F2] rounded-xl font-semibold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
              >
                다시 도전하기
              </button>
              <button
                type="button"
                onClick={() => navigate('MAP')}
                className="min-h-[46px] px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-semibold hover:bg-[#1D4ED8] cursor-pointer"
              >
                모험 지도로 돌아가기
              </button>
            </div>
          </section>
        )}

        {/* SCREEN: STICKER BOOK */}
        {screen === 'STICKERS' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A]">
                칭찬 스티커 도감 <span className="font-mono-num text-[#2563EB]">({save.stickers.length} / 12)</span>
              </h1>
              <p className="text-sm sm:text-base text-[#475569] mt-1">
                받아쓰기 스테이지를 깨고 조건을 달성해 멋진 스티커 12종을 모두 모아 보아요.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STICKERS.map((sticker) => {
                const unlocked = save.stickers.includes(sticker.id);
                return (
                  <article
                    key={sticker.id}
                    className={`border rounded-2xl p-5 flex items-center gap-4 ${
                      unlocked
                        ? 'bg-white border-[#DCE6F2]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-70'
                    }`}
                  >
                    <StickerBadgeSvg sticker={sticker} unlocked={unlocked} />
                    <div className="min-w-0">
                      <h2 className="font-display text-lg text-[#0F172A]">{sticker.name}</h2>
                      <p className="text-sm text-[#475569] mt-0.5">
                        {unlocked ? sticker.description : `획득 조건: ${sticker.conditionText}`}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN: WRONG-ANSWER REVIEW DOJO */}
        {screen === 'REVIEW' && (
          <div className="space-y-6">
            {save.wrongIds.length === 0 ? (
              <div className="bg-white border border-[#DCE6F2] rounded-2xl p-12 text-center space-y-4">
                <div className="flex justify-center">
                  <CompanionHeroSvg mood="happy" className="w-24 h-24" />
                </div>
                <h1 className="font-display text-2xl text-[#0F172A]">오답 노트가 깨끗해요!</h1>
                <p className="text-[#475569]">아직 틀린 문제가 없거나, 모든 오답을 완벽하게 복습했어요.</p>
                <button
                  type="button"
                  onClick={() => navigate('MAP')}
                  className="min-h-[46px] px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-semibold hover:bg-[#1D4ED8] cursor-pointer"
                >
                  모험 지도로 가기
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white border border-[#DCE6F2] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl text-[#0F172A]">
                      오답 노트 <span className="font-mono-num text-[#E11D48]">({save.wrongIds.length}문제)</span>
                    </h1>
                    <p className="text-sm text-[#475569] mt-1">
                      틀렸던 문장을 다시 맞히면 오답 노트에서 지워지고 보너스 코인을 받아요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startStage(0, true)}
                    className="inline-flex items-center gap-2 min-h-[46px] px-5 py-2.5 bg-[#2563EB] text-white rounded-xl font-semibold hover:bg-[#1D4ED8] cursor-pointer whitespace-nowrap"
                  >
                    <Swords className="w-4 h-4" />
                    <span>오답 물리치기 시작</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STAGES.flatMap((s) => s.questions)
                    .filter((q) => save.wrongIds.includes(q.id))
                    .map((q) => (
                      <div
                        key={q.id}
                        className="bg-white border border-[#DCE6F2] rounded-2xl p-5 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-display text-xl text-[#0F172A]">{q.sentence}</div>
                          <div className="text-sm text-[#475569] mt-1">{q.tip}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playPop();
                            speakKorean(q.sentence, 0.82);
                          }}
                          className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 bg-white border border-[#DCE6F2] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 text-[#2563EB]" />
                          <span>들어보기</span>
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
