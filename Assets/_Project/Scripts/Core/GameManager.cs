using System.Collections.Generic;
using UnityEngine;

// ============================
// 列挙型（enum）の定義
// enum = 選択肢をまとめたもの。数値の代わりに分かりやすい名前で状態を表せる。
// ============================

/// <summary>
/// 時間帯を表す列挙型。1日を4つの時間帯に分ける。
/// </summary>
public enum TimePhase
{
    Morning,  // 朝
    Noon,     // 昼
    Evening,  // 夕方
    Night     // 夜
}

/// <summary>
/// ゲームの状態を表す列挙型。
/// </summary>
public enum GameState
{
    Title,    // タイトル画面
    Playing,  // プレイ中
    Paused,   // 一時停止中
    Diary,    // 日記表示中
    Sleeping  // 就寝演出中
}

/// <summary>
/// ゲーム全体を管理するシングルトン。
/// 日付、ゲーム状態、フラグ（条件分岐に使うオン/オフ情報）などを一元管理する。
/// </summary>
public class GameManager : MonoBehaviour
{
    // ============================
    // シングルトン
    // ============================
    private static GameManager _instance;

    /// <summary>
    /// どこからでも GameManager.Instance でアクセスできる（シングルトン）。
    /// シングルトン = ゲーム中に1つだけ存在するオブジェクトのパターン。
    /// </summary>
    public static GameManager Instance
    {
        get
        {
            if (_instance == null)
            {
                var go = new GameObject("GameManager");
                _instance = go.AddComponent<GameManager>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }

    private void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }

        _instance = this;
        DontDestroyOnLoad(gameObject);

        // フラグとカウンターを初期状態にする
        InitializeFlags();
        InitializeIntValues();
    }

    // ============================
    // ゲーム状態
    // ============================

    /// <summary>現在のゲーム状態</summary>
    [Header("ゲーム状態")]
    [SerializeField] private GameState _currentState = GameState.Title;
    public GameState CurrentState => _currentState;

    // ============================
    // 日付管理（8月1日〜8月30日 の 30日間）
    // ============================

    /// <summary>現在の日（1〜30）。8月1日ならDay=1。</summary>
    [Header("日付管理")]
    [SerializeField] private int _currentDay = 1;
    public int CurrentDay => _currentDay;

    /// <summary>最大日数。30日目が最終日。</summary>
    public const int MaxDay = 30;

    /// <summary>現在の時間帯</summary>
    [SerializeField] private TimePhase _currentTimePhase = TimePhase.Morning;
    public TimePhase CurrentTimePhase => _currentTimePhase;

    // ============================
    // フラグ管理
    // フラグ = ゲーム内の条件分岐に使うオン/オフの情報。
    // 例: 「神社の裏門を見つけた」→ true にすると、以降そこに行けるようになる。
    // ============================

    /// <summary>bool型フラグの辞書。キー(名前)でオン/オフを管理。</summary>
    private Dictionary<string, bool> _flags = new Dictionary<string, bool>();

    /// <summary>int型カウンターの辞書。キー(名前)で数値を管理。</summary>
    private Dictionary<string, int> _intValues = new Dictionary<string, int>();

    // --- フラグのキー名を定数で定義（タイプミス防止） ---

    // 探索解放フラグ（特定の場所に行けるようになるかどうか）
    public const string Flag_ShrineBackGate  = "unlock_shrine_back_gate";  // 神社裏門
    public const string Flag_FallenTree      = "unlock_fallen_tree";       // 倒木（通れるようになる）
    public const string Flag_MountainShortcut = "unlock_mountain_shortcut"; // 山頂ショートカット
    public const string Flag_SeaTunnel       = "unlock_sea_tunnel";        // 海底トンネル
    public const string Flag_OldWell         = "unlock_old_well";          // 古井戸
    public const string Flag_SeaRuins        = "unlock_sea_ruins";         // 海底遺構

    // int型カウンターのキー名
    public const string Int_RadioStampCount     = "radio_stamp_count";      // ラジオ体操スタンプ数
    public const string Int_CatFriendship       = "cat_friendship";         // 猫なつき度
    public const string Int_HeroineConversation = "heroine_conversation";   // ヒロイン会話回数

