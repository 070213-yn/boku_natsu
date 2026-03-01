import type { DialogueFileData, DiaryActionsData, ExplorationFlagsData, GameConfigData, EventFlowData, EventListData } from '../types'

export function createDefaultDialogueData(): DialogueFileData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    npcs: [
      {
        npcId: 'hina', npcName: 'ヒナ', type: 'heroine',
        absenceDays: [16, 17, 18, 19],
        dialogueStages: {
          distant: { thresholdMin: 0, thresholdMax: 3, lines: ['……あ、こんにちは。', 'ここ、夕焼けがきれいなんです。'] },
          friendly: { thresholdMin: 4, thresholdMax: 10, lines: ['あ、また来たんだ。', '今日の海、すごくきれい。'] },
          close: { thresholdMin: 11, thresholdMax: 999, lines: ['来てくれると思ってた。', 'ねえ、夏が終わっても……覚えてる？'] },
        },
        specialDialogues: [{ id: 'hina_secret_place', trigger: 'heroine_conversation>=8', day: null, lines: ['ねぇ、ずっと気になってる場所があるの。ついてきてくれる？'] }],
      },
      { npcId: 'gen', npcName: 'ゲンさん', type: 'npc', dialogueStages: { default: { thresholdMin: 0, thresholdMax: 999, lines: ['今日はよく釣れるぞ。', '昔はこの辺りもっと魚がおったんじゃ。'] } }, specialDialogues: [] },
      { npcId: 'kannushi', npcName: '神主さん', type: 'npc', dialogueStages: { default: { thresholdMin: 0, thresholdMax: 999, lines: ['おや、参拝かね。えらいね。'] } }, specialDialogues: [] },
      { npcId: 'tatsuya', npcName: 'タツヤおじさん', type: 'npc', dialogueStages: { morning: { thresholdMin: 0, thresholdMax: 999, lines: ['おはよう。今日は何するんだ？'] }, evening: { thresholdMin: 0, thresholdMax: 999, lines: ['おかえり。楽しかったか？'] } }, specialDialogues: [] },
      { npcId: 'mitsuko', npcName: 'ミツコおばさん', type: 'npc', dialogueStages: { default: { thresholdMin: 0, thresholdMax: 999, lines: ['ごはんできてるよ〜。'] } }, specialDialogues: [] },
      { npcId: 'yoshie', npcName: 'ヨシエさん', type: 'npc', dialogueStages: { default: { thresholdMin: 0, thresholdMax: 999, lines: ['あら〜、元気ねぇ！'] } }, specialDialogues: [] },
      { npcId: 'tetsu', npcName: 'テツさん', type: 'npc', dialogueStages: { default: { thresholdMin: 0, thresholdMax: 999, lines: ['おう、坊主！ 元気か！'] } }, specialDialogues: [] },
      { npcId: 'hana', npcName: 'ハナさん', type: 'npc', dialogueStages: { default: { thresholdMin: 0, thresholdMax: 999, lines: ['いらっしゃい。何にする？'] } }, specialDialogues: [] },
      { npcId: 'kazu', npcName: 'カズさん', type: 'npc', dialogueStages: { default: { thresholdMin: 0, thresholdMax: 999, lines: ['おう、来たな！ 今日も元気にいくぞ！'] } }, specialDialogues: [] },
    ],
  }
}

