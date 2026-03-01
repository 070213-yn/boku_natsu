# ぼくのなつやすみ風ゲーム「なつのしま」開発ルール

## 言語設定
- 常に日本語で応答してください
- コード内のコメントも日本語で書いてください

## プロジェクト構成
- **ゲーム本体**: Unity (C#) - `Assets/_Project/`
- **開発管理ツール**: Story Editor (React + Express) - `tools/story-editor/`
- **ゲームデータJSON**: `Assets/_Project/Data/`
- **企画書**: `GAME_PLAN.md`
- **設計決定事項**: `GAME_DESIGN.md`（時間システム・操作・UI等の全決定事項）

## ゲーム設計の要点（詳細は GAME_DESIGN.md）

### 時間システム
- **行動ベース**: 時間は基本停止。エリア移動とイベント/お手伝いでのみ進む
- アクティビティ（虫取り・釣り等）、会話、待機中は時間が進まない
- 速度4段階: はやい(x1.5)、ふつう(x1.0)、おそい(x0.6)、すごくおそい(x0.3)
- 時間帯: Morning(6-12), Noon(12-17), Evening(17-20), Night(20-6)

### 主人公・視点
- 三人称固定カメラ、男の子、小学3年生、名前はプレイヤー入力、フルボイス
- 島に来た理由: 両親の仕事の都合で親戚の家にお世話になる

### 操作（PC専用、モバイル非対応）
- WASD移動、Space=ジャンプ、Shift=ダッシュ、左クリック=調べる
- Tab=メニュー（図鑑/虫篭/地図/持ち物/お財布）
- Escape=保存・終了・設定

### マップ・セーブ
- エリア分割（約10エリア）、段階的解放、ミニマップなし
- いつでもセーブ + オートセーブ、スロット3つ、周回なし、複数エンディング

### テキスト
- 日記は主人公一人称、漢字混じり＋全漢字にふりがな

## Unity C# コーディング規約
- シングルトンパターン: `GameManager.Instance`, `EventManager.Instance`, `DialogueUI.Instance`
- フラグ命名: `Flag_xxxxx`（bool）、`Int_xxxxx`（int）
- フラグAPI: `GameManager.Instance.SetFlag()` / `GetFlag()` / `SetIntValue()` / `GetIntValue()` / `IncrementIntValue()`
- 時間帯: `Morning`, `Noon`, `Evening`, `Night`（TimePhase enum）
- イベント通信: `EventManager.Instance.OnDayChanged`, `OnTimePhaseChanged` 等

## イベント同期ワークフロー（重要）
Story Editorで管理するイベントデータ（`Assets/_Project/Data/EventList.json`）から、
UnityのC#スクリプトを自動生成する仕組みがあります。

### 自動生成の仕組み
1. Story Editor の「イベント一覧」ページでイベントを追加・編集
2. 「C#同期」ボタンで `POST /api/events/sync` を呼び出し
3. サーバーが `Assets/_Project/Scripts/Events/` に C# スクリプトを自動生成
4. 自動生成マーカー `// [AUTO-GENERATED]` のあるファイルのみ上書き対象
5. マーカーを削除したファイルは手動編集として保護される

## JSON データファイル一覧
| ファイル名 | 内容 |
|---|---|
| `EventFlow.json` | ストーリー分岐（ノード+エッジ） |
| `EventList.json` | イベント一覧（スクリプト自動生成の元データ） |
| `DialogueData.json` | NPC会話（段階別） |
| `DiaryActions.json` | 行動タグ+日記テキスト |
| `ExplorationFlags.json` | 探索解放条件+フラグ定義 |
| `GameConfig.json` | ゲーム全体設定 |

## Story Editor の起動方法
```bash
cd tools/story-editor
npm run dev
# フロントエンド: http://localhost:5173
# バックエンド: http://localhost:3001
```

## Git ルール
- コミットメッセージは日本語
- コマンド: `git -C "C:/boku_natsu" add -A && git -C "C:/boku_natsu" commit -m "変更内容" && git -C "C:/boku_natsu" push`