    /// <summary>
    /// bool型フラグの初期値を設定する。
    /// ゲーム開始時は全て false（未解放）。
    /// </summary>
    private void InitializeFlags()
    {
        _flags[Flag_ShrineBackGate]   = false;
        _flags[Flag_FallenTree]       = false;
        _flags[Flag_MountainShortcut] = false;
        _flags[Flag_SeaTunnel]        = false;
        _flags[Flag_OldWell]          = false;
        _flags[Flag_SeaRuins]         = false;
    }

    /// <summary>
    /// int型カウンターの初期値を設定する。
    /// ゲーム開始時は全て 0。
    /// </summary>
    private void InitializeIntValues()
    {
        _intValues[Int_RadioStampCount]     = 0;
        _intValues[Int_CatFriendship]       = 0;
        _intValues[Int_HeroineConversation] = 0;
    }

    // ============================
    // フラグ操作メソッド
    // ============================

    /// <summary>
    /// フラグを設定する。
    /// 例: SetFlag("unlock_shrine_back_gate", true) → 神社裏門が解放される。
    /// </summary>
    public void SetFlag(string key, bool value)
    {
        _flags[key] = value;
        Debug.Log($"[GameManager] フラグ設定: {key} = {value}");
    }

    /// <summary>
    /// フラグの値を取得する。未登録のキーは false を返す。
    /// </summary>
    public bool GetFlag(string key)
    {
        if (_flags.TryGetValue(key, out bool value))
        {
            return value;
        }
        return false;
    }

    /// <summary>
    /// int型カウンターの値を取得する。未登録のキーは 0 を返す。
    /// </summary>
    public int GetIntValue(string key)
    {
        if (_intValues.TryGetValue(key, out int value))
        {
            return value;
        }
        return 0;
    }

    /// <summary>
    /// int型カウンターの値を設定する。
    /// </summary>
    public void SetIntValue(string key, int value)
    {
        _intValues[key] = value;
        Debug.Log($"[GameManager] 数値設定: {key} = {value}");
    }

    /// <summary>
    /// int型カウンターを1つ増やす。
    /// 例: IncrementIntValue("radio_stamp_count") → ラジオ体操スタンプ+1。
    /// </summary>
    public void IncrementIntValue(string key)
    {
        if (!_intValues.ContainsKey(key))
        {
            _intValues[key] = 0;
        }
        _intValues[key]++;
        Debug.Log($"[GameManager] 数値インクリメント: {key} → {_intValues[key]}");
    }

    // ============================
    // ゲーム進行メソッド
    // ============================

    /// <summary>
    /// 新しい日を開始する。
    /// 朝から始まり、EventManager に日付変更と時間帯変更を通知する。
    /// </summary>
    public void StartNewDay()
    {
        // 時間帯を朝にリセット
        _currentTimePhase = TimePhase.Morning;
        _currentState = GameState.Playing;

        Debug.Log($"[GameManager] === Day {_currentDay} 開始（8月{_currentDay}日） ===");

        // 各システムに日付変更を通知
        EventManager.Instance.TriggerDayChanged(_currentDay);
        EventManager.Instance.TriggerTimePhaseChanged(_currentTimePhase);
    }

    /// <summary>
    /// 時間帯を次に進める。
    /// Morning→Noon→Evening→Night の順。Night の次は進めない（就寝が必要）。
    /// </summary>
    public void AdvanceTimePhase()
    {
        if (_currentTimePhase >= TimePhase.Night)
        {
            Debug.Log("[GameManager] すでに夜です。就寝してください。");
            return;
        }

        _currentTimePhase++;
        Debug.Log($"[GameManager] 時間帯変更: {_currentTimePhase}");
        EventManager.Instance.TriggerTimePhaseChanged(_currentTimePhase);
    }