export function createDefaultDiaryActions(): DiaryActionsData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    defaultText: '今日は静かな一日だった。波の音をずっと聞いてた。',
    fallbackTemplate: '今日は「{actionTag}」をした。楽しかった。',
    actions: [
      { tag: 'RadioExercise', displayName: 'ラジオ体操', priority: 15, diaryText: '朝、ラジオ体操に行った。体を動かしたら気持ちよくなった。', category: 'routine' },
      { tag: 'TalkHeroine', displayName: 'ヒロインと会話', priority: 85, diaryText: '夕方、いつもの堤防に行ったら、あの子がいた。', category: 'heroine' },
      { tag: 'HeroineFirstMeet', displayName: 'ヒロインとの出会い', priority: 95, diaryText: '堤防で夕焼けを見てたら、女の子がひとりで座ってた。', category: 'heroine' },
      { tag: 'HeroineLastDay', displayName: '最後の会話', priority: 100, diaryText: '最後の夕焼け。あの子と堤防に並んで座った。', category: 'heroine' },
      { tag: 'DidDelivery', displayName: '配達バイト', priority: 50, diaryText: '今日も配達のバイトをした。', category: 'work' },
      { tag: 'NetPulling', displayName: '網引き手伝い', priority: 55, diaryText: 'テツさんの網引きを手伝った。', category: 'work' },
      { tag: 'ShrineClean', displayName: '神社掃除', priority: 45, diaryText: '神社の掃除をした。', category: 'work' },
      { tag: 'Fishing', displayName: '釣り', priority: 40, diaryText: '防波堤でゲンさんと一緒に釣りをした。', category: 'play' },
      { tag: 'BugCatch', displayName: '虫取り', priority: 35, diaryText: '虫取り網を持って山に行った。', category: 'play' },
      { tag: 'ShellCollect', displayName: '貝殻集め', priority: 30, diaryText: '浜辺で貝殻を集めた。', category: 'play' },
      { tag: 'FedCat', displayName: '猫にごはん', priority: 40, diaryText: '野良猫にごはんをあげた。', category: 'interaction' },
      { tag: 'ShallowDive', displayName: '素潜り', priority: 45, diaryText: '今日は海に潜った。', category: 'sea' },
      { tag: 'NightDive', displayName: '夜潜水', priority: 90, diaryText: '夜の海に飛び込んだ。まるで宇宙みたいだった。', category: 'special' },
      { tag: 'SeaRuins', displayName: '海底遺構', priority: 98, diaryText: '海底のトンネルの先に、古い建物みたいなものがあった。', category: 'mystery' },
      { tag: 'FoundDiary', displayName: '古い日記発見', priority: 97, diaryText: '森の奥で、古い日記を見つけた。', category: 'story' },
      { tag: 'HiddenPlace', displayName: '地図にない場所', priority: 99, diaryText: '落書きの地図が指してた場所に行った。信じられない。', category: 'mystery' },
    ],
  }
}

