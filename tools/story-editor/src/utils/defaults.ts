import type { DialogueFileData, DiaryActionsData, ExplorationFlagsData, GameConfigData, EventFlowData } from '../types'

export function createDefaultDialogueData(): DialogueFileData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    npcs: [
      {
        npcId: 'heroine_hina',
        npcName: 'ヒナ',
        type: 'heroine',
        absenceDays: [16, 17, 18, 19],
        dialogueStages: {
          distant: { thresholdMin: 0, thresholdMax: 3, lines: ['......あ、こんにちは。', 'ここ、夕焼けがきれいなんです。', '......。'] },
          friendly: { thresholdMin: 4, thresholdMax: 10, lines: ['あ、また来たんだ。', '今日の海、すごくきれい。', 'ねえ、この島のこと好き？', '私は......毎年ここに来てるの。'] },
          close: { thresholdMin: 11, thresholdMax: -1, lines: ['来てくれると思ってた。', 'ねえ、夏が終わっても......覚えてる？ここのこと。', 'あのね......私、帰りたくないな。', 'ずっと、こうしていられたらいいのに。'] },
        },
        specialDialogues: [{ id: 'hina_secret_place', trigger: 'heroine_conversation >= 8', day: null, lines: ['ねぇ、ずっと気になってる場所があるの。', 'ついてきてくれる？'] }],
      },
      {
        npcId: 'npc_fishing_old_man',
        npcName: '釣りの老人',
        type: 'npc',
        dialogueStages: {
          default: { thresholdMin: 0, thresholdMax: -1, lines: ['今日はよく釣れるぞ。', '昔はこの辺りもっと魚がおったんじゃ。'] },
        },
      },
    ],
  }
}

export function createDefaultDiaryActions(): DiaryActionsData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    defaultText: '今日は静かな一日だった。',
    fallbackTemplate: '今日は「{actionTag}」をした。',
    actions: [
      { tag: 'TalkHeroine', displayName: 'ヒロインと会話', priority: 80, diaryText: '夕方、堤防であの子と話した。', category: 'interaction' },
      { tag: 'DidDelivery', displayName: '配達バイト', priority: 50, diaryText: '今日は配達のバイトをした。', category: 'work' },
      { tag: 'Fishing', displayName: '釣り', priority: 40, diaryText: '防波堤で釣りをした。', category: 'play' },
      { tag: 'BugCatch', displayName: '虫取り', priority: 35, diaryText: '虫取りに夢中になった。', category: 'play' },
      { tag: 'ShrineClean', displayName: '神社掃除', priority: 60, diaryText: '神社の掃除を手伝った。', category: 'work' },
      { tag: 'RadioExercise', displayName: 'ラジオ体操', priority: 20, diaryText: '朝のラジオ体操に参加した。', category: 'routine' },
      { tag: 'FedCat', displayName: '猫にごはん', priority: 30, diaryText: '野良猫にごはんをあげた。', category: 'interaction' },
      { tag: 'NightDive', displayName: '夜潜水', priority: 90, diaryText: '夜の海に飛び込んだ。星がきれいだった。', category: 'special' },
      { tag: 'FoundDiary', displayName: '古い日記発見', priority: 100, diaryText: '古い日記を見つけた。誰のだろう。', category: 'story' },
    ],
  }
}