    /// <summary>
    /// 就寝処理を行う。
    /// 1. ゲーム状態を Sleeping に変更
    /// 2. EventManager に就寝を通知（DiarySystem などが反応する）
    /// 3. 日記表示状態に移行
    /// ※ 日記表示が終わったら FinishDiary() を呼んで翌日へ進む。
    /// </summary>
    public void GoToSleep()
    {
        if (_currentState != GameState.Playing)
        {
            Debug.LogWarning("[GameManager] プレイ中以外は就寝できません。");
            return;
        }

        _currentState = GameState.Sleeping;
        Debug.Log("[GameManager] 就寝処理開始...");

        // 就寝イベントを通知（DiarySystem が日記生成するきっかけになる）
        EventManager.Instance.TriggerSleep();

        // 就寝演出後、日記画面に移行
        _currentState = GameState.Diary;
        Debug.Log("[GameManager] 日記表示中... FinishDiary() で翌日に進みます。");
    }

    /// <summary>
    /// 日記表示を終了し、翌日に進む。
    /// 30日目を超えたらゲーム終了（エンディング処理へ）。
    /// </summary>
    public void FinishDiary()
    {
        if (_currentState != GameState.Diary)
        {
            Debug.LogWarning("[GameManager] 日記表示中でないと FinishDiary は呼べません。");
            return;
        }

        _currentDay++;

        // 最終日を超えた場合
        if (_currentDay > MaxDay)
        {
            Debug.Log("[GameManager] === 8月30日が終わりました。エンディングへ ===");
            // TODO: エンディング処理を実装する
            return;
        }

        // 翌日を開始
        StartNewDay();
    }

    /// <summary>
    /// ゲームを一時停止する。Time.timeScale を 0 にして時間を止める。
    /// timeScale = ゲーム内の時間の流れる速さ。0 = 完全停止。
    /// </summary>
    public void PauseGame()
    {
        if (_currentState != GameState.Playing)
        {
            return;
        }

        _currentState = GameState.Paused;
        Time.timeScale = 0f;
        Debug.Log("[GameManager] ゲーム一時停止");
    }

    /// <summary>
    /// ゲームの一時停止を解除する。
    /// </summary>
    public void ResumeGame()
    {
        if (_currentState != GameState.Paused)
        {
            return;
        }

        _currentState = GameState.Playing;
        Time.timeScale = 1f;
        Debug.Log("[GameManager] ゲーム再開");
    }

    // ============================
    // ユーティリティ（便利メソッド）
    // ============================

    /// <summary>
    /// 現在の日付を「8月X日」形式の文字列で返す。
    /// </summary>
    public string GetDateString()
    {
        return $"8月{_currentDay}日";
    }

    /// <summary>
    /// 現在の時間帯を日本語で返す。
    /// </summary>
    public string GetTimePhaseString()
    {
        switch (_currentTimePhase)
        {
            case TimePhase.Morning: return "朝";
            case TimePhase.Noon:    return "昼";
            case TimePhase.Evening: return "夕方";
            case TimePhase.Night:   return "夜";
            default:                return "不明";
        }
    }

    /// <summary>
    /// 最終日（30日目）かどうかを返す。
    /// </summary>
    public bool IsLastDay()
    {
        return _currentDay >= MaxDay;
    }

    /// <summary>
    /// デバッグ用: 現在の状態をログに出力する。
    /// </summary>
    [ContextMenu("デバッグ: 現在の状態を表示")]
    public void DebugPrintStatus()
    {
        Debug.Log("=== GameManager ステータス ===");
        Debug.Log($"  日付: {GetDateString()} ({GetTimePhaseString()})");
        Debug.Log($"  状態: {_currentState}");
        Debug.Log($"  ラジオ体操スタンプ: {GetIntValue(Int_RadioStampCount)}");
        Debug.Log($"  猫なつき度: {GetIntValue(Int_CatFriendship)}");
        Debug.Log($"  ヒロイン会話回数: {GetIntValue(Int_HeroineConversation)}");
        Debug.Log("  --- 探索フラグ ---");
        Debug.Log($"  神社裏門: {GetFlag(Flag_ShrineBackGate)}");
        Debug.Log($"  倒木: {GetFlag(Flag_FallenTree)}");
        Debug.Log($"  山頂ショートカット: {GetFlag(Flag_MountainShortcut)}");
        Debug.Log($"  海底トンネル: {GetFlag(Flag_SeaTunnel)}");
        Debug.Log($"  古井戸: {GetFlag(Flag_OldWell)}");
        Debug.Log($"  海底遺構: {GetFlag(Flag_SeaRuins)}");
        Debug.Log("==============================");
    }
}