export function createDefaultExplorationFlags(): ExplorationFlagsData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    boolFlags: [
      { key: 'unlock_shrine_back_gate', displayName: '神社裏門', description: '神社の掃除を3回以上行うと解放', defaultValue: false, unlockCondition: { type: 'intValue', key: 'shrine_clean_count', operator: '>=', value: 3 }, unlocksArea: '神社裏手の森' },
      { key: 'unlock_fallen_tree', displayName: '倒木撤去', description: 'Day10以降で自動解放', defaultValue: false, unlockCondition: { type: 'day', operator: '>=', value: 10 }, unlocksArea: '森の奥' },
      { key: 'unlock_old_well', displayName: '古井戸', description: 'ヒロイン会話8回以上かつ秘密の場所イベント完了', defaultValue: false, unlockCondition: { type: 'composite', logic: 'AND', conditions: [{ type: 'intValue', key: 'heroine_conversation', operator: '>=', value: 8 }, { type: 'flag', key: 'secret_place_event', value: true }] }, unlocksArea: '古井戸内部' },
      { key: 'unlock_sea_tunnel', displayName: '海底トンネル', description: '素潜り5回以上かつDay15以降', defaultValue: false, unlockCondition: { type: 'composite', logic: 'AND', conditions: [{ type: 'intValue', key: 'diving_count', operator: '>=', value: 5 }, { type: 'day', operator: '>=', value: 15 }] }, unlocksArea: '海底洞窟' },
      { key: 'unlock_mountain_shortcut', displayName: '山頂ショートカット', description: '倒木撤去後に発見', defaultValue: false, unlockCondition: { type: 'flag', key: 'unlock_fallen_tree', value: true }, unlocksArea: '山頂展望台' },
      { key: 'unlock_sea_ruins', displayName: '海底遺構', description: '海底トンネル＋地図の断片', defaultValue: false, unlockCondition: { type: 'composite', logic: 'AND', conditions: [{ type: 'flag', key: 'unlock_sea_tunnel', value: true }, { type: 'flag', key: 'found_map_fragment', value: true }] }, unlocksArea: '海底遺構' },
      { key: 'unlock_night_dive', displayName: '夜潜水', description: 'Day10以降、素潜り3回以上、失神イベント完了', defaultValue: false, unlockCondition: { type: 'composite', logic: 'AND', conditions: [{ type: 'day', operator: '>=', value: 10 }, { type: 'intValue', key: 'diving_count', operator: '>=', value: 3 }] }, unlocksArea: '夜の海' },
      { key: 'unlock_secret_base', displayName: '秘密基地', description: 'Day7以降に森で発見', defaultValue: false, unlockCondition: { type: 'day', operator: '>=', value: 7 }, unlocksArea: '秘密基地' },
      { key: 'unlock_hidden_place', displayName: '地図にない場所', description: '落書きの地図が完成すると行ける', defaultValue: false, unlockCondition: { type: 'flag', key: 'found_map_fragment', value: true }, unlocksArea: '地図にない場所' },
      { key: 'found_graffiti_1', displayName: '落書き1発見', description: '神社裏門解放後に発見', defaultValue: false, unlockCondition: { type: 'flag', key: 'unlock_shrine_back_gate', value: true }, unlocksArea: '' },
      { key: 'found_graffiti_2', displayName: '落書き2発見', description: '山頂ショートカット解放後に発見', defaultValue: false, unlockCondition: { type: 'flag', key: 'unlock_mountain_shortcut', value: true }, unlocksArea: '' },
      { key: 'found_map_fragment', displayName: '地図の断片', description: '落書き1＋2で地図完成', defaultValue: false, unlockCondition: { type: 'composite', logic: 'AND', conditions: [{ type: 'flag', key: 'found_graffiti_1', value: true }, { type: 'flag', key: 'found_graffiti_2', value: true }] }, unlocksArea: '' },
    ],
    intCounters: [
      { key: 'radio_stamp_count', displayName: 'ラジオ体操スタンプ', defaultValue: 0, maxValue: 30, rewards: [{ threshold: 5, reward: 'タオル' }, { threshold: 15, reward: '水筒' }, { threshold: 25, reward: '特別スタンプ' }] },
      { key: 'cat_friendship', displayName: '猫なつき度', defaultValue: 0, maxValue: 10, rewards: [{ threshold: 3, reward: '猫がついてくる' }, { threshold: 7, reward: '猫が甘える' }, { threshold: 10, reward: '猫が膝に乗る' }] },
      { key: 'heroine_conversation', displayName: 'ヒロイン会話回数', defaultValue: 0, maxValue: -1 },
      { key: 'shrine_clean_count', displayName: '神社掃除回数', defaultValue: 0, maxValue: -1 },
      { key: 'diving_count', displayName: '素潜り回数', defaultValue: 0, maxValue: -1 },
      { key: 'delivery_count', displayName: '配達回数', defaultValue: 0, maxValue: -1, rewards: [{ threshold: 5, reward: '常連認定' }, { threshold: 10, reward: '特別な荷物' }] },
      { key: 'fishing_count', displayName: '釣り回数', defaultValue: 0, maxValue: -1, rewards: [{ threshold: 3, reward: 'ゲンさんの昔話1' }, { threshold: 10, reward: '大物ヒント' }] },
      { key: 'bug_catch_count', displayName: '虫取り回数', defaultValue: 0, maxValue: -1 },
      { key: 'money', displayName: 'お財布', defaultValue: 0, maxValue: -1 },
    ],
  }
}

export function createDefaultGameConfig(): GameConfigData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    general: { maxDay: 30, startMonth: 8, startDay: 1, gameName: 'なつのしま' },
    protagonist: {
      gender: 'male', age: 9, grade: '小学3年生',
      nameInputEnabled: true, defaultName: 'はるき', voiceType: 'full',
      arrivalReason: '両親の仕事の都合で、夏休みの間、親戚のおうちにお世話になることになった',
    },
    camera: { perspective: 'third_person', rotation: 'fixed' },
    controls: {
      supportedDevices: ['keyboard_mouse', 'gamepad'],
      keyBindings: { move: 'WASD', jump: 'Space', dash: 'Shift', interact: 'LeftClick', menu: 'Tab', system: 'Escape' },
    },
    timePhases: {
      Morning: { startHour: 6, endHour: 12, label: '朝' },
      Noon: { startHour: 12, endHour: 17, label: '昼' },
      Evening: { startHour: 17, endHour: 20, label: '夕方' },
      Night: { startHour: 20, endHour: 6, label: '夜' },
    },
    timeSystem: {
      type: 'action_based', defaultStartHour: 6.0,
      areaTransitionMinutes: { min: 5, max: 15 },
      speedPresets: [
        { name: 'はやい', multiplier: 1.5 },
        { name: 'ふつう', multiplier: 1.0 },
        { name: 'おそい', multiplier: 0.6 },
        { name: 'すごくおそい', multiplier: 0.3 },
      ],
    },
    menu: {
      tabMenu: ['図鑑', '虫篭', '地図', '持ち物', 'お財布'],
      escapeMenu: ['セーブ', 'ロード', '画面設定', 'ゲーム設定', 'タイトルに戻る', 'ゲーム終了'],
    },
    map: { structure: 'area_based', totalAreas: 10, progressiveUnlock: true, minimap: false },
    save: { anytimeSave: true, autoSave: true, slotCount: 3, newGamePlus: false },
    endings: { multipleEndings: true, conditions: [] },
    text: { diaryPerspective: 'first_person', kanjiStyle: 'normal', furigana: true },
    heroine: { absenceStartDay: 16, absenceEndDay: 19, intimacyThresholds: { distant: { min: 0, max: 3 }, friendly: { min: 4, max: 10 }, close: { min: 11, max: -1 } }, appearTimePhase: 'Evening', leaveTimePhase: 'Night' },
    audio: { eveningChimeHour: 17, bgmVolume: 0.3, ambientVolume: 0.7 },
  }
}