export function createDefaultExplorationFlags(): ExplorationFlagsData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    boolFlags: [
      { key: 'unlock_shrine_back_gate', displayName: '神社裏門', description: '掃除イベント3回以上で解放', defaultValue: false, unlockCondition: { type: 'intValue', key: 'shrine_clean_count', operator: '>=', value: 3 }, unlocksArea: '神社裏手の森' },
      { key: 'unlock_fallen_tree', displayName: '倒木', description: 'Day10以降で自動解放', defaultValue: false, unlockCondition: { type: 'day', operator: '>=', value: 10 }, unlocksArea: '森の奥' },
      { key: 'unlock_old_well', displayName: '古井戸', description: 'ヒロイン会話8回以上で秘密の場所イベント', defaultValue: false, unlockCondition: { type: 'intValue', key: 'heroine_conversation', operator: '>=', value: 8 }, unlocksArea: '古井戸内部' },
      { key: 'unlock_sea_tunnel', displayName: '海底トンネル', description: '素潜り5回以上かつDay15以降', defaultValue: false, unlockCondition: { type: 'composite', logic: 'AND', conditions: [{ type: 'intValue', key: 'diving_count', operator: '>=', value: 5 }, { type: 'day', operator: '>=', value: 15 }] }, unlocksArea: '海底洞窟' },
      { key: 'unlock_mountain_shortcut', displayName: '山頂ショートカット', description: '倒木解放後に発見', defaultValue: false, unlockCondition: { type: 'flag', key: 'unlock_fallen_tree', operator: '==', value: true }, unlocksArea: '山頂展望台' },
      { key: 'unlock_sea_ruins', displayName: '海底遺構', description: '海底トンネル＋地図の断片で発見', defaultValue: false, unlockCondition: { type: 'composite', logic: 'AND', conditions: [{ type: 'flag', key: 'unlock_sea_tunnel', operator: '==', value: true }, { type: 'flag', key: 'found_map_fragment', operator: '==', value: true }] }, unlocksArea: '海底遺構' },
    ],
    intCounters: [
      { key: 'radio_stamp_count', displayName: 'ラジオ体操スタンプ', defaultValue: 0, maxValue: 30, rewards: [{ threshold: 5, reward: 'タオル' }, { threshold: 15, reward: '水筒' }, { threshold: 25, reward: '特別スタンプ' }] },
      { key: 'cat_friendship', displayName: '猫なつき度', defaultValue: 0, maxValue: 10 },
      { key: 'heroine_conversation', displayName: 'ヒロイン会話回数', defaultValue: 0, maxValue: -1 },
    ],
  }
}

export function createDefaultGameConfig(): GameConfigData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    general: { maxDay: 30, startMonth: 8, startDay: 1, gameName: 'なつのしま' },
    timePhases: {
      Morning: { startHour: 6, endHour: 12, label: '朝' },
      Noon: { startHour: 12, endHour: 17, label: '昼' },
      Evening: { startHour: 17, endHour: 20, label: '夕方' },
      Night: { startHour: 20, endHour: 6, label: '夜' },
    },
    timeSystem: { timeScale: 60, defaultStartHour: 6.0 },
    heroine: { absenceStartDay: 16, absenceEndDay: 19, intimacyThresholds: { distant: { min: 0, max: 3 }, friendly: { min: 4, max: 10 }, close: { min: 11, max: -1 } }, appearTimePhase: 'Evening', leaveTimePhase: 'Night' },
    audio: { eveningChimeHour: 17, bgmVolume: 0.3, ambientVolume: 0.7 },
  }
}

export function createDefaultEventFlow(): EventFlowData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    nodes: [
      { id: 'day1_start', type: 'dayStart', position: { x: 100, y: 300 }, data: { label: '8月1日 - 島に到着', day: 1 } },
      { id: 'evt_radio_1', type: 'event', position: { x: 400, y: 150 }, data: { label: 'ラジオ体操（初回）', description: '広場でラジオ体操に参加', day: 1, timePhase: 'Morning', category: 'routine', actionTag: 'RadioExercise' } },
      { id: 'evt_heroine_1', type: 'event', position: { x: 400, y: 450 }, data: { label: 'ヒロインと初めて会う', description: '堤防で夕焼けを見ている少女', day: 1, timePhase: 'Evening', category: 'heroine', actionTag: 'TalkHeroine' } },
      { id: 'day16_start', type: 'dayStart', position: { x: 800, y: 300 }, data: { label: '8月16日 - ヒロイン不在開始', day: 16 } },
      { id: 'day20_start', type: 'dayStart', position: { x: 1200, y: 300 }, data: { label: '8月20日 - ヒロイン帰還', day: 20 } },
      { id: 'ending', type: 'ending', position: { x: 1600, y: 300 }, data: { label: '8月30日 - 夏の終わり', day: 30 } },
    ],
    edges: [
      { id: 'e1', source: 'day1_start', target: 'evt_radio_1', data: { label: '朝' } },
      { id: 'e2', source: 'day1_start', target: 'evt_heroine_1', data: { label: '夕方' } },
      { id: 'e3', source: 'evt_heroine_1', target: 'day16_start', data: { label: '日数経過' } },
      { id: 'e4', source: 'day16_start', target: 'day20_start', data: { label: '不在期間' } },
      { id: 'e5', source: 'day20_start', target: 'ending', data: { label: '残りの日々' } },
    ],
  }
}
