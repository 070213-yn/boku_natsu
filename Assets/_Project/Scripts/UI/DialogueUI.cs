using System.Collections;
using UnityEngine;
using TMPro;

/// <summary>
/// 会話UIシステム（シングルトン）。
/// NPCとの会話テキストを1文字ずつ表示（タイプライター演出）し、
/// クリックやEキーで次の行に進む仕組み。
/// 会話中はプレイヤーの移動を止め、ゲーム内時間も一時停止する。
/// </summary>
public class DialogueUI : MonoBehaviour
{
    // ============================
    // シングルトン
    // ============================
    private static DialogueUI _instance;

    /// <summary>
    /// どこからでも DialogueUI.Instance でアクセスできる（シングルトン）。
    /// </summary>
    public static DialogueUI Instance
    {
        get
        {
            if (_instance == null)
            {
                // シーン内にDialogueUIがなければ警告を出す
                // （UIはプレハブから配置するのが望ましいため、自動生成はしない）
                Debug.LogWarning("[DialogueUI] シーン内にDialogueUIが見つかりません。" +
                    "Canvas配下にDialogueUIコンポーネントを配置してください。");
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
    }

    private void OnDestroy()
    {
        if (_instance == this)
        {
            _instance = null;
        }
    }

    // ============================
    // Inspector（Unityエディタ）から設定するフィールド
    // ============================

    /// <summary>会話パネル全体のGameObject。表示/非表示を切り替える。</summary>
    [Header("UI参照")]
    [SerializeField] private GameObject dialoguePanel;

    /// <summary>話している人の名前を表示するテキスト</summary>
    [SerializeField] private TextMeshProUGUI nameText;

    /// <summary>セリフ本文を表示するテキスト</summary>
    [SerializeField] private TextMeshProUGUI dialogueText;

    /// <summary>「次へ」を示すアイコンや矢印。全文表示後に出現する。</summary>
    [SerializeField] private GameObject nextIndicator;

    /// <summary>
    /// 1文字あたりの表示間隔（秒）。小さいほど速い。
    /// デフォルトは0.05秒（1秒に20文字）。
    /// </summary>
    [Header("タイプライター設定")]
    [SerializeField] private float typingSpeed = 0.05f;

    // ============================
    // 内部状態
    // ============================

    /// <summary>現在会話中かどうか</summary>
    private bool _isDialogueActive = false;

    /// <summary>外部から会話中かどうかを確認する用</summary>
    public bool IsDialogueActive => _isDialogueActive;

    /// <summary>現在表示中のセリフ配列</summary>
    private string[] _currentLines;

    /// <summary>現在何行目を表示しているか（0始まり）</summary>
    private int _currentLineIndex;

    /// <summary>タイプライター表示中かどうか（1文字ずつ出している最中）</summary>
    private bool _isTyping = false;

    /// <summary>タイプライター演出のコルーチン参照（途中停止用）</summary>
    private Coroutine _typingCoroutine;

    /// <summary>一時停止前のTime.timeScaleを保存しておく</summary>
    private float _previousTimeScale = 1f;

    /// <summary>プレイヤーコントローラーの参照（移動制御用）</summary>
    private PlayerController _playerController;

    // ============================
    // 初期化
    // ============================

    private void Start()
    {
        // 会話パネルを初期状態で非表示にする
        if (dialoguePanel != null)
        {
            dialoguePanel.SetActive(false);
        }

        // 「次へ」インジケーターも非表示
        if (nextIndicator != null)
        {
            nextIndicator.SetActive(false);
        }

        // プレイヤーコントローラーをシーンから探す
        _playerController = FindObjectOfType<PlayerController>();
    }

    // ============================
    // 入力処理（毎フレーム）
    // ============================

    private void Update()
    {
        // 会話中でなければ何もしない
        if (!_isDialogueActive) return;

        // クリック（左ボタン）またはEキーで進行
        bool inputDetected = Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.E);

        if (!inputDetected) return;

        if (_isTyping)
        {
            // タイプライター表示中にクリック → 全文を即表示
            SkipTyping();
        }
        else
        {
            // 全文表示済みの状態でクリック → 次の行へ（または会話終了）
            AdvanceLine();
        }
    }

    // ============================
    // 公開メソッド
    // ============================

    /// <summary>
    /// 会話を開始する。話者名とセリフの配列を渡す。
    /// 1行ずつタイプライター演出で表示し、プレイヤーの入力で進行する。
    /// </summary>
    /// <param name="speakerName">話している人の名前（例: "ヒナ", "おばあちゃん"）</param>
    /// <param name="lines">セリフの配列。1要素が1画面分のテキスト。</param>
    public void ShowDialogue(string speakerName, string[] lines)
    {
        if (lines == null || lines.Length == 0)
        {
            Debug.LogWarning("[DialogueUI] セリフが空です。会話を開始できません。");
            return;
        }

        // --- 会話開始の準備 ---
        _currentLines = lines;
        _currentLineIndex = 0;
        _isDialogueActive = true;

        // 話者名を表示
        if (nameText != null)
        {
            nameText.text = speakerName;
        }

        // 会話パネルを表示する
        if (dialoguePanel != null)
        {
            dialoguePanel.SetActive(true);
        }

        // プレイヤーの移動を止める
        SetPlayerMovement(false);

        // ゲーム内時間を一時停止する
        PauseGameTime();

        // 最初の行を表示開始
        DisplayLine(_currentLines[_currentLineIndex]);

        Debug.Log($"[DialogueUI] 会話開始: {speakerName}（{lines.Length}行）");
    }

    // ============================
    // 内部処理
    // ============================

    /// <summary>
    /// 1行分のテキストをタイプライター演出で表示する。
    /// </summary>
    /// <param name="line">表示するセリフテキスト</param>
    private void DisplayLine(string line)
    {
        // 前回のタイプライター演出が残っていたら停止
        if (_typingCoroutine != null)
        {
            StopCoroutine(_typingCoroutine);
        }

        // 「次へ」インジケーターを隠す
        if (nextIndicator != null)
        {
            nextIndicator.SetActive(false);
        }

        // タイプライター演出をコルーチンで開始
        _typingCoroutine = StartCoroutine(TypeText(line));
    }

    /// <summary>
    /// タイプライター演出のコルーチン。1文字ずつ間隔を空けて表示する。
    /// コルーチン = 処理を中断・再開できる仕組み。毎フレーム少しずつ進む。
    /// </summary>
    /// <param name="fullText">表示するテキスト全文</param>
    private IEnumerator TypeText(string fullText)
    {
        _isTyping = true;

        if (dialogueText != null)
        {
            dialogueText.text = "";
        }

        // 1文字ずつ追加していく
        foreach (char c in fullText)
        {
            if (dialogueText != null)
            {
                dialogueText.text += c;
            }

            // typingSpeed秒だけ待ってから次の文字へ
            // WaitForSecondsRealtimeを使うことで、Time.timeScale=0でも動作する
            yield return new WaitForSecondsRealtime(typingSpeed);
        }

        // 全文表示完了
        _isTyping = false;
        _typingCoroutine = null;

        // 「次へ」インジケーターを表示する
        if (nextIndicator != null)
        {
            nextIndicator.SetActive(true);
        }
    }

    /// <summary>
    /// タイプライター演出をスキップして全文を即座に表示する。
    /// </summary>
    private void SkipTyping()
    {
        // コルーチンを停止
        if (_typingCoroutine != null)
        {
            StopCoroutine(_typingCoroutine);
            _typingCoroutine = null;
        }

        _isTyping = false;

        // 現在の行の全文を一括表示
        if (dialogueText != null && _currentLines != null && _currentLineIndex < _currentLines.Length)
        {
            dialogueText.text = _currentLines[_currentLineIndex];
        }

        // 「次へ」インジケーターを表示
        if (nextIndicator != null)
        {
            nextIndicator.SetActive(true);
        }
    }

    /// <summary>
    /// 次の行に進む。最後の行だった場合は会話を終了する。
    /// </summary>
    private void AdvanceLine()
    {
        _currentLineIndex++;

        if (_currentLineIndex < _currentLines.Length)
        {
            // まだ次の行がある → 次のセリフを表示
            DisplayLine(_currentLines[_currentLineIndex]);
        }
        else
        {
            // 全行表示完了 → 会話を閉じる
            CloseDialogue();
        }
    }

    /// <summary>
    /// 会話を終了し、UIを閉じる。
    /// プレイヤーの移動を再開し、ゲーム内時間も復帰させる。
    /// </summary>
    private void CloseDialogue()
    {
        _isDialogueActive = false;
        _currentLines = null;
        _currentLineIndex = 0;

        // 会話パネルを非表示
        if (dialoguePanel != null)
        {
            dialoguePanel.SetActive(false);
        }

        // 「次へ」インジケーターを非表示
        if (nextIndicator != null)
        {
            nextIndicator.SetActive(false);
        }

        // プレイヤーの移動を再開
        SetPlayerMovement(true);

        // ゲーム内時間を復帰
        ResumeGameTime();

        Debug.Log("[DialogueUI] 会話終了");
    }

    // ============================
    // プレイヤー移動制御
    // ============================

    /// <summary>
    /// プレイヤーの移動を有効/無効にする。
    /// PlayerController.canMove を直接操作する。
    /// </summary>
    /// <param name="canMove">true = 移動可能、false = 移動停止</param>
    private void SetPlayerMovement(bool canMove)
    {
        // キャッシュがなければ再取得を試みる
        if (_playerController == null)
        {
            _playerController = FindObjectOfType<PlayerController>();
        }

        if (_playerController != null)
        {
            _playerController.canMove = canMove;
        }
        else
        {
            Debug.LogWarning("[DialogueUI] PlayerControllerが見つかりません。移動制御をスキップします。");
        }
    }

    // ============================
    // ゲーム内時間の一時停止/復帰
    // ============================

    /// <summary>
    /// ゲーム内時間を一時停止する。
    /// Time.timeScale（ゲーム全体の時間の流れる速さ）を0にして止める。
    /// </summary>
    private void PauseGameTime()
    {
        _previousTimeScale = Time.timeScale;
        Time.timeScale = 0f;
        Debug.Log("[DialogueUI] ゲーム内時間を一時停止しました。");
    }

    /// <summary>
    /// ゲーム内時間を復帰させる。
    /// 会話開始前のtimeScaleに戻す。
    /// </summary>
    private void ResumeGameTime()
    {
        Time.timeScale = _previousTimeScale;
        Debug.Log("[DialogueUI] ゲーム内時間を復帰しました。");
    }
}