export function createDefaultEventList(): EventListData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    events: [
      { id: 'evt_radio_exercise', name: 'ラジオ体操', description: '毎朝広場で行われるラジオ体操', category: 'routine', triggers: [{ type: 'timePhase', timePhase: 'Morning' }], actions: [{ type: 'incrementInt', intKey: 'radio_stamp_count', intValue: 1 }, { type: 'logAction', actionTag: 'RadioExercise' }], scriptName: 'Event_RadioExercise', isRepeatable: true, priority: 20, enabled: true, timeAdvanceMinutes: 30 },
      { id: 'evt_heroine_first_meet', name: 'ヒロインとの出会い', description: 'Day1夕方、堤防で夕焼けを見ている少女と出会う', category: 'heroine', triggers: [{ type: 'day', day: 1, dayOperator: '==' }, { type: 'timePhase', timePhase: 'Evening' }], actions: [{ type: 'incrementInt', intKey: 'heroine_conversation', intValue: 1 }, { type: 'logAction', actionTag: 'HeroineFirstMeet' }], scriptName: 'Event_HeroineFirstMeet', isRepeatable: false, priority: 90, enabled: true, timeAdvanceMinutes: 30 },
      { id: 'evt_heroine_daily', name: 'ヒロインとの日常会話', description: '夕方堤防でヒナと会話する', category: 'heroine', triggers: [{ type: 'timePhase', timePhase: 'Evening' }], actions: [{ type: 'incrementInt', intKey: 'heroine_conversation', intValue: 1 }, { type: 'logAction', actionTag: 'TalkHeroine' }], scriptName: 'Event_HeroineDaily', isRepeatable: true, priority: 80, enabled: true, timeAdvanceMinutes: 20 },
      { id: 'evt_heroine_last_day', name: '最後の日', description: 'Day30夕方、ヒロインとの最後の別れ', category: 'heroine', triggers: [{ type: 'day', day: 30, dayOperator: '==' }, { type: 'timePhase', timePhase: 'Evening' }], actions: [{ type: 'logAction', actionTag: 'HeroineLastDay' }], scriptName: 'Event_HeroineLastDay', isRepeatable: false, priority: 100, enabled: true, timeAdvanceMinutes: 60 },
      { id: 'evt_shrine_clean', name: '神社掃除', description: '神社の掃除を手伝う。3回以上で裏門解放', category: 'interaction', triggers: [{ type: 'timePhase', timePhase: 'Morning' }], actions: [{ type: 'incrementInt', intKey: 'shrine_clean_count', intValue: 1 }, { type: 'logAction', actionTag: 'ShrineClean' }], scriptName: 'Event_ShrineClean', isRepeatable: true, priority: 45, enabled: true, timeAdvanceMinutes: 40 },
      { id: 'evt_delivery', name: '配達バイト', description: 'ヨシエさんの配達を手伝う', category: 'interaction', triggers: [{ type: 'timePhase', timePhase: 'Noon' }], actions: [{ type: 'incrementInt', intKey: 'delivery_count', intValue: 1 }, { type: 'logAction', actionTag: 'DidDelivery' }], scriptName: 'Event_Delivery', isRepeatable: true, priority: 50, enabled: true, timeAdvanceMinutes: 45 },
      { id: 'evt_fishing', name: '防波堤で釣り', description: 'ゲンさんと一緒に釣りをする', category: 'interaction', triggers: [{ type: 'flag', flagKey: 'has_fishing_rod', flagValue: true }], actions: [{ type: 'incrementInt', intKey: 'fishing_count', intValue: 1 }, { type: 'logAction', actionTag: 'Fishing' }], scriptName: 'Event_Fishing', isRepeatable: true, priority: 40, enabled: true, timeAdvanceMinutes: 40 },
      { id: 'evt_bug_catch', name: '虫取り', description: '山で虫を捕まえる', category: 'bug', triggers: [{ type: 'flag', flagKey: 'has_bug_net', flagValue: true }], actions: [{ type: 'incrementInt', intKey: 'bug_catch_count', intValue: 1 }, { type: 'logAction', actionTag: 'BugCatch' }], scriptName: 'Event_BugCatch', isRepeatable: true, priority: 35, enabled: true, timeAdvanceMinutes: 30 },
      { id: 'evt_shallow_dive', name: '素潜り', description: '海に潜る', category: 'sea', triggers: [{ type: 'timePhase', timePhase: 'Noon' }], actions: [{ type: 'incrementInt', intKey: 'diving_count', intValue: 1 }, { type: 'logAction', actionTag: 'ShallowDive' }], scriptName: 'Event_ShallowDive', isRepeatable: true, priority: 45, enabled: true, timeAdvanceMinutes: 30 },
      { id: 'evt_old_diary', name: '古い日記の発見', description: '森の奥で古い日記を発見する', category: 'mystery', triggers: [{ type: 'flag', flagKey: 'unlock_fallen_tree', flagValue: true }, { type: 'day', day: 12, dayOperator: '>=' }], actions: [{ type: 'setFlag', flagKey: 'found_old_diary', flagValue: true }, { type: 'logAction', actionTag: 'FoundDiary' }], scriptName: 'Event_OldDiary', isRepeatable: false, priority: 97, enabled: true },
      { id: 'evt_sea_ruins', name: '海底遺構', description: '海底トンネルの先に古代の遺構を発見', category: 'mystery', triggers: [{ type: 'flag', flagKey: 'unlock_sea_tunnel', flagValue: true }, { type: 'flag', flagKey: 'found_map_fragment', flagValue: true }], actions: [{ type: 'setFlag', flagKey: 'unlock_sea_ruins', flagValue: true }, { type: 'logAction', actionTag: 'SeaRuins' }], scriptName: 'Event_SeaRuins', isRepeatable: false, priority: 98, enabled: true, timeAdvanceMinutes: 60 },
      { id: 'evt_hidden_place', name: '地図にない場所', description: '落書きの地図が示す秘密の場所に到達', category: 'mystery', triggers: [{ type: 'flag', flagKey: 'found_map_fragment', flagValue: true }], actions: [{ type: 'setFlag', flagKey: 'unlock_hidden_place', flagValue: true }, { type: 'logAction', actionTag: 'HiddenPlace' }], scriptName: 'Event_HiddenPlace', isRepeatable: false, priority: 99, enabled: true, timeAdvanceMinutes: 45 },
    ],
  }
}

