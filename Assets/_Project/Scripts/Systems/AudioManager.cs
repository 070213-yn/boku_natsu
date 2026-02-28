// ============================================
// AudioManager.cs
// 音響管理システム（BGMより環境音を優先する設計）
// 島の空気感を音で表現する。夕方チャイム後の静寂が最も重要。
// ============================================

using UnityEngine;
using System.Collections;

/// <summary>
/// ゲーム全体の音響を管理するシングルトン。
/// BGMは控えめに、環境音（波・虫・風）を主役として扱う。
/// DontDestroyOnLoad（シーンが切り替わっても破棄されない）で動作する。
/// </summary>
public class AudioManager : MonoBehaviour
{
    // --------------------------------------------------
    // シングルトン
    // （ゲーム中に1つだけ存在することを保証するパターン）
    // --------------------------------------------------

    public static AudioManager Instance { get; private set; }

    private void Awake()
    {
        // 既に別のAudioManagerが存在する場合は自分を破棄
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject); // シーン遷移で消えないようにする

        // AudioSource（音を鳴らすコンポーネント）の初期設定
        InitializeAudioSources();
    }

    // --------------------------------------------------
    // AudioSource（音の再生装置）
    // --------------------------------------------------

    [Header("--- AudioSource参照 ---")]
    [Tooltip("BGM再生用。控えめな音量で流す")]
    [SerializeField] private AudioSource bgmSource;

    [Tooltip("効果音（SE）再生用。ボタン音やアイテム取得音など")]
    [SerializeField] private AudioSource sfxSource;

    [Tooltip("環境音再生用。波、虫、風など（最も重要）")]
    [SerializeField] private AudioSource ambientSource;

    [Tooltip("夕方チャイム専用。他の音と混ざらないよう独立")]
    [SerializeField] private AudioSource chimeSfxSource;

    // --------------------------------------------------
    // 時間帯別の環境音クリップ（インスペクターで設定）
    // --------------------------------------------------

    [Header("--- 朝の環境音 ---")]
    [Tooltip("鳥のさえずり")]
    [SerializeField] private AudioClip morningBirds;
    [Tooltip("遠くから聞こえるラジオ体操の音楽")]
    [SerializeField] private AudioClip morningRadio;

    [Header("--- 昼の環境音 ---")]
    [Tooltip("セミの鳴き声（夏の象徴）")]
    [SerializeField] private AudioClip noonCicadas;
    [Tooltip("波の音（昼）")]
    [SerializeField] private AudioClip noonWaves;

    [Header("--- 夕方の環境音 ---")]
    [Tooltip("ヒグラシの鳴き声（ノスタルジーの核心）")]
    [SerializeField] private AudioClip eveningHigurashi;
    [Tooltip("夕方のチャイム（17時に1回だけ鳴る）")]
    [SerializeField] private AudioClip eveningChime;

    [Header("--- 夜の環境音 ---")]
    [Tooltip("虫の声（コオロギ、鈴虫など）")]
    [SerializeField] private AudioClip nightInsects;
    [Tooltip("遠くの波の音（夜は昼より静か）")]
    [SerializeField] private AudioClip nightDistantWaves;

    [Header("--- 音量設定 ---")]
    [Tooltip("BGMのデフォルト音量（0〜1）。環境音より控えめに")]
    [SerializeField] private float defaultBgmVolume = 0.3f;

    [Tooltip("環境音のデフォルト音量（0〜1）。BGMより大きく")]
    [SerializeField] private float defaultAmbientVolume = 0.7f;

    [Tooltip("効果音の音量（0〜1）")]
    [SerializeField] private float sfxVolume = 1.0f;

    // --------------------------------------------------
    // 内部状態
    // --------------------------------------------------

    // BGMフェードアウト用のコルーチン参照（重複防止）
    private Coroutine bgmFadeCoroutine;

    // 環境音クロスフェード用のコルーチン参照
    private Coroutine ambientFadeCoroutine;

    // チャイム後にBGMをミュートしているかどうか
    private bool isBgmMutedByChime = false;

    // 現在の時間帯を記憶（同じフェーズで環境音を何度も切り替えないため）
    private TimePhase currentAmbientPhase = TimePhase.Morning;

    // --------------------------------------------------
    // 初期化
    // --------------------------------------------------

    /// <summary>
    /// AudioSourceが未設定の場合、自動で作成する。
    /// </summary>
    private void InitializeAudioSources()
    {
        if (bgmSource == null)
        {
            bgmSource = CreateAudioSource("BGM");
            bgmSource.loop = true;
        }

        if (sfxSource == null)
        {
            sfxSource = CreateAudioSource("SFX");
            sfxSource.loop = false;
        }

        if (ambientSource == null)
        {
            ambientSource = CreateAudioSource("Ambient");
            ambientSource.loop = true;
        }

        if (chimeSfxSource == null)
        {
            chimeSfxSource = CreateAudioSource("ChimeSFX");
            chimeSfxSource.loop = false;
        }
    }

    /// <summary>
    /// 子オブジェクトにAudioSourceを作成するヘルパー。
    /// </summary>
    private AudioSource CreateAudioSource(string label)
    {
        GameObject child = new GameObject($"AudioSource_{label}");
        child.transform.SetParent(transform);
        AudioSource source = child.AddComponent<AudioSource>();
        source.playOnAwake = false;
        return source;
    }

    // --------------------------------------------------
    // BGM制御
    // --------------------------------------------------

    /// <summary>
    /// BGMを再生する。音量はデフォルトで0.3（控えめ）。
    /// チャイム後のミュート状態であれば自動解除する。
    /// </summary>
    /// <param name="clip">再生するBGMのAudioClip</param>
    /// <param name="volume">音量（0〜1）。省略時は0.3</param>
    public void PlayBGM(AudioClip clip, float volume = 0.3f)
    {
        if (clip == null)
        {
            Debug.LogWarning("[AudioManager] BGMクリップがnullです。");
            return;
        }

        // 同じ曲が既に再生中なら何もしない
        if (bgmSource.clip == clip && bgmSource.isPlaying) return;

        bgmSource.clip = clip;
        bgmSource.volume = volume;
        bgmSource.Play();
        isBgmMutedByChime = false;

        Debug.Log($"[AudioManager] BGM再生: {clip.name} (音量: {volume})");
    }

    /// <summary>
    /// BGMをフェードアウトして停止する。
    /// </summary>
    /// <param name="fadeTime">フェードアウトにかける秒数。省略時は1秒</param>
    public void StopBGM(float fadeTime = 1f)
    {
        if (bgmFadeCoroutine != null)
        {
            StopCoroutine(bgmFadeCoroutine);
        }
        bgmFadeCoroutine = StartCoroutine(FadeOutBGM(fadeTime));
    }

    /// <summary>
    /// BGMを徐々に小さくして停止するコルーチン。
    /// コルーチン = 時間をかけて少しずつ処理を進める仕組み。
    /// </summary>
    private IEnumerator FadeOutBGM(float fadeTime)
    {
        float startVolume = bgmSource.volume;

        while (bgmSource.volume > 0.01f)
        {
            bgmSource.volume -= startVolume * Time.deltaTime / fadeTime;
            yield return null; // 1フレーム待つ
        }

        bgmSource.Stop();
        bgmSource.volume = startVolume; // 音量を元に戻しておく（次回再生用）
        bgmFadeCoroutine = null;

        Debug.Log("[AudioManager] BGMフェードアウト完了。");
    }

    // --------------------------------------------------
    // 効果音（SFX）制御
    // --------------------------------------------------

    /// <summary>
    /// 効果音を1回再生する（ボタン音、アイテム取得音など）。
    /// PlayOneShot = 同時に複数の効果音を重ねて再生できる方式。
    /// </summary>
    /// <param name="clip">再生するAudioClip</param>
    public void PlaySFX(AudioClip clip)
    {
        if (clip == null)
        {
            Debug.LogWarning("[AudioManager] SFXクリップがnullです。");
            return;
        }

        sfxSource.PlayOneShot(clip, sfxVolume);
    }

    // --------------------------------------------------
    // 環境音（Ambient）制御
    // --------------------------------------------------

    /// <summary>
    /// 環境音を再生する。ループ再生される。
    /// </summary>
    /// <param name="clip">再生する環境音のAudioClip</param>
    /// <param name="volume">音量（0〜1）。省略時は0.7</param>
    public void PlayAmbient(AudioClip clip, float volume = 0.7f)
    {
        if (clip == null)
        {
            Debug.LogWarning("[AudioManager] 環境音クリップがnullです。");
            return;
        }

        // 同じ環境音が既に再生中なら何もしない
        if (ambientSource.clip == clip && ambientSource.isPlaying) return;

        // クロスフェードで自然に切り替える
        if (ambientFadeCoroutine != null)
        {
            StopCoroutine(ambientFadeCoroutine);
        }
        ambientFadeCoroutine = StartCoroutine(CrossFadeAmbient(clip, volume));
    }

    /// <summary>
    /// 環境音をクロスフェード（旧→新を滑らかに切り替え）するコルーチン。
    /// </summary>
    private IEnumerator CrossFadeAmbient(AudioClip newClip, float targetVolume)
    {
        float fadeDuration = 2f; // 2秒かけて切り替える

        // 現在の環境音をフェードアウト
        if (ambientSource.isPlaying)
        {
            float startVol = ambientSource.volume;
            float elapsed = 0f;

            while (elapsed < fadeDuration)
            {
                elapsed += Time.deltaTime;
                ambientSource.volume = Mathf.Lerp(startVol, 0f, elapsed / fadeDuration);
                yield return null;
            }

            ambientSource.Stop();
        }

        // 新しい環境音をフェードイン
        ambientSource.clip = newClip;
        ambientSource.volume = 0f;
        ambientSource.Play();

        float elapsedIn = 0f;
        while (elapsedIn < fadeDuration)
        {
            elapsedIn += Time.deltaTime;
            ambientSource.volume = Mathf.Lerp(0f, targetVolume, elapsedIn / fadeDuration);
            yield return null;
        }

        ambientSource.volume = targetVolume;
        ambientFadeCoroutine = null;

        Debug.Log($"[AudioManager] 環境音切替完了: {newClip.name}");
    }

    // --------------------------------------------------
    // 夕方チャイム（ゲームの最重要演出）
    // --------------------------------------------------

    /// <summary>
    /// 夕方チャイムを再生する。
    /// チャイム再生後、BGMをフェードアウトして環境音（ヒグラシ）だけを残す。
    /// 「チャイムの後の静けさ」がこのゲームの情緒的な核心。
    /// </summary>
    public void PlayEveningChime()
    {
        Debug.Log("[AudioManager] 夕方のチャイムが鳴ります ──");

        // チャイム音を専用ソースで再生
        if (eveningChime != null)
        {
            chimeSfxSource.clip = eveningChime;
            chimeSfxSource.volume = 0.8f; // チャイムはしっかり聞こえるように
            chimeSfxSource.Play();
        }

        // チャイム再生後の演出をコルーチンで制御
        StartCoroutine(EveningChimeSequence());
    }

    /// <summary>
    /// チャイム後の演出シーケンス。
    /// 1. チャイムが鳴り終わるのを待つ
    /// 2. BGMをゆっくりフェードアウト
    /// 3. 環境音（ヒグラシ）だけが残る静寂
    /// </summary>
    private IEnumerator EveningChimeSequence()
    {
        // チャイムが鳴り終わるまで待つ（クリップがある場合はその長さ分）
        float chimeLength = eveningChime != null ? eveningChime.length : 3f;
        yield return new WaitForSeconds(chimeLength + 0.5f); // 余韻のため少し余分に待つ

        // BGMをゆっくりフェードアウト（3秒かけて）
        if (bgmSource.isPlaying)
        {
            StopBGM(3f);
            isBgmMutedByChime = true;
            Debug.Log("[AudioManager] チャイム後 ── BGMがフェードアウト。環境音だけが残ります。");
        }

        // 環境音をヒグラシに切り替え
        if (eveningHigurashi != null)
        {
            PlayAmbient(eveningHigurashi, defaultAmbientVolume);
        }
    }

    // --------------------------------------------------
    // 時間帯別の環境音切替
    // --------------------------------------------------

    /// <summary>
    /// 時間帯に応じた環境音に自動切替する。
    /// TimeSystemの時間帯変更イベントから呼ばれる想定。
    /// </summary>
    /// <param name="phase">現在の時間帯</param>
    public void SetAmbientForPhase(TimePhase phase)
    {
        // 同じ時間帯なら切り替えない
        if (phase == currentAmbientPhase) return;
        currentAmbientPhase = phase;

        Debug.Log($"[AudioManager] 環境音を {phase} 用に切り替えます。");

        switch (phase)
        {
            // 朝: 鳥のさえずりと遠くのラジオ
            case TimePhase.Morning:
                if (morningBirds != null)
                {
                    PlayAmbient(morningBirds, defaultAmbientVolume);
                }
                // BGMがチャイムでミュートされていた場合、朝になったら解除
                if (isBgmMutedByChime)
                {
                    isBgmMutedByChime = false;
                    Debug.Log("[AudioManager] 朝になりました。BGMミュートを解除します。");
                }
                break;

            // 昼: セミの声と波の音
            case TimePhase.Noon:
                if (noonCicadas != null)
                {
                    PlayAmbient(noonCicadas, defaultAmbientVolume);
                }
                break;

            // 夕方: ヒグラシ（チャイムは別途PlayEveningChimeで制御）
            case TimePhase.Evening:
                if (eveningHigurashi != null)
                {
                    PlayAmbient(eveningHigurashi, defaultAmbientVolume);
                }
                break;

            // 夜: 虫の声と遠い波音
            case TimePhase.Night:
                if (nightInsects != null)
                {
                    PlayAmbient(nightInsects, defaultAmbientVolume * 0.8f); // 夜は少し控えめ
                }
                break;
        }
    }

    // --------------------------------------------------
    // 便利メソッド
    // --------------------------------------------------

    /// <summary>
    /// 全ての音を停止する（シーン切り替え時など）。
    /// </summary>
    public void StopAll()
    {
        bgmSource.Stop();
        sfxSource.Stop();
        ambientSource.Stop();
        chimeSfxSource.Stop();
        isBgmMutedByChime = false;

        Debug.Log("[AudioManager] 全ての音を停止しました。");
    }

    /// <summary>
    /// マスターボリュームを設定する（全AudioSourceに反映）。
    /// </summary>
    /// <param name="volume">音量（0〜1）</param>
    public void SetMasterVolume(float volume)
    {
        AudioListener.volume = Mathf.Clamp01(volume);
        Debug.Log($"[AudioManager] マスターボリューム: {volume:F2}");
    }

    /// <summary>
    /// 環境音の音量を調整する。
    /// </summary>
    /// <param name="volume">音量（0〜1）</param>
    public void SetAmbientVolume(float volume)
    {
        defaultAmbientVolume = Mathf.Clamp01(volume);
        if (ambientSource.isPlaying)
        {
            ambientSource.volume = defaultAmbientVolume;
        }
    }

    /// <summary>
    /// BGMの音量を調整する。
    /// </summary>
    /// <param name="volume">音量（0〜1）</param>
    public void SetBGMVolume(float volume)
    {
        defaultBgmVolume = Mathf.Clamp01(volume);
        if (bgmSource.isPlaying && !isBgmMutedByChime)
        {
            bgmSource.volume = defaultBgmVolume;
        }
    }
}
