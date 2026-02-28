using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// 日記閲覧UI。
/// DiarySystemに記録された日記テキストをページめくり形式で閲覧できる。
/// 前日/翌日ボタンで書かれた日を行き来し、
/// CanvasGroupのalphaフェードで開閉アニメーションを行う。
/// </summary>
public class DiaryUI : MonoBehaviour
{
    // ============================
    // Inspector（Unityエディタ）から設定するフィールド
    // ============================

    /// <summary>日記パネル全体のGameObject。表示/非表示を制御する。</summary>
    [Header("UI参照")]
    [SerializeField] private GameObject diaryPanel;

    /// <summary>"8月X日" を表示するテキスト</summary>
    [SerializeField] private TextMeshProUGUI dayText;

    /// <summary>日記本文を表示するテキスト</summary>
    [SerializeField] private TextMeshProUGUI entryText;

    /// <summary>前の日に戻るボタン</summary>
    [SerializeField] private Button prevButton;

    /// <summary>次の日に進むボタン</summary>
    [SerializeField] private Button nextButton;

    /// <summary>
    /// フェードアニメーション用のCanvasGroup。
    /// CanvasGroup = UI全体の透明度をまとめて制御できるコンポーネント。
    /// alphaを0→1にすると「ふわっと表示」、1→0で「ふわっと消える」。
    /// </summary>
    [Header("アニメーション設定")]
    [SerializeField] private CanvasGroup canvasGroup;

    /// <summary>フェードにかかる時間（秒）</summary>
    [SerializeField] private float fadeDuration = 0.3f;

    // ============================
    // 内部状態
    // ============================

    /// <summary>日記が書かれている日のリスト（ソート済み）</summary>
    private List<int> _writtenDays = new List<int>();

    /// <summary>現在表示中の日がリストの何番目か（インデックス）</summary>
    private int _currentIndex = 0;

    /// <summary>日記UIが開いているかどうか</summary>
    private bool _isOpen = false;

    /// <summary>フェードアニメーション中かどうか</summary>
    private bool _isFading = false;

    /// <summary>フェードアニメーションのコルーチン参照</summary>
    private Coroutine _fadeCoroutine;

    // ============================
    // 初期化
    // ============================

    private void Start()
    {
        // 日記パネルを初期状態で非表示にする
        if (diaryPanel != null)
        {
            diaryPanel.SetActive(false);
        }

        // CanvasGroupの透明度を0にしておく
        if (canvasGroup != null)
        {
            canvasGroup.alpha = 0f;
        }

        // ボタンのクリックイベントを登録
        if (prevButton != null)
        {
            prevButton.onClick.AddListener(ShowPreviousDay);
        }

        if (nextButton != null)
        {
            nextButton.onClick.AddListener(ShowNextDay);
        }
    }

    private void OnDestroy()
    {
        // ボタンイベントの登録解除（メモリリーク防止）
        if (prevButton != null)
        {
            prevButton.onClick.RemoveListener(ShowPreviousDay);
        }

        if (nextButton != null)
        {
            nextButton.onClick.RemoveListener(ShowNextDay);
        }
    }

    // ============================
    // 公開メソッド
    // ============================

    /// <summary>
    /// 日記UIを開く。DiarySystemから全エントリーを取得してページを構成する。
    /// フェードインアニメーションで表示される。
    /// </summary>
    public void OpenDiary()
    {
        if (_isOpen || _isFading) return;

        // DiarySystemから書かれた日記をすべて取得
        var allEntries = DiarySystem.Instance.GetAllEntries();

        if (allEntries.Count == 0)
        {
            Debug.Log("[DiaryUI] まだ日記が書かれていません。");
            return;
        }

        // 書かれた日だけをリストにして昇順ソート
        _writtenDays = allEntries.Keys.OrderBy(d => d).ToList();

        // 最新の日記（最後のページ）を表示
        _currentIndex = _writtenDays.Count - 1;

        // パネルを有効にしてフェードインする
        if (diaryPanel != null)
        {
            diaryPanel.SetActive(true);
        }

        UpdateDisplay();
        FadeIn();

        _isOpen = true;
        Debug.Log("[DiaryUI] 日記UIを開きました。");
    }

    /// <summary>
    /// 日記UIを閉じる。フェードアウトアニメーションで非表示になる。
    /// </summary>
    public void CloseDiary()
    {
        if (!_isOpen || _isFading) return;

        FadeOut();
        _isOpen = false;

        Debug.Log("[DiaryUI] 日記UIを閉じました。");
    }