export function createDefaultEventFlow(): EventFlowData {
  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    nodes: [
      // フェーズ1: 到着・導入 (Day1-5)
      { id: 'phase1', type: 'dayStart', position: { x: 0, y: 0 }, data: { label: 'フェーズ1: 到着・導入', day: 1 } },
      { id: 'day1', type: 'dayStart', position: { x: 200, y: 100 }, data: { label: '8月1日 - 島に到着', day: 1 } },
      { id: 'evt_radio_1', type: 'event', position: { x: 500, y: 0 }, data: { label: 'ラジオ体操（初回）', day: 1, timePhase: 'Morning', category: 'routine' } },
      { id: 'evt_heroine_1', type: 'event', position: { x: 500, y: 200 }, data: { label: 'ヒロインと初めて会う', day: 1, timePhase: 'Evening', category: 'heroine' } },
      { id: 'day2', type: 'dayStart', position: { x: 200, y: 400 }, data: { label: '8月2日 - 道具入手', day: 2 } },
      { id: 'evt_bugnet', type: 'event', position: { x: 500, y: 350 }, data: { label: '虫取り網をもらう', day: 2, category: 'interaction' } },
      { id: 'evt_rod', type: 'event', position: { x: 500, y: 450 }, data: { label: '釣り竿をもらう', day: 2, category: 'interaction' } },
      // フェーズ2: 日常と交流 (Day6-12)
      { id: 'phase2', type: 'dayStart', position: { x: 0, y: 700 }, data: { label: 'フェーズ2: 日常と交流', day: 6 } },
      { id: 'day10', type: 'dayStart', position: { x: 200, y: 800 }, data: { label: '8月10日 - 倒木撤去', day: 10 } },
      { id: 'evt_fallen', type: 'event', position: { x: 500, y: 800 }, data: { label: '倒木撤去 → 森の奥解放', day: 10, category: 'exploration' } },
      // フェーズ3: 深まる絆と冒険 (Day13-19)
      { id: 'phase3', type: 'dayStart', position: { x: 0, y: 1100 }, data: { label: 'フェーズ3: 深まる絆', day: 13 } },
      { id: 'day14', type: 'dayStart', position: { x: 200, y: 1200 }, data: { label: '8月14日 - 旅行告知', day: 14 } },
      { id: 'evt_trip', type: 'event', position: { x: 500, y: 1200 }, data: { label: 'ヒロイン旅行告知', day: 14, timePhase: 'Evening', category: 'heroine' } },
      { id: 'day16', type: 'dayStart', position: { x: 200, y: 1400 }, data: { label: '8月16-19日 - ヒロイン不在', day: 16 } },
      // フェーズ4: クライマックス (Day20-27)
      { id: 'phase4', type: 'dayStart', position: { x: 0, y: 1700 }, data: { label: 'フェーズ4: クライマックス', day: 20 } },
      { id: 'day20', type: 'dayStart', position: { x: 200, y: 1800 }, data: { label: '8月20日 - ヒロイン帰還', day: 20 } },
      { id: 'evt_return', type: 'event', position: { x: 500, y: 1800 }, data: { label: 'ヒロイン帰還', day: 20, timePhase: 'Evening', category: 'heroine' } },
      { id: 'day25', type: 'dayStart', position: { x: 200, y: 2000 }, data: { label: '8月25日 - 夏祭り', day: 25 } },
      // フェーズ5: エンディング (Day28-30)
      { id: 'phase5', type: 'dayStart', position: { x: 0, y: 2300 }, data: { label: 'フェーズ5: エンディング', day: 28 } },
      { id: 'day30', type: 'dayStart', position: { x: 200, y: 2400 }, data: { label: '8月30日 - 最後の日', day: 30 } },
      { id: 'evt_lastday', type: 'event', position: { x: 500, y: 2400 }, data: { label: 'ヒロインとの別れ', day: 30, timePhase: 'Evening', category: 'heroine' } },
      { id: 'ending', type: 'ending', position: { x: 800, y: 2400 }, data: { label: 'エンディング', day: 30 } },
    ],
    edges: [
      { id: 'e_p1_d1', source: 'phase1', target: 'day1' },
      { id: 'e_d1_r', source: 'day1', target: 'evt_radio_1', data: { label: '朝' } },
      { id: 'e_d1_h', source: 'day1', target: 'evt_heroine_1', data: { label: '夕方' } },
      { id: 'e_d1_d2', source: 'evt_heroine_1', target: 'day2' },
      { id: 'e_d2_bn', source: 'day2', target: 'evt_bugnet' },
      { id: 'e_d2_rd', source: 'day2', target: 'evt_rod' },
      { id: 'e_p2', source: 'evt_rod', target: 'phase2' },
      { id: 'e_p2_d10', source: 'phase2', target: 'day10' },
      { id: 'e_d10_f', source: 'day10', target: 'evt_fallen' },
      { id: 'e_p3', source: 'evt_fallen', target: 'phase3' },
      { id: 'e_p3_d14', source: 'phase3', target: 'day14' },
      { id: 'e_d14_t', source: 'day14', target: 'evt_trip' },
      { id: 'e_t_d16', source: 'evt_trip', target: 'day16' },
      { id: 'e_p4', source: 'day16', target: 'phase4' },
      { id: 'e_p4_d20', source: 'phase4', target: 'day20' },
      { id: 'e_d20_r', source: 'day20', target: 'evt_return' },
      { id: 'e_r_d25', source: 'evt_return', target: 'day25' },
      { id: 'e_p5', source: 'day25', target: 'phase5' },
      { id: 'e_p5_d30', source: 'phase5', target: 'day30' },
      { id: 'e_d30_l', source: 'day30', target: 'evt_lastday' },
      { id: 'e_l_end', source: 'evt_lastday', target: 'ending' },
    ],
  }
}
