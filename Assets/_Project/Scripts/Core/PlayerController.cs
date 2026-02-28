using UnityEngine;

/// <summary>
/// プレイヤーの3Dキャラクター操作を制御するコントローラー。
/// CharacterControllerコンポーネントを使用し、WASD/左スティックで移動する。
/// カメラの向きに応じた移動方向を計算し、キャラクターを滑らかに回転させる。
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    // ========== 移動パラメータ ==========

    /// <summary>移動速度（m/s）</summary>
    [Header("移動設定")]
    [SerializeField] private float moveSpeed = 5f;

    /// <summary>回転の滑らかさ（値が大きいほど素早く向きが変わる）</summary>
    [SerializeField] private float rotationSpeed = 10f;

    /// <summary>重力の強さ</summary>
    [SerializeField] private float gravity = -20f;

    // ========== 状態管理 ==========

    /// <summary>
    /// trueのとき移動可能。会話中やイベント中にfalseにして移動を止める。
    /// </summary>
    public bool canMove = true;

    /// <summary>現在移動中かどうか（外部から参照可能）</summary>
    public bool IsMoving { get; private set; }

    /// <summary>移動量（0〜1）。アニメーションブレンド等に使える</summary>
    public float MoveAmount { get; private set; }

    // ========== 内部変数 ==========

    private CharacterController characterController;
    private Animator animator;
    private Vector3 velocity; // 重力用の速度ベクトル
    private Transform cameraTransform; // メインカメラのTransform

    // アニメーターパラメータのハッシュ（文字列比較を避けるため）
    private static readonly int AnimIsMoving = Animator.StringToHash("isMoving");
    private static readonly int AnimMoveAmount = Animator.StringToHash("moveAmount");

    // ====================================================================
    // Unity ライフサイクル
    // ====================================================================

    private void Awake()
    {
        // CharacterControllerは必須コンポーネントなので必ず取得できる
        characterController = GetComponent<CharacterController>();

        // Animatorは任意（付いていなくてもエラーにならない）
        animator = GetComponent<Animator>();
    }

    private void Start()
    {
        // メインカメラの参照を取得
        if (Camera.main != null)
        {
            cameraTransform = Camera.main.transform;
        }
        else
        {
            Debug.LogWarning("PlayerController: メインカメラが見つかりません。移動方向はワールド基準になります。");
        }
    }

    private void Update()
    {
        HandleMovement();
        ApplyGravity();
        UpdateAnimator();
    }

    // ====================================================================
    // 移動処理
    // ====================================================================

    /// <summary>
    /// WASD / 左スティックの入力を取得し、カメラ基準の方向へキャラクターを移動させる。
    /// </summary>
    private void HandleMovement()
    {
        // 移動が無効化されている場合は止まる
        if (!canMove)
        {
            IsMoving = false;
            MoveAmount = 0f;
            return;
        }

        // --- 入力取得 ---
        // Input.GetAxis は WASD とゲームパッド左スティックの両方に対応
        float horizontal = Input.GetAxis("Horizontal"); // A/D または左スティック横
        float vertical = Input.GetAxis("Vertical");     // W/S または左スティック縦

        // 入力ベクトル（XZ平面）
        Vector3 inputDirection = new Vector3(horizontal, 0f, vertical);

        // 入力の大きさ（0〜1にクランプ）。スティックの傾き具合を反映
        float inputMagnitude = Mathf.Clamp01(inputDirection.magnitude);
        MoveAmount = inputMagnitude;
        IsMoving = inputMagnitude > 0.1f;

        if (!IsMoving)
        {
            return; // 入力がなければ移動・回転しない
        }

        // --- カメラ基準の移動方向を計算 ---
        Vector3 moveDirection = CalculateCameraRelativeDirection(inputDirection);

        // --- キャラクターを移動方向に向ける ---
        RotateTowardsDirection(moveDirection);

        // --- 実際に移動させる ---
        Vector3 moveVelocity = moveDirection * (moveSpeed * inputMagnitude);
        characterController.Move(moveVelocity * Time.deltaTime);
    }

    /// <summary>
    /// 入力ベクトルをカメラの向きに合わせたワールド方向に変換する。
    /// 例: カメラが北を向いていればWキーで北に進む。
    /// </summary>
    private Vector3 CalculateCameraRelativeDirection(Vector3 inputDirection)
    {
        if (cameraTransform == null)
        {
            // カメラがない場合はワールド座標そのまま
            return inputDirection.normalized;
        }

        // カメラの前方と右方向を取得（Y成分は無視して水平にする）
        Vector3 cameraForward = cameraTransform.forward;
        cameraForward.y = 0f;
        cameraForward.Normalize();

        Vector3 cameraRight = cameraTransform.right;
        cameraRight.y = 0f;
        cameraRight.Normalize();

        // カメラ基準の移動方向
        Vector3 worldDirection = cameraForward * inputDirection.z + cameraRight * inputDirection.x;
        return worldDirection.normalized;
    }

    /// <summary>
    /// キャラクターを指定方向に滑らかに回転させる。
    /// Quaternion.Slerp を使って急激に向きが変わらないようにする。
    /// </summary>
    private void RotateTowardsDirection(Vector3 direction)
    {
        if (direction == Vector3.zero) return;

        // 目標の回転を計算
        Quaternion targetRotation = Quaternion.LookRotation(direction, Vector3.up);

        // 現在の回転から目標へ滑らかに補間
        transform.rotation = Quaternion.Slerp(
            transform.rotation,
            targetRotation,
            rotationSpeed * Time.deltaTime
        );
    }

    // ====================================================================
    // 重力処理
    // ====================================================================

    /// <summary>
    /// CharacterControllerには物理エンジンの重力が効かないため、自前で処理する。
    /// </summary>
    private void ApplyGravity()
    {
        if (characterController.isGrounded)
        {
            // 接地中は下方向の速度をリセット（少しだけ下向きに残して接地判定を安定させる）
            velocity.y = -2f;
        }
        else
        {
            // 空中では重力を加算
            velocity.y += gravity * Time.deltaTime;
        }

        // 重力による移動を適用
        characterController.Move(velocity * Time.deltaTime);
    }

    // ====================================================================
    // アニメーション連携
    // ====================================================================

    /// <summary>
    /// Animatorコンポーネントがあれば、移動状態をパラメータとしてセットする。
    /// Animatorがなければ何もしない。
    /// </summary>
    private void UpdateAnimator()
    {
        if (animator == null) return;

        animator.SetBool(AnimIsMoving, IsMoving);
        animator.SetFloat(AnimMoveAmount, MoveAmount, 0.1f, Time.deltaTime);
    }

    // ====================================================================
    // 外部からの制御
    // ====================================================================

    /// <summary>
    /// 移動を無効化する（会話開始時などに呼ぶ）。
    /// </summary>
    public void DisableMovement()
    {
        canMove = false;
        IsMoving = false;
        MoveAmount = 0f;
        UpdateAnimator();
    }

    /// <summary>
    /// 移動を有効化する（会話終了時などに呼ぶ）。
    /// </summary>
    public void EnableMovement()
    {
        canMove = true;
    }
}
