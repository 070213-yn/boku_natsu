using UnityEngine;

/// <summary>
/// NPC（ノンプレイヤーキャラクター）の基底クラス。
/// すべてのNPCはこのクラスを継承し、会話やインタラクションの基本機能を持つ。
/// IInteractable を実装しているため、InteractionSystem から検出・実行される。
/// </summary>
public class NPCBase : MonoBehaviour, IInteractable
{
    // ========== NPC基本情報 ==========

    /// <summary>NPC名（UIに表示される名前）</summary>
    [Header("NPC基本設定")]
    [SerializeField] protected string npcName = "名前未設定";

    /// <summary>NPC識別ID（セーブデータやイベント管理で使う一意のID）</summary>
    [SerializeField] protected string npcId = "npc_default";

    // ========== 会話データ ==========

    /// <summary>会話テキストの配列。上から順に表示される</summary>
    [Header("会話設定")]
    [SerializeField] protected string[] dialogueLines;

    /// <summary>現在の会話インデックス（次に表示する行）</summary>
    protected int currentDialogueIndex = 0;

    // ========== アニメーション ==========

    protected Animator animator;

    // ====================================================================
    // IInteractable インターフェースの実装
    // ====================================================================

    /// <summary>
    /// インタラクション時にUIに表示するヒント文。
    /// 例:「太郎と話す」
    /// </summary>
    public virtual string InteractionHint => $"{npcName}と話す";

    /// <summary>
    /// プレイヤーがこのNPCにインタラクトした時の処理。
    /// 会話UIを開き、プレイヤーの方を向く。
    /// </summary>
    /// <param name="player">インタラクトしたプレイヤー</param>
    public virtual void OnInteract(PlayerController player)
    {
        // プレイヤーの方を向く（Y軸回転のみ。お辞儀したりしない）
        LookAtPlayer(player.transform);

        // 会話UIを表示（DialogueUIはシングルトンで、別ファイルに定義済み）
        if (DialogueUI.Instance != null)
        {
            DialogueUI.Instance.ShowDialogue(npcName, GetCurrentDialogueLines());
        }
        else
        {
            Debug.LogWarning($"NPCBase [{npcName}]: DialogueUI.Instance が見つかりません。");
        }
    }

    // ====================================================================
    // Unity ライフサイクル
    // ====================================================================

    protected virtual void Awake()
    {
        animator = GetComponent<Animator>();
    }

    protected virtual void Start()
    {
        // 会話データが未設定の場合、デフォルトの一言を用意
        if (dialogueLines == null || dialogueLines.Length == 0)
        {
            dialogueLines = new string[] { "......" };
        }
    }

    // ====================================================================
    // 会話関連
    // ====================================================================

    /// <summary>
    /// 現在の会話テキスト配列を取得する。
    /// 子クラスでオーバーライドして、条件に応じた会話を返せる。
    /// </summary>
    /// <returns>表示する会話テキストの配列</returns>
    protected virtual string[] GetCurrentDialogueLines()
    {
        return dialogueLines;
    }

    /// <summary>
    /// 会話インデックスをリセットする（最初の行に戻す）。
    /// </summary>
    public void ResetDialogue()
    {
        currentDialogueIndex = 0;
    }

    /// <summary>
    /// 会話テキストを外部から差し替える。
    /// イベントや好感度変化で会話内容が変わる場合に使う。
    /// </summary>
    /// <param name="newLines">新しい会話テキスト配列</param>
    public void SetDialogueLines(string[] newLines)
    {
        if (newLines != null && newLines.Length > 0)
        {
            dialogueLines = newLines;
            currentDialogueIndex = 0;
        }
    }

    // ====================================================================
    // 向き制御
    // ====================================================================

    /// <summary>
    /// プレイヤーの方を向く。Y軸（水平方向）のみ回転し、上下には傾かない。
    /// </summary>
    /// <param name="playerTransform">プレイヤーのTransform</param>
    protected void LookAtPlayer(Transform playerTransform)
    {
        if (playerTransform == null) return;

        // プレイヤーへの方向ベクトルを計算
        Vector3 direction = playerTransform.position - transform.position;

        // Y成分をゼロにして水平方向のみにする
        direction.y = 0f;

        // 方向がゼロベクトルでなければ回転
        if (direction.sqrMagnitude > 0.001f)
        {
            Quaternion targetRotation = Quaternion.LookRotation(direction);
            transform.rotation = targetRotation;
        }
    }

    // ====================================================================
    // ユーティリティ
    // ====================================================================

    /// <summary>NPC名を取得する</summary>
    public string GetNpcName() => npcName;

    /// <summary>NPC IDを取得する</summary>
    public string GetNpcId() => npcId;
}
