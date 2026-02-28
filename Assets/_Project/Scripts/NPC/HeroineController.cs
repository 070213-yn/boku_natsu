using UnityEngine;

/// <summary>
/// ヒロイン専用コントローラー。NPCBaseを継承し、特別な出現/退場ロジックと
/// 会話回数に応じた親密度変化を持つ。
///
/// 毎日夕方に堤防に現れ、夜に帰る。
/// 8/16〜8/19（Day 16〜19）は家族旅行で不在。
/// 会話を重ねるほど、よそよそしい → 打ち解ける → 親しい と変化する。
/// </summary>
public class HeroineController : NPCBase
{
    // ========== 位置設定 ==========

    /// <summary>堤防の位置（夕方にここに出現する）</summary>
    [Header("ヒロイン専用設定")]
    [SerializeField] private Transform pierPosition;

    /// <summary>自宅の位置（夜にここへ帰る）</summary>
    [SerializeField] private Transform homePosition;

    // ========== 海の方向（夕焼けを眺める向き） ==========

    /// <summary>海の方向を示すTransform（夕焼けを眺める時にこの方を向く）</summary>
    [SerializeField] private Transform seaDirection;

    // ========== 親密度・会話管理 ==========

    /// <summary>プレイヤーとの会話回数</summary>
    private int conversationCount = 0;

    /// <summary>現在堤防にいるかどうか</summary>
    private bool isAtPier = false;

    // --- 会話テキスト：親密度段階ごとに用意 ---

    /// <summary>よそよそしい段階の会話（会話0〜3回）</summary>
    [Header("段階別会話テキスト")]
    [SerializeField] private string[] distantDialogue = new string[]
    {
        "......あ、こんにちは。",
        "ここ、夕焼けがきれいなんです。",
        "......。"
    };

    /// <summary>打ち解けた段階の会話（会話4〜10回）</summary>
    [SerializeField] private string[] friendlyDialogue = new string[]
    {
        "あ、また来たんだ。",
        "今日の海、すごくきれい。",
        "ねえ、この島のこと好き？",
        "私は......毎年ここに来てるの。"
    };

    /// <summary>親しい段階の会話（会話11回以上）</summary>
    [SerializeField] private string[] closeDialogue = new string[]
    {
        "来てくれると思ってた。",
        "ねえ、夏が終わっても......覚えてる？ここのこと。",
        "あのね......私、帰りたくないな。",
        "ずっと、こうしていられたらいいのに。"
    };

    // ========== 不在期間の定義 ==========
    // 家族旅行で不在になる日（Day 16〜19 = 8/16〜8/19）
    private const int ABSENCE_START_DAY = 16;
    private const int ABSENCE_END_DAY = 19;

    // ====================================================================
    // Unity ライフサイクル
    // ====================================================================

    protected override void Awake()
    {
        base.Awake();

        // 初期会話はよそよそしい段階
        dialogueLines = distantDialogue;
    }

    protected override void Start()
    {
        base.Start();

        // ゲーム開始時は非表示にしておく（夕方になったら出現する）
        SetVisible(false);
    }

    // ====================================================================
    // 出現・退場の制御（GameManagerやTimeSystemから呼ばれる）
    // ====================================================================

    /// <summary>
    /// 時間帯が変わった時に呼ばれる。夕方に出現、夜に退場する。
    /// GameManagerのイベントから呼ぶ想定。
    /// </summary>
    /// <param name="currentDay">現在の日数（1〜30）</param>
    /// <param name="phase">現在の時間帯</param>
    public void OnTimePhaseChanged(int currentDay, TimePhase phase)
    {
        // 不在期間中は何もしない
        if (IsAbsent(currentDay))
        {
            if (isAtPier)
            {
                Leave();
            }
            return;
        }

        switch (phase)
        {
            case TimePhase.Evening:
                // 夕方：堤防に出現
                if (!isAtPier)
                {
                    AppearAtPier();
                }
                break;

            case TimePhase.Night:
                // 夜：帰宅
                if (isAtPier)
                {
                    Leave();
                }
                break;
        }
    }

    /// <summary>
    /// 堤防に出現する処理。
    /// 堤防の位置にワープし、海の方を向く（夕焼けを眺めるポーズ）。
    /// </summary>
    private void AppearAtPier()
    {
        if (pierPosition != null)
        {
            transform.position = pierPosition.position;
            transform.rotation = pierPosition.rotation;
        }

        SetVisible(true);
        isAtPier = true;

        // 海の方を向く（夕焼けを眺める）
        FaceTheSea();

        // イベント通知：ヒロインが堤防に現れた
        if (EventManager.Instance != null)
        {
            EventManager.Instance.OnHeroinePresenceChanged?.Invoke(true);
        }

        Debug.Log($"HeroineController: {npcName}が堤防に現れた");
    }

