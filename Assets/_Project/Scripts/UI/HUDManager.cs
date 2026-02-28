using System.Collections;
using UnityEngine;
using TMPro;

/// <summary>
/// ゲーム中の常時表示UI（HUD）を管理する。
/// HUD = Heads-Up Display。画面上に常に表示される情報（日付、時間帯、時刻など）。
/// EventManagerのイベントを購読して、日付や時間帯が変わったら自動的にテキストを更新する。
/// </summary>
public class HUDManager : MonoBehaviour
{
    // ============================
    // Inspector（Unityエディタ）から設定するフィールド
    // ============================

    /// <summary>"8月1日" などの日付を表示するテキスト</summary>
    [Header("日付・時刻表示")]
    [SerializeField] private TextMeshProUGUI dayText;

    /// <summary>"朝" "昼" "夕方" "夜" などの時間帯を表示するテキスト</summary>
    [SerializeField] private TextMeshProUGUI timeText;

    /// <summary>"7:00" などの時刻を表示するテキスト</summary>
    [SerializeField] private TextMeshProUGUI clockText;

    /// <summary>
    /// HUD全体のフェードイン/アウトに使うCanvasGroup。
    /// CanvasGroup = UI全体の透明度をまとめて制御できるコンポーネント。
    /// </summary>
    [Header("フェード設定")]
    [SerializeField] private CanvasGroup canvasGroup;

    /// <summary>フェードにかかる時間（秒）</summary>
    [SerializeField] private float fadeDuration = 0.5f;

    // ============================
    // 内部状態
    // ============================

    /// <summary>フェードアニメーションのコルーチン参照</summary>
    private Coroutine _fadeCoroutine;

    // ============================
    // 時間帯ごとの代表時刻テーブル
    // 時間帯が変わったとき、時計に表示するデフォルト時刻。
    // ============================

    /// <summary>
    /// 時間帯（TimePhase）を時計表示用の文字列に変換する。
    /// </summary>
    /// <param name="phase">時間帯</param>
    /// <returns>時計用テキスト（例: "7:00"）</returns>
    private string GetClockTextForPhase(TimePhase phase)
    {
        switch (phase)
        {
            case TimePhase.Morning: return "7:00";
            case TimePhase.Noon:    return "12:00";
            case TimePhase.Evening: return "17:00";
            case TimePhase.Night:   return "20:00";
            default:                return "--:--";
        }
    }

    /// <summary>
    /// 時間帯（TimePhase）を日本語テキストに変換する。
    /// </summary>
    /// <param name="phase">時間帯</param>
    /// <returns>日本語の時間帯名（例: "朝"）</returns>
    private string GetTimePhaseName(TimePhase phase)
    {
        switch (phase)
        {
            case TimePhase.Morning: return "朝";
            case TimePhase.Noon:    return "昼";
            case TimePhase.Evening: return "夕方";
            case TimePhase.Night:   return "夜";
            default:                return "不明";
        }
    }

    // ============================
    // 初期化・イベント購読
    // ============================

    private void OnEnable()
    {
        // EventManagerのイベントを購読する
        // 日付が変わったとき → 日付テキストを更新
        EventManager.Instance.OnDayChanged += HandleDayChanged;
        // 時間帯が変わったとき → 時間帯テキストと時計を更新
        EventManager.Instance.OnTimePhaseChanged += HandleTimePhaseChanged;
    }

    private void OnDisable()
    {
        // イベント購読を解除（メモリリーク防止）
        EventManager.Instance.OnDayChanged -= HandleDayChanged;
        EventManager.Instance.OnTimePhaseChanged -= HandleTimePhaseChanged;
    }

    private void Start()
    {
        // ゲーム開始時の初期表示を設定する
        // GameManagerから現在の日付と時間帯を取得して表示
        UpdateDayDisplay(GameManager.Instance.CurrentDay);
        UpdateTimeDisplay(GameManager.Instance.CurrentTimePhase);

        // CanvasGroupがあれば初期状態で完全に表示
        if (canvasGroup != null)
        {
            canvasGroup.alpha = 1f;
        }
    }

    // ============================
    // イベントハンドラ
    // ============================

