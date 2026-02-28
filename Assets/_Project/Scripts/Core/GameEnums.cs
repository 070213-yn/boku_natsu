// ============================================
// GameEnums.cs
// ゲーム全体で使用するEnum定義
// 他スクリプトから共通参照される列挙型をまとめる
// ============================================

/// <summary>
/// 時間帯の区分。TimeSystemやAudioManagerなど複数箇所で参照される。
/// </summary>
public enum TimePhase
{
    Morning,  // 朝 (6:00〜11:59)
    Noon,     // 昼 (12:00〜16:59)
    Evening,  // 夕方 (17:00〜19:59) ← ゲームの核心となる時間帯
    Night     // 夜 (20:00〜翌5:59)
}

/// <summary>
/// ゲーム全体の状態管理用。シーン遷移やUI表示の制御に使う。
/// </summary>
public enum GameState
{
    Title,    // タイトル画面
    Playing,  // ゲームプレイ中
    Paused,   // ポーズ中
    Diary,    // 日記（1日の振り返り）画面
    Sleeping  // 就寝演出中
}
