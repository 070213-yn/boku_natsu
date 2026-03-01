# なつのしま（C:\boku_natsu）

## 基本ルール
- 常に日本語で応答。コード内コメントも日本語
- ユーザー（やな）は非エンジニア。専門用語には簡単な説明を添える
- 可能な限り並列開発（エージェントチーム）で進める

## プロジェクト構成
- **Unity本体**: `Assets/_Project/`（C#、ゲーム本体）
- **Story Editor**: `tools/story-editor/`（React + Express、開発管理ツール）
- **企画書**: `GAME_PLAN.md` / **設計書**: `GAME_DESIGN.md`
- **進捗記録**: `PROGRESS.md`（セッション開始時に読むと現状把握できる）

## Gitルール
- コミットメッセージは日本語
- `git -C "C:/boku_natsu" add -A && git -C "C:/boku_natsu" commit -m "変更内容" && git -C "C:/boku_natsu" push`

## セッション別の参照ガイド
- **Story Editor作業** → まず `PROGRESS.md` を読む
- **Unity実装** → まず `GAME_DESIGN.md` を読む
- **企画・設計相談** → まず `GAME_PLAN.md` と `GAME_DESIGN.md` を読む
- **セッション終了時** → 大きな変更をしたら `PROGRESS.md` を更新する
