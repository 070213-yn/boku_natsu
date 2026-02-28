// ============================================
// TimeSystem.cs
// ゲーム内時間の管理システム
// 時刻の進行、時間帯の判定、ライティング制御を担当
// ============================================

using UnityEngine;

/// <summary>
/// ゲーム内の1日(24時間)を管理するシステム。
/// 時間帯ごとにライティングを変化させ、夕方には特別な演出を行う。
/// </summary>
public class TimeSystem : MonoBehaviour
{
    // --------------------------------------------------
    // インスペクターで設定するフィールド
    // （SerializeFieldはUnityエディタ上で値を設定できるようにする属性）
    // --------------------------------------------------

    [Header("--- 時間設定 ---")]
    [Tooltip("現在の時刻（0〜24の小数）。6.5 = 午前6時30分")]
    [SerializeField] private float currentHour = 6.0f;

    [Tooltip("ゲーム内1時間が現実何秒か。60なら現実60秒=ゲーム1時間（1日=24分）")]
    [SerializeField] private float timeScale = 60f;

    [Tooltip("現在のゲーム内日数（1〜30）")]
    [SerializeField] private int currentDay = 1;

    [Tooltip("ゲーム全体の日数上限")]
    [SerializeField] private int maxDays = 30;

    [Header("--- ライティング ---")]
    [Tooltip("シーン上のDirectional Light（太陽）をここにドラッグ＆ドロップ")]
    [SerializeField] private Light directionalLight;

    [Header("--- ライト色の設定（時間帯別） ---")]
    [SerializeField] private Color morningColor  = new Color(1.0f, 0.95f, 0.85f); // 暖かい白
    [SerializeField] private Color noonColor     = new Color(1.0f, 1.0f, 0.95f);  // 白
    [SerializeField] private Color eveningColor  = new Color(1.0f, 0.6f, 0.3f);   // オレンジ
    [SerializeField] private Color nightColor    = new Color(0.2f, 0.2f, 0.4f);   // 青暗い

    [Header("--- ライト角度の設定（時間帯別、X軸回転） ---")]
    [SerializeField] private float morningAngle  = 30f;
    [SerializeField] private float noonAngle     = 80f;
    [SerializeField] private float eveningAngle  = 15f;
    [SerializeField] private float nightAngle    = -10f;

    // --------------------------------------------------
    // 公開プロパティ
    // --------------------------------------------------

    /// <summary>現在の時刻（0〜24）</summary>
    public float CurrentHour => currentHour;

    /// <summary>現在の日数（1〜30）</summary>
    public int CurrentDay => currentDay;

    /// <summary>最大日数</summary>
    public int MaxDays => maxDays;

    /// <summary>時間が停止中かどうか（会話中・イベント中など）</summary>
    public bool IsTimePaused => isTimePaused;

    /// <summary>
    /// 現在の時間帯を返すプロパティ。
    /// 時刻から Morning / Noon / Evening / Night を判定する。
    /// </summary>
    public TimePhase CurrentPhase
    {
        get
        {
            if (currentHour >= 6f  && currentHour < 12f) return TimePhase.Morning;
            if (currentHour >= 12f && currentHour < 17f) return TimePhase.Noon;
            if (currentHour >= 17f && currentHour < 20f) return TimePhase.Evening;
            return TimePhase.Night; // 20:00〜翌5:59
        }
    }

    // --------------------------------------------------
    // 内部変数
    // --------------------------------------------------

    private bool isTimePaused = false;

    // 前フレームの時間帯を記憶し、切り替わりを検出する
    private TimePhase previousPhase;

    // 夕方チャイムを1日1回だけ鳴らすためのフラグ
    private bool hasPlayedEveningChimeToday = false;

    // 夕方ライトの色を毎日微妙に変えるためのオフセット
    private Color dailyEveningColorOffset;

    // --------------------------------------------------
    // Unity ライフサイクル
    // --------------------------------------------------

    private void Start()
    {
        previousPhase = CurrentPhase;

        // 日ごとの夕方色バリエーションを生成
        GenerateDailyEveningVariation();

        // 初期ライティングを即座に反映（Lerpではなく一発設定）
        if (directionalLight != null)
        {
            ApplyLightingImmediate();
        }
    }

    private void Update()
    {
        if (!isTimePaused)
        {
            AdvanceTime();
        }

        // ライティングを毎フレーム滑らかに更新
        UpdateLighting();

        // 時間帯の変化を検出
        DetectPhaseChange();
    }

    // --------------------------------------------------
    // 時間進行
    // --------------------------------------------------

    /// <summary>
    /// 毎フレーム呼ばれ、時刻を進める。
    /// timeScaleが60なら、現実60秒でゲーム内1時間が経過する。
    /// </summary>
    private void AdvanceTime()
    {
        // 1フレームあたりの時間進行量を計算
        // deltaTime(秒) / timeScale(秒/ゲーム時間) = ゲーム内の時間経過
        float hoursPerSecond = 1f / timeScale;
        currentHour += hoursPerSecond * Time.deltaTime;

        // 24時を超えたら翌日へ
        if (currentHour >= 24f)
        {
            currentHour -= 24f;
            OnNewDay();
        }
    }

