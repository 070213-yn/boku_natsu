using UnityEngine;
using TMPro;

/// <summary>
/// インタラクション（話しかける・調べる等）を管理するシステム。
/// プレイヤーの前方にある IInteractable オブジェクトを検出し、
/// Eキーやゲームパッドボタンで実行する。
/// </summary>
public class InteractionSystem : MonoBehaviour
{
    // ========== 検出パラメータ ==========

    /// <summary>インタラクション可能な範囲（メートル）</summary>
    [Header("検出設定")]
    [SerializeField] private float interactionRange = 2.5f;

    /// <summary>インタラクション対象のレイヤー（Inspector上で設定する）</summary>
    [SerializeField] private LayerMask interactionLayer;

    /// <summary>検出の最大数（パフォーマンス制限）</summary>
    [SerializeField] private int maxDetectionCount = 10;

    // ========== UI参照 ==========

    /// <summary>「Eキーで話す」等のヒントを表示するテキスト（TextMeshPro）</summary>
    [Header("UI設定")]
    [SerializeField] private TextMeshProUGUI interactionHintText;

    // ========== 内部変数 ==========

    private PlayerController playerController;
    private IInteractable currentTarget;    // 現在検出中の対象
    private Collider[] hitBuffer;           // OverlapSphere用の再利用バッファ

    // ====================================================================
    // Unity ライフサイクル
    // ====================================================================

    private void Awake()
    {
        playerController = GetComponent<PlayerController>();
        if (playerController == null)
        {
            playerController = GetComponentInParent<PlayerController>();
        }

        // OverlapSphere の結果を受け取るバッファを事前確保（GC対策）
        hitBuffer = new Collider[maxDetectionCount];
    }

    private void Start()
    {
        // ヒントテキストを初期非表示にする
        if (interactionHintText != null)
        {
            interactionHintText.gameObject.SetActive(false);
        }
    }

    private void Update()
    {
        DetectInteractable();
        HandleInteractionInput();
    }

    // ====================================================================
    // 対象の検出
    // ====================================================================

    /// <summary>
    /// プレイヤーの周囲にある IInteractable を検出し、最も近いものを currentTarget にする。
    /// OverlapSphereNonAlloc を使い、毎フレームのメモリ確保を避けている。
    /// </summary>
    private void DetectInteractable()
    {
        // プレイヤーの位置を中心に球状に検出
        Vector3 center = transform.position + Vector3.up * 0.5f; // 少し上にずらして地面を避ける
        int hitCount = Physics.OverlapSphereNonAlloc(center, interactionRange, hitBuffer, interactionLayer);

        IInteractable closestInteractable = null;
        float closestDistance = float.MaxValue;

        for (int i = 0; i < hitCount; i++)
        {
            // IInteractable インターフェースを持つコンポーネントを探す
            IInteractable interactable = hitBuffer[i].GetComponent<IInteractable>();
            if (interactable == null) continue;

            // 距離を比較して最も近いものを選ぶ
            float distance = Vector3.Distance(transform.position, hitBuffer[i].transform.position);
            if (distance < closestDistance)
            {
                closestDistance = distance;
                closestInteractable = interactable;
            }
        }

        // 対象が変わったらUIを更新
        if (closestInteractable != currentTarget)
        {
            currentTarget = closestInteractable;
            UpdateHintUI();
        }
    }

    // ====================================================================
    // インタラクション入力
    // ====================================================================

    /// <summary>
    /// EキーまたはゲームパッドのSouthボタン（Xbox: A, PS: ×）で
    /// 検出中の対象にインタラクトする。
    /// </summary>
    private void HandleInteractionInput()
    {
        if (currentTarget == null) return;

        // Eキー または ゲームパッドの南ボタン（joystick button 0）で実行
        bool interactPressed = Input.GetKeyDown(KeyCode.E)
                            || Input.GetKeyDown(KeyCode.JoystickButton0);

        if (interactPressed)
        {
            ExecuteInteraction();
        }
    }

    /// <summary>
    /// インタラクションを実行する。
    /// 対象の OnInteract を呼び、EventManager に通知を送る。
    /// </summary>
    private void ExecuteInteraction()
    {
        if (currentTarget == null || playerController == null) return;

        // 対象のインタラクション処理を呼ぶ
        currentTarget.OnInteract(playerController);

        // EventManager にインタラクション発生を通知
        // （クエスト進行や実績解除などの他システムが反応できる）
        if (EventManager.Instance != null)
        {
            EventManager.Instance.OnInteraction?.Invoke(currentTarget);
        }
    }

    // ====================================================================
    // UIヒント表示
    // ====================================================================

    /// <summary>
    /// 検出対象に応じてヒントテキストを表示/非表示する。
    /// 例:「Eキーで話す」「Eキーで調べる」
    /// </summary>
    private void UpdateHintUI()
    {
        if (interactionHintText == null) return;

        if (currentTarget != null)
        {
            // 対象がある場合はヒントを表示
            interactionHintText.gameObject.SetActive(true);
            interactionHintText.text = $"Eキーで{currentTarget.InteractionHint}";
        }
        else
        {
            // 対象がない場合は非表示
            interactionHintText.gameObject.SetActive(false);
        }
    }

    // ====================================================================
    // デバッグ表示
    // ====================================================================

    /// <summary>
    /// Sceneビューでインタラクション範囲を可視化する（開発時のみ表示）。
    /// </summary>
    private void OnDrawGizmosSelected()
    {
        Gizmos.color = new Color(0f, 1f, 0.5f, 0.3f); // 半透明の緑
        Vector3 center = transform.position + Vector3.up * 0.5f;
        Gizmos.DrawWireSphere(center, interactionRange);
    }
}

// ========================================================================
// インタラクション可能オブジェクトのインターフェース
// ========================================================================

/// <summary>
/// インタラクション可能なオブジェクトが実装するインターフェース。
/// NPC、アイテム、看板など、プレイヤーが「話す」「調べる」できるものに付ける。
/// </summary>
public interface IInteractable
{
    /// <summary>
    /// UIに表示するヒント文。例:「話す」「調べる」「拾う」
    /// </summary>
    string InteractionHint { get; }

    /// <summary>
    /// プレイヤーがインタラクトした時に呼ばれる処理。
    /// </summary>
    /// <param name="player">インタラクトしたプレイヤー</param>
    void OnInteract(PlayerController player);
}
