using System.Collections.Generic;
using System.Linq;
using UnityEngine;

/// <summary>
/// 日記システム（シングルトン）。
/// プレイヤーの1日の行動を記録し、就寝時に1行日記を自動生成する。
/// 行動タグ（例: "Fishing", "TalkHeroine"）を蓄積して、
/// その日のハイライトを日記テキストとしてまとめる仕組み。
/// </summary>
public class DiarySystem : MonoBehaviour
{
    // ============================
    // シングルトン
    // ============================
    private static DiarySystem _instance;

    /// <summary>
    /// どこからでも DiarySystem.Instance でアクセスできる（シングルトン）。
    /// </summary>
    public static DiarySystem Instance
    {
        get
        {
            if (_instance == null)
            {
                var go = new GameObject("DiarySystem");
                _instance = go.AddComponent<DiarySystem>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }

    private void Awake()
    {
        // 二重生成防止
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }

        _instance = this;
        DontDestroyOnLoad(gameObject);
    }

    // ============================
    // データ
    // ============================

    /// <summary>今日記録された行動タグの一覧（重複なし）</summary>
    private List<string> _todayActions = new List<string>();

    /// <summary>今日の行動一覧を外部から参照する用（読み取り専用）</summary>
    public List<string> todayActions => new List<string>(_todayActions);

    /// <summary>
    /// 日付ごとの日記テキスト。キーは日（1〜30）、値は日記の1行テキスト。
    /// </summary>
    public Dictionary<int, string> diaryEntries { get; private set; } = new Dictionary<int, string>();

    // ============================
    // 行動タグの優先度テーブル
    // 複数の行動があったとき、どれを「一番印象的」とするかの順位。
    // 数字が大きいほど優先される（日記に採用されやすい）。
    // ============================

    /// <summary>行動タグ→日記テキストの変換辞書</summary>
    private static readonly Dictionary<string, string> ActionToDiaryText = new Dictionary<string, string>
    {
        { "TalkHeroine",   "夕方、堤防であの子と話した。" },
        { "DidDelivery",   "今日は配達のバイトをした。" },
        { "Fishing",       "防波堤で釣りをした。" },
        { "BugCatch",      "虫取りに夢中になった。" },
        { "ShrineClean",   "神社の掃除を手伝った。" },
        { "RadioExercise", "朝のラジオ体操に参加した。" },
        { "FedCat",        "野良猫にごはんをあげた。" },
        { "NightDive",     "夜の海に飛び込んだ。星がきれいだった。" },
        { "FoundDiary",    "古い日記を見つけた。誰のだろう。" },
    };

    /// <summary>
    /// 行動タグの「印象度」順位。値が大きいほど日記に採用されやすい。
    /// 特別なイベント（FoundDiary, NightDive）を上位にしている。
    /// </summary>
    private static readonly Dictionary<string, int> ActionPriority = new Dictionary<string, int>
    {
        { "FoundDiary",    100 },  // ストーリーに関わる重要イベント
        { "NightDive",      90 },  // 特別な体験
        { "TalkHeroine",    80 },  // ヒロインとの会話
        { "ShrineClean",    60 },  // 日常だが印象的
        { "DidDelivery",    50 },  // バイト
        { "Fishing",        40 },  // 遊び
        { "BugCatch",       35 },  // 遊び
        { "FedCat",         30 },  // ちょっとした行動
        { "RadioExercise",  20 },  // 毎朝の日課
    };

    // ============================
    // イベント購読
    // ============================

    private void OnEnable()
    {
        // 就寝イベントを購読して、寝るときに日記を自動生成する
        EventManager.Instance.OnSleep += HandleSleep;
    }

    private void OnDisable()
    {
        // イベント購読を解除（メモリリーク防止）
        if (_instance == this)
        {
            EventManager.Instance.OnSleep -= HandleSleep;
        }
    }

    /// <summary>
    /// 就寝時に呼ばれるハンドラ。今日の日記を生成してリセットする。
    /// </summary>
    private void HandleSleep()
    {
        int currentDay = GameManager.Instance.CurrentDay;
        GenerateDiaryEntry(currentDay);
        Debug.Log($"[DiarySystem] Day {currentDay} の日記を生成しました。");
    }

    // ============================
    // 公開メソッド
    // ============================

    /// <summary>
    /// 行動タグを記録する。同じタグは1日に1回しか記録されない（重複排除）。
    /// 記録後、EventManager.OnActionLogged を発火して他システムに通知する。
    /// </summary>
    /// <param name="actionTag">行動の種類を表す文字列（例: "Fishing", "TalkHeroine"）</param>
    public void LogAction(string actionTag)
    {
        if (string.IsNullOrEmpty(actionTag))
        {
            Debug.LogWarning("[DiarySystem] 空の行動タグは記録できません。");
            return;
        }

        // 重複排除: 同じタグがすでにあれば無視する
        if (_todayActions.Contains(actionTag))
        {
            Debug.Log($"[DiarySystem] 行動タグ '{actionTag}' はすでに記録済みです。");
            return;
        }

        _todayActions.Add(actionTag);
        Debug.Log($"[DiarySystem] 行動タグ記録: {actionTag}（本日計 {_todayActions.Count} 件）");

        // EventManagerに行動記録を通知する
        EventManager.Instance.TriggerActionLogged(actionTag);
    }

    /// <summary>
    /// 行動タグのリストから、その日の日記テキストを生成して保存する。
    /// 複数の行動がある場合は「印象度」が最も高いものを1行で採用する。
    /// 何も行動がなければ「今日は静かな一日だった。」になる。
    /// </summary>
    /// <param name="day">日付（1〜30）</param>
    public void GenerateDiaryEntry(int day)
    {
        string entryText;

        if (_todayActions.Count == 0)
        {
            // 何もしなかった日
            entryText = "今日は静かな一日だった。";
        }
        else
        {
            // 最も印象的な行動を選ぶ（優先度テーブルで比較）
            string bestAction = _todayActions
                .OrderByDescending(tag =>
                {
                    // 優先度テーブルにあればその値、なければデフォルト10
                    return ActionPriority.ContainsKey(tag) ? ActionPriority[tag] : 10;
                })
                .First();

            // 対応する日記テキストがあればそれを使い、なければ汎用テキスト
            if (ActionToDiaryText.ContainsKey(bestAction))
            {
                entryText = ActionToDiaryText[bestAction];
            }
            else
            {
                entryText = $"今日は「{bestAction}」をした。";
            }
        }

        // 日記を保存
        diaryEntries[day] = entryText;
        Debug.Log($"[DiarySystem] Day {day} 日記: {entryText}");

        // 翌日に備えて今日の行動をリセット
        ClearTodayActions();
    }

    /// <summary>
    /// 今日の行動タグをすべてクリアする。翌日の開始時に呼ばれる。
    /// </summary>
    public void ClearTodayActions()
    {
        _todayActions.Clear();
        Debug.Log("[DiarySystem] 今日の行動タグをリセットしました。");
    }

    /// <summary>
    /// 指定した日の日記テキストを取得する。
    /// まだ書かれていない日は null を返す。
    /// </summary>
    /// <param name="day">日付（1〜30）</param>
    /// <returns>日記テキスト、または null</returns>
    public string GetDiaryEntry(int day)
    {
        if (diaryEntries.TryGetValue(day, out string entry))
        {
            return entry;
        }
        return null;
    }

    /// <summary>
    /// 全日記エントリーのコピーを返す。UI表示などに使う。
    /// </summary>
    /// <returns>日付→日記テキストの辞書（コピー）</returns>
    public Dictionary<int, string> GetAllEntries()
    {
        return new Dictionary<int, string>(diaryEntries);
    }
}