    /// <summary>
    /// 退場する処理。自宅位置に移動し、非表示にする。
    /// </summary>
    private void Leave()
    {
        isAtPier = false;
        SetVisible(false);

        if (homePosition != null)
        {
            transform.position = homePosition.position;
        }

        // イベント通知：ヒロインが帰った
        if (EventManager.Instance != null)
        {
            EventManager.Instance.OnHeroinePresenceChanged?.Invoke(false);
        }

        Debug.Log($"HeroineController: {npcName}が帰った");
    }

    // ====================================================================
    // 不在判定
    // ====================================================================

    /// <summary>
    /// 指定した日にヒロインが不在かどうかを判定する。
    /// Day 16〜19（8/16〜8/19）は家族旅行で不在。
    /// </summary>
    /// <param name="day">判定する日（1〜30）</param>
    /// <returns>不在ならtrue</returns>
    public bool IsAbsent(int day)
    {
        return day >= ABSENCE_START_DAY && day <= ABSENCE_END_DAY;
    }

    // ====================================================================
    // インタラクション（NPCBaseのオーバーライド）
    // ====================================================================

    /// <summary>
    /// プレイヤーとの会話処理。会話回数をカウントし、親密度に応じた
    /// 会話テキストに切り替える。
    /// </summary>
    public override void OnInteract(PlayerController player)
    {
        // 会話回数を増やす
        conversationCount++;

        // 親密度に応じた会話テキストを設定
        UpdateDialogueByIntimacy();

        // 基底クラスの処理を呼ぶ（プレイヤーの方を向く＋会話UI表示）
        base.OnInteract(player);

        // GameManagerに会話回数を同期（セーブ用）
        SyncConversationCount();

        Debug.Log($"HeroineController: {npcName}との会話 {conversationCount}回目");
    }

    /// <summary>
    /// 会話回数に応じて会話テキストを段階的に切り替える。
    /// - 0〜3回: よそよそしい（初対面の距離感）
    /// - 4〜10回: 打ち解けた（少し仲良くなった）
    /// - 11回以上: 親しい（特別な関係）
    /// </summary>
    private void UpdateDialogueByIntimacy()
    {
        if (conversationCount <= 3)
        {
            dialogueLines = distantDialogue;
        }
        else if (conversationCount <= 10)
        {
            dialogueLines = friendlyDialogue;
        }
        else
        {
            dialogueLines = closeDialogue;
        }
    }

    /// <summary>
    /// 親密度に基づく現在の会話テキストを返す。
    /// NPCBaseのGetCurrentDialogueLinesをオーバーライド。
    /// </summary>
    protected override string[] GetCurrentDialogueLines()
    {
        UpdateDialogueByIntimacy();
        return dialogueLines;
    }

    /// <summary>
    /// 会話回数をGameManagerに同期する。
    /// GameManagerがIntValue等で管理している想定。
    /// </summary>
    private void SyncConversationCount()
    {
        if (EventManager.Instance != null)
        {
            // GameManagerに会話回数の更新を通知
            EventManager.Instance.OnHeroineConversation?.Invoke(conversationCount);
        }
    }

    // ====================================================================
    // 向き制御
    // ====================================================================

    /// <summary>
    /// 海の方を向く（夕焼けを眺めるポーズ）。
    /// seaDirectionが設定されていればそちらを向き、
    /// なければpierPositionの正面方向を使う。
    /// </summary>
    private void FaceTheSea()
    {
        if (seaDirection != null)
        {
            // seaDirectionの方を向く（Y軸回転のみ）
            Vector3 direction = seaDirection.position - transform.position;
            direction.y = 0f;
            if (direction.sqrMagnitude > 0.001f)
            {
                transform.rotation = Quaternion.LookRotation(direction);
            }
        }
        else if (pierPosition != null)
        {
            // pierPositionの正面方向をそのまま使う
            transform.rotation = pierPosition.rotation;
        }
    }

    // ====================================================================
    // 表示制御
    // ====================================================================

    /// <summary>
    /// NPCの表示/非表示を切り替える。
    /// GameObjectのアクティブ状態を変更する。
    /// </summary>
    /// <param name="visible">表示するならtrue</param>
    private void SetVisible(bool visible)
    {
        gameObject.SetActive(visible);
    }

    // ====================================================================
    // セーブ/ロード対応
    // ====================================================================

    /// <summary>
    /// セーブデータから会話回数を復元する。
    /// ゲーム開始時やロード時に呼ぶ。
    /// </summary>
    /// <param name="count">復元する会話回数</param>
    public void LoadConversationCount(int count)
    {
        conversationCount = Mathf.Max(0, count);
        UpdateDialogueByIntimacy();
    }

    /// <summary>
    /// 現在の会話回数を取得する（セーブ用）。
    /// </summary>
    public int GetConversationCount() => conversationCount;

    /// <summary>
    /// 現在堤防にいるかどうかを取得する。
    /// </summary>
    public bool IsAtPier => isAtPier;
}
