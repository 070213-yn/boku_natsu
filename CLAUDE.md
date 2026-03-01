# ぼくのなつやすみ風ゲーム「なつのしま」開発ルール

## 言語設定
- 常に日本語で応答してください
- コード内のコメントも日本語で書いてください

## プロジェクト構成
- **ゲーム本体**: Unity (C#) - `Assets/_Project/`
- **開発管理ツール**: Story Editor (React + Express) - `tools/story-editor/`
- **ゲームデータJSON**: `Assets/_Project/Data/`

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

### イベント追加時のルール
- 新規イベント作成 → Story Editorでトリガー・アクションを設定 → C#同期
- 生成されるスクリプトは `MonoBehaviour` を継承、`ExecuteEvent()` コルーチンでアクション実行
- トリガー条件: `EventManager` のイベント購読で判定（日付変更、時間帯変更）
- フラグ/数値条件: `GameManager.Instance.GetFlag()` / `GetIntValue()` で判定

### 手動でイベントスクリプトを編集する場合
1. 自動生成後のファイルから `// [AUTO-GENERATED]` 行を削除
2. 以降はStory Editorの同期対象外になる
3. 手動編集ファイルは `[AUTO-GENERATED]` マーカーがないためスキップされる

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