    /// <summary>
    /// 日付が変わった時の処理。
    /// </summary>
    private void OnNewDay()
    {
        currentDay++;
        hasPlayedEveningChimeToday = false;

        // 新しい日の夕方色バリエーションを生成
        GenerateDailyEveningVariation();

        if (currentDay > maxDays)
        {
            // 30日が終了 → ゲーム終了処理へ
            Debug.Log($"[TimeSystem] {maxDays}日間の島生活が終わりました。");
            // EventManager等でエンディングを呼ぶ想定
            // EventManager.Instance.OnGameEnd?.Invoke();
        }
        else
        {
            Debug.Log($"[TimeSystem] {currentDay}日目の朝が来ました。");
        }
    }

    // --------------------------------------------------
    // 時間帯の変化検出
    // --------------------------------------------------

    /// <summary>
    /// 時間帯(Phase)が切り替わった瞬間を検出し、イベントを発火する。
    /// </summary>
    private void DetectPhaseChange()
    {
        TimePhase current = CurrentPhase;

        if (current != previousPhase)
        {
            Debug.Log($"[TimeSystem] 時間帯が変わりました: {previousPhase} → {current}");

            // EventManagerに時間帯変更を通知
            // （EventManagerが存在する場合のみ）
            // EventManager.Instance.OnTimePhaseChanged?.Invoke(current);

            // 夕方に入った瞬間の特別処理
            if (current == TimePhase.Evening && !hasPlayedEveningChimeToday)
            {
                PlayEveningChime();
                hasPlayedEveningChimeToday = true;
            }

            previousPhase = current;
        }
    }

    // --------------------------------------------------
    // 夕方チャイム
    // --------------------------------------------------

    /// <summary>
    /// 夕方17時になった瞬間に呼ばれる。
    /// AudioManagerにチャイム再生を依頼し、BGMをフェードさせる。
    /// </summary>
    private void PlayEveningChime()
    {
        Debug.Log($"[TimeSystem] {currentDay}日目の夕方 ── チャイムが鳴ります。");

        // AudioManagerが存在すればチャイムを再生
        AudioManager audioManager = FindObjectOfType<AudioManager>();
        if (audioManager != null)
        {
            audioManager.PlayEveningChime();
        }
    }

    // --------------------------------------------------
    // ライティング制御
    // --------------------------------------------------

    /// <summary>
    /// 時間帯に応じてDirectional Lightの色と角度を滑らかに補間(Lerp)する。
    /// 各時間帯の開始・終了時刻に基づいて、グラデーション的に変化させる。
    /// </summary>
    private void UpdateLighting()
    {
        if (directionalLight == null) return;

        Color targetColor;
        float targetAngle;
        float lerpSpeed = 0.5f * Time.deltaTime; // ゆっくり変化させる

        // 現在時刻からターゲットの色と角度を決定
        GetLightingTargets(out targetColor, out targetAngle);

        // 現在値からターゲットへ滑らかに補間
        directionalLight.color = Color.Lerp(directionalLight.color, targetColor, lerpSpeed);

        // 角度もLerpで滑らかに変更（X軸回転 = 太陽の高さ）
        Vector3 currentRotation = directionalLight.transform.eulerAngles;
        float smoothedAngle = Mathf.LerpAngle(currentRotation.x, targetAngle, lerpSpeed);
        directionalLight.transform.eulerAngles = new Vector3(smoothedAngle, currentRotation.y, currentRotation.z);
    }

    /// <summary>
    /// 時刻に応じたライトの色と角度のターゲット値を取得する。
    /// 時間帯の境界付近では前後のフェーズをブレンドする。
    /// </summary>
    private void GetLightingTargets(out Color color, out float angle)
    {
        float h = currentHour;

        if (h >= 5f && h < 6f)
        {
            // 夜→朝の過渡期（夜明け）
            float t = (h - 5f) / 1f;
            color = Color.Lerp(nightColor, morningColor, t);
            angle = Mathf.Lerp(nightAngle, morningAngle, t);
        }
        else if (h >= 6f && h < 11f)
        {
            // 朝の安定期
            color = morningColor;
            angle = morningAngle;
        }
        else if (h >= 11f && h < 12f)
        {
            // 朝→昼の過渡期
            float t = (h - 11f) / 1f;
            color = Color.Lerp(morningColor, noonColor, t);
            angle = Mathf.Lerp(morningAngle, noonAngle, t);
        }
        else if (h >= 12f && h < 16f)
        {
            // 昼の安定期
            color = noonColor;
            angle = noonAngle;
        }
        else if (h >= 16f && h < 17f)
        {
            // 昼→夕方の過渡期（ここが一番美しいグラデーション）
            float t = (h - 16f) / 1f;
            Color todayEveningColor = eveningColor + dailyEveningColorOffset;
            color = Color.Lerp(noonColor, todayEveningColor, t);
            angle = Mathf.Lerp(noonAngle, eveningAngle, t);
        }
        else if (h >= 17f && h < 19f)
        {
            // 夕方の安定期 ── ノスタルジーの核心
            color = eveningColor + dailyEveningColorOffset;
            angle = eveningAngle;
        }
        else if (h >= 19f && h < 20f)
        {
            // 夕方→夜の過渡期（黄昏）
            float t = (h - 19f) / 1f;
            Color todayEveningColor = eveningColor + dailyEveningColorOffset;
            color = Color.Lerp(todayEveningColor, nightColor, t);
            angle = Mathf.Lerp(eveningAngle, nightAngle, t);
        }
        else
        {
            // 夜の安定期 (20:00〜翌4:59)
            color = nightColor;
            angle = nightAngle;
        }
    }