    /// <summary>
    /// 日付変更イベントのハンドラ。新しい日が来たら日付テキストを更新する。
    /// </summary>
    /// <param name="newDay">新しい日（1〜30）</param>
    private void HandleDayChanged(int newDay)
    {
        UpdateDayDisplay(newDay);
        Debug.Log($"[HUDManager] 日付表示更新: 8月{newDay}日");
    }

    /// <summary>
    /// 時間帯変更イベントのハンドラ。時間帯が変わったらテキストと時計を更新する。
    /// </summary>
    /// <param name="newPhase">新しい時間帯</param>
    private void HandleTimePhaseChanged(TimePhase newPhase)
    {
        UpdateTimeDisplay(newPhase);
        Debug.Log($"[HUDManager] 時間帯表示更新: {GetTimePhaseName(newPhase)}");
    }

    // ============================
    // 表示更新メソッド
    // ============================

    /// <summary>
    /// 日付テキストを更新する。
    /// </summary>
    /// <param name="day">日（1〜30）</param>
    private void UpdateDayDisplay(int day)
    {
        if (dayText != null)
        {
            dayText.text = $"8月{day}日";
        }
    }

    /// <summary>
    /// 時間帯テキストと時計テキストを更新する。
    /// </summary>
    /// <param name="phase">時間帯</param>
    private void UpdateTimeDisplay(TimePhase phase)
    {
        // 時間帯名（朝/昼/夕方/夜）
        if (timeText != null)
        {
            timeText.text = GetTimePhaseName(phase);
        }

        // 時計（7:00 / 12:00 / 17:00 / 20:00）
        if (clockText != null)
        {
            clockText.text = GetClockTextForPhase(phase);
        }
    }

    // ============================
    // 時計の直接設定（TimeSystemとの連携用）
    // ============================

    /// <summary>
    /// 時計テキストを直接設定する。
    /// TimeSystemがリアルタイムに時刻を進める場合に使う。
    /// </summary>
    /// <param name="hours">時（0〜23）</param>
    /// <param name="minutes">分（0〜59）</param>
    public void SetClockTime(int hours, int minutes)
    {
        if (clockText != null)
        {
            clockText.text = $"{hours}:{minutes:D2}";
        }
    }

    // ============================
    // フェードイン/アウト
    // HUDを一時的に消したい場合（イベント演出時など）に使う。
    // ============================

    /// <summary>
    /// HUDをフェードインする（透明→不透明に徐々に表示）。
    /// </summary>
    public void FadeIn()
    {
        if (_fadeCoroutine != null)
        {
            StopCoroutine(_fadeCoroutine);
        }
        _fadeCoroutine = StartCoroutine(FadeCanvasGroup(0f, 1f));
    }

    /// <summary>
    /// HUDをフェードアウトする（不透明→透明に徐々に消える）。
    /// </summary>
    public void FadeOut()
    {
        if (_fadeCoroutine != null)
        {
            StopCoroutine(_fadeCoroutine);
        }
        _fadeCoroutine = StartCoroutine(FadeCanvasGroup(1f, 0f));
    }

    /// <summary>
    /// CanvasGroupのalphaを滑らかに変化させるコルーチン。
    /// </summary>
    /// <param name="from">開始時のalpha値（0=透明, 1=不透明）</param>
    /// <param name="to">終了時のalpha値</param>
    private IEnumerator FadeCanvasGroup(float from, float to)
    {
        if (canvasGroup == null)
        {
            Debug.LogWarning("[HUDManager] CanvasGroupが設定されていません。フェード処理をスキップします。");
            _fadeCoroutine = null;
            yield break;
        }

        canvasGroup.alpha = from;
        float elapsed = 0f;

        while (elapsed < fadeDuration)
        {
            elapsed += Time.unscaledDeltaTime; // Time.timeScale=0でも動作する
            float t = Mathf.Clamp01(elapsed / fadeDuration);
            canvasGroup.alpha = Mathf.Lerp(from, to, t);
            yield return null; // 次のフレームまで待つ
        }

        canvasGroup.alpha = to;
        _fadeCoroutine = null;
    }
}
