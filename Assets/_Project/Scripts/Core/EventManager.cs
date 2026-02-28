using System;
using UnityEngine;

/// <summary>
/// ゲーム全体のイベント管理シングルトン。
/// 各システム間の通信を C# の Action/event で行う。
/// 直接参照を持たずに済むので、スクリプト同士の依存を減らせる。
/// </summary>
public class EventManager : MonoBehaviour
{
    // ============================
    // シングルトン
    // ============================
    private static EventManager _instance;

    /// <summary>
    /// どこからでも EventManager.Instance でアクセスできる（シングルトン）。
    /// </summary>
    public static EventManager Instance
    {
        get
        {
            if (_instance == null)
            {
                // シーン内に EventManager がなければ自動生成する
                var go = new GameObject("EventManager");
                _instance = go.AddComponent<EventManager>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }

    private void Awake()
    {
        // すでに別のインスタンスがあれば自分を破棄する（二重生成防止）
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }

        _instance = this;
        DontDestroyOnLoad(gameObject); // シーン切り替えで消えないようにする
    }

    // ============================
    // イベント定義
    // ============================

    /// <summary>
    /// 日付が変わったときに発火する。引数は新しい日（1〜30）。
    /// 例: 8月1日→8月2日 に切り替わると OnDayChanged(2) が呼ばれる。
    /// </summary>
    public event Action<int> OnDayChanged;

    /// <summary>
    /// 時間帯が変わったときに発火する。
    /// Morning（朝）/ Noon（昼）/ Evening（夕方）/ Night（夜）の 4 段階。
    /// </summary>
    public event Action<TimePhase> OnTimePhaseChanged;

    /// <summary>
    /// プレイヤーが何かとインタラクション（話しかける、調べるなど）したときに発火する。
    /// 引数は対象の識別 ID（例: "npc_hiroine", "obj_well" など）。
    /// </summary>
    public event Action<string> OnInteraction;

    /// <summary>
    /// 行動タグが記録されたときに発火する。
    /// 日記生成や実績チェックなどに使う。
    /// 例: "fishing", "radio_exercise", "explore_shrine" など。
    /// </summary>
    public event Action<string> OnActionLogged;

    /// <summary>
    /// プレイヤーが就寝したときに発火する。
    /// 就寝→日記→翌日 の流れのきっかけになる。
    /// </summary>
    public event Action OnSleep;

    /// <summary>
    /// ヒロインがプレイヤーの近くにいる／いなくなった ときに発火する。
    /// true = 近くにいる、false = 離れた。
    /// </summary>
    public event Action<bool> OnHeroinePresenceChanged;

    // ============================
    // イベント発火メソッド
    // 他のスクリプトからこれらを呼び出してイベントを通知する
    // ============================

    /// <summary>日付変更を通知する</summary>
    public void TriggerDayChanged(int newDay)
    {
        Debug.Log($"[EventManager] 日付変更: Day {newDay}");
        OnDayChanged?.Invoke(newDay);
    }

    /// <summary>時間帯変更を通知する</summary>
    public void TriggerTimePhaseChanged(TimePhase newPhase)
    {
        Debug.Log($"[EventManager] 時間帯変更: {newPhase}");
        OnTimePhaseChanged?.Invoke(newPhase);
    }

    /// <summary>インタラクション発生を通知する</summary>
    public void TriggerInteraction(string targetId)
    {
        Debug.Log($"[EventManager] インタラクション: {targetId}");
        OnInteraction?.Invoke(targetId);
    }

    /// <summary>行動タグ記録を通知する</summary>
    public void TriggerActionLogged(string actionTag)
    {
        Debug.Log($"[EventManager] 行動記録: {actionTag}");
        OnActionLogged?.Invoke(actionTag);
    }

    /// <summary>就寝を通知する</summary>
    public void TriggerSleep()
    {
        Debug.Log("[EventManager] 就寝");
        OnSleep?.Invoke();
    }

    /// <summary>ヒロインの在/不在変更を通知する</summary>
    public void TriggerHeroinePresenceChanged(bool isPresent)
    {
        Debug.Log($"[EventManager] ヒロイン在/不在: {(isPresent ? "近くにいる" : "離れた")}");
        OnHeroinePresenceChanged?.Invoke(isPresent);
    }
}
