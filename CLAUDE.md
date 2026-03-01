# なつのしま 開発ガイド

> このファイルはClaude Codeが新しい会話を始めるたびに自動で読み込みます。
> プロジェクトの全体像と現状を常に把握できるようにしておくためのファイルです。

## 言語・ユーザー設定
- 常に日本語で応答
- コード内コメントも日本語
- ユーザー（やな）は非エンジニア。専門用語には簡単な説明を添える
- 可能な限り並列開発（エージェントチーム）で進める

## プロジェクト構成
```
C:\boku_natsu\
├── Assets/_Project/          # Unity ゲーム本体 (C#)
│   ├── Scripts/Events/       # C#イベントスクリプト（自動生成先）
│   └── Data/                 # JSONデータ（Story Editorから書き出し）
├── tools/story-editor/       # 開発管理ツール (React + Express + TypeScript)
│   ├── src/pages/            # 各エディタページ
│   ├── src/components/       # UIコンポーネント
│   ├── src/hooks/useStores.ts # Zustandデータストア（7種類）
│   ├── src/types/            # TypeScript型定義
│   ├── server/               # Express APIサーバー（port 3001）
│   └── data/                 # JSONデータ保存先
├── CLAUDE.md                 # ← このファイル
├── GAME_PLAN.md              # ゲーム企画書
├── GAME_DESIGN.md            # 設計決定事項
└── PROGRESS.md               # 開発進捗の記録
```

## Story Editor ページ一覧
| パス | ページ名 | 概要 |
|------|---------|------|
| `/` | ダッシュボード | 統計・クイックアクション |
| `/event-flow` | ストーリー分岐 | ReactFlowフローチャート |
| `/events` | イベント一覧 | トリガー・アクション編集 + C#自動生成 |
| `/dialogue` | 会話テキスト | NPC会話の段階別編集 |
| `/characters` | キャラクター | プロフィール・画像・特別やり取り管理 |
| `/timeline` | タイムライン | 30日間のイベント配置 |
| `/diary` | 日記システム | 行動タグ + 日記テキスト |
| `/flags` | フラグ管理 | 探索フラグ・カウンター定義 |
| `/settings` | 設定 | ゲーム全体設定 |

## データストア（Zustand、7種類）
| ストア | ファイル名 | 内容 |
|--------|-----------|------|
| useEventFlowStore | EventFlow.json | ストーリー分岐ノード・エッジ |
| useEventListStore | EventList.json | イベント定義（C#生成元） |
| useDialogueStore | DialogueData.json | NPC会話データ |
| useDiaryStore | DiaryActions.json | 日記アクション |
| useExplorationStore | ExplorationFlags.json | 探索フラグ・カウンター |
| useGameConfigStore | GameConfig.json | ゲーム全体設定 |
| useCharacterStore | CharacterData.json | キャラクタープロフィール |

## 開発状況（最新はPROGRESS.mdを参照）

### 完了済み
- Story Editor基盤（React + Express + Zustand + ReactFlow）
- ダッシュボード、ストーリー分岐、イベント一覧（C#同期付き）
- 会話テキスト、タイムライン、日記システム、フラグ管理、設定
- キャラクター設定ページ（プロフィール・画像・特別やり取り・名前伝播）
- 画像アップロードAPI（multer）

### 未着手
- Unity側のゲーム実装（プレイヤー移動、カメラ、イベント実行エンジン等）
- 音声・BGM・効果音システム
- UI実装（会話UI、図鑑UI、日記UI、メニューUI）
- 3Dモデル・マップ・アニメーション

## ゲーム概要（詳細はGAME_PLAN.md、GAME_DESIGN.md）
- 「なつのしま」: ぼくのなつやすみ風ノスタルジーADV
- 30日間の島生活、行動ベース時間システム
- PC専用、Unity (C#)、三人称固定カメラ
- 9人のNPC + ヒロイン（ヒナ）
- 段階的エリア解放、複数エンディング

## C#コーディング規約
- シングルトン: `GameManager.Instance`, `EventManager.Instance`, `DialogueUI.Instance`
- フラグ: `Flag_xxxxx` (bool), `Int_xxxxx` (int)
- 自動生成マーカー: `// [AUTO-GENERATED]`（削除で手動編集保護）

## イベント同期ワークフロー
1. Story Editorでイベント編集 → 「C#同期」ボタン
2. `POST /api/events/sync` → `Assets/_Project/Scripts/Events/` にC#生成
3. `// [AUTO-GENERATED]` マーカーで上書き制御

## Story Editor 起動
```bash
cd C:\boku_natsu\tools\story-editor && npm run dev
```

## Git ルール
- コミットメッセージは日本語
- `git -C "C:/boku_natsu" add -A && git -C "C:/boku_natsu" commit -m "変更内容" && git -C "C:/boku_natsu" push`