    /// <summary>
    /// 日記UIの開閉を切り替える（トグル）。
    /// </summary>
    public void ToggleDiary()
    {
        if (_isOpen)
        {
            CloseDiary();
        }
        else
        {
            OpenDiary();
        }
    }

    // ============================
    // ページめくり
    // ============================

    /// <summary>
    /// 前の日の日記を表示する。最初のページでは何もしない。
    /// </summary>
    public void ShowPreviousDay()
    {
        if (_writtenDays.Count == 0) return;

        if (_currentIndex > 0)
        {
            _currentIndex--;
            UpdateDisplay();
        }
    }

    /// <summary>
    /// 次の日の日記を表示する。最後のページでは何もしない。
    /// </summary>
    public void ShowNextDay()
    {
        if (_writtenDays.Count == 0) return;

        if (_currentIndex < _writtenDays.Count - 1)
        {
            _currentIndex++;
            UpdateDisplay();
        }
    }

    // ============================
    // 表示更新
    // ============================

    /// <summary>
    /// 現在のインデックスに応じて日付テキストと日記本文を更新する。
    /// ボタンの有効/無効も切り替える（最初のページなら「前へ」は無効など）。
    /// </summary>
    private void UpdateDisplay()
    {
        if (_writtenDays.Count == 0) return;

        int day = _writtenDays[_currentIndex];

        // 日付表示（"8月X日"）
        if (dayText != null)
        {
            dayText.text = $"8月{day}日";
        }

        // 日記本文を表示
        string entry = DiarySystem.Instance.GetDiaryEntry(day);
        if (entryText != null)
        {
            entryText.text = entry ?? "";
        }

        // ボタンの有効/無効を更新
        // 最初のページなら「前へ」は押せない、最後のページなら「次へ」は押せない
        if (prevButton != null)
        {
            prevButton.interactable = (_currentIndex > 0);
        }

        if (nextButton != null)
        {
            nextButton.interactable = (_currentIndex < _writtenDays.Count - 1);
        }
    }

    // ============================
    // フェードアニメーション
    // CanvasGroupのalphaを0〜1で変化させて、ふわっと表示/消去する。
    // ============================

    /// <summary>
    /// フェードインを開始する（透明→不透明）。
    /// </summary>
    private void FadeIn()
    {
        if (_fadeCoroutine != null)
        {
            StopCoroutine(_fadeCoroutine);
        }
        _fadeCoroutine = StartCoroutine(FadeCanvasGroup(0f, 1f, true));
    }

    /// <summary>
    /// フェードアウトを開始する（不透明→透明）。
    /// フェード完了後にパネルを非アクティブにする。
    /// </summary>
    private void FadeOut()
    {
        if (_fadeCoroutine != null)
        {
            StopCoroutine(_fadeCoroutine);
        }
        _fadeCoroutine = StartCoroutine(FadeCanvasGroup(1f, 0f, false));
    }

    /// <summary>
    /// CanvasGroupのalphaを滑らかに変化させるコルーチン。
    /// </summary>
    /// <param name="from">開始時のalpha値（0=透明, 1=不透明）</param>
    /// <param name="to">終了時のalpha値</param>
    /// <param name="activeAfterFade">フェード完了後にパネルをアクティブにするかどうか</param>
    private IEnumerator FadeCanvasGroup(float from, float to, bool activeAfterFade)
    {
        _isFading = true;

        if (canvasGroup == null)
        {
            // CanvasGroupが設定されていない場合は即座に切り替え
            if (diaryPanel != null)
            {
                diaryPanel.SetActive(activeAfterFade);
            }
            _isFading = false;
            _fadeCoroutine = null;
            yield break;
        }

        canvasGroup.alpha = from;

        // フェード中のUI操作を無効化
        canvasGroup.interactable = false;
        canvasGroup.blocksRaycasts = false;

        float elapsed = 0f;

        while (elapsed < fadeDuration)
        {
            elapsed += Time.unscaledDeltaTime; // Time.timeScale=0でも動作するように
            float t = Mathf.Clamp01(elapsed / fadeDuration);
            canvasGroup.alpha = Mathf.Lerp(from, to, t);
            yield return null; // 次のフレームまで待つ
        }

        canvasGroup.alpha = to;

        // フェード完了後の処理
        if (activeAfterFade)
        {
            // フェードイン完了 → UI操作を有効にする
            canvasGroup.interactable = true;
            canvasGroup.blocksRaycasts = true;
        }
        else
        {
            // フェードアウト完了 → パネルを非アクティブにする
            if (diaryPanel != null)
            {
                diaryPanel.SetActive(false);
            }
        }

        _isFading = false;
        _fadeCoroutine = null;
    }
}
