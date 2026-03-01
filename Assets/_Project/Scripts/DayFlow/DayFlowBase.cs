// DayFlowBase.cs - DayFlowの基底クラス
// このファイルは手動編集用です。自動上書きされません。
using UnityEngine;
using System.Collections;

/// <summary>
/// DayFlowの基底クラス。各日のフロー定義（DayFlow_DayXX）はこのクラスを継承する。
/// ExecuteDayFlow()をoverrideして、その日のイベントチェーンを定義する。
/// </summary>
public abstract class DayFlowBase : MonoBehaviour
{
    /// <summary>この日のフローを実行するコルーチン（派生クラスでoverride）</summary>
    public abstract IEnumerator ExecuteDayFlow();
}