    /// <summary>
    /// 初期化時にライティングを即座に適用する（Lerpせず直接設定）。
    /// </summary>
    private void ApplyLightingImmediate()
    {
        Color targetColor;
        float targetAngle;
        GetLightingTargets(out targetColor, out targetAngle);

        directionalLight.color = targetColor;
        Vector3 rot = directionalLight.transform.eulerAngles;
        directionalLight.transform.eulerAngles = new Vector3(targetAngle, rot.y, rot.z);
    }

    /// <summary>
    /// 毎日の夕方ライト色に微妙なランダム変化を加える。
    /// 「昨日と少し違う夕焼け」を表現するため。
    /// </summary>
    private void GenerateDailyEveningVariation()
    {
        // 日付をシードにして再現性のあるランダム値を生成
        Random.State oldState = Random.state;
        Random.InitState(currentDay * 7919); // 素数をシードに使う

        float r = Random.Range(-0.05f, 0.05f);
        float g = Random.Range(-0.08f, 0.03f);
        float b = Random.Range(-0.05f, 0.05f);
        dailyEveningColorOffset = new Color(r, g, b, 0f);

        Random.state = oldState; // ランダム状態を元に戻す

        Debug.Log($"[TimeSystem] {currentDay}日目の夕焼け色オフセット: ({r:F3}, {g:F3}, {b:F3})");
    }

    // --------------------------------------------------
    // 公開メソッド（外部から呼ぶ用）
    // --------------------------------------------------

    /// <summary>
    /// 時間を一時停止する。会話イベントやUI表示中に使う。
    /// </summary>
    public void PauseTime()
    {
        isTimePaused = true;
        Debug.Log("[TimeSystem] 時間を停止しました。");
    }

    /// <summary>
    /// 時間停止を解除する。
    /// </summary>
    public void ResumeTime()
    {
        isTimePaused = false;
        Debug.Log("[TimeSystem] 時間を再開しました。");
    }

    /// <summary>
    /// デバッグ用: 次の時間帯の開始時刻へジャンプする。
    /// 例: 現在が朝(8:00)なら昼(12:00)へスキップ。
    /// </summary>
    public void AdvanceToNextPhase()
    {
        TimePhase current = CurrentPhase;

        switch (current)
        {
            case TimePhase.Morning:
                currentHour = 12f; // → 昼へ
                break;
            case TimePhase.Noon:
                currentHour = 17f; // → 夕方へ
                break;
            case TimePhase.Evening:
                currentHour = 20f; // → 夜へ
                break;
            case TimePhase.Night:
                currentHour = 6f;  // → 翌朝へ
                OnNewDay();
                break;
        }

        // ライティングを即座に反映
        if (directionalLight != null)
        {
            ApplyLightingImmediate();
        }

        Debug.Log($"[TimeSystem] デバッグ: {current} → {CurrentPhase} にスキップしました（{currentHour:F1}時）");
    }

    /// <summary>
    /// 特定の時刻に直接設定する（デバッグ・イベント用）。
    /// </summary>
    /// <param name="hour">設定したい時刻（0〜24）</param>
    public void SetTime(float hour)
    {
        currentHour = Mathf.Clamp(hour, 0f, 23.99f);

        if (directionalLight != null)
        {
            ApplyLightingImmediate();
        }

        Debug.Log($"[TimeSystem] 時刻を {currentHour:F1} に設定しました。");
    }

    /// <summary>
    /// 時間の進行速度を変更する（カットシーン等で使用）。
    /// </summary>
    /// <param name="newScale">新しいtimeScale値（秒/ゲーム時間）</param>
    public void SetTimeScale(float newScale)
    {
        timeScale = Mathf.Max(1f, newScale);
        Debug.Log($"[TimeSystem] timeScaleを {timeScale} に変更しました。");
    }

    // --------------------------------------------------
    // デバッグ表示（エディタ上で現在時刻を見やすくする）
    // --------------------------------------------------

#if UNITY_EDITOR
    private void OnGUI()
    {
        // 画面左上にデバッグ情報を表示（エディタ実行時のみ）
        int hours = Mathf.FloorToInt(currentHour);
        int minutes = Mathf.FloorToInt((currentHour - hours) * 60f);
        string timeStr = $"{hours:D2}:{minutes:D2}";

        GUI.Label(
            new Rect(10, 10, 300, 60),
            $"Day {currentDay}/{maxDays}  {timeStr}  [{CurrentPhase}]",
            new GUIStyle(GUI.skin.label) { fontSize = 18 }
        );
    }
#endif
}
