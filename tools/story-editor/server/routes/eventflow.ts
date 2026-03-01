// EventFlow→DayFlow C#コード生成ルーター
// EventFlow.jsonのノードチェーンを日ごとのコルーチンベースC#に変換する
import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

export const eventflowRouter = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// パス定義
const EVENT_FLOW_PATH = path.resolve(__dirname, '../../data/EventFlow.json')
const UNITY_DAYFLOW_DIR = path.resolve(__dirname, '../../../Assets/_Project/Scripts/DayFlow')

// 自動生成マーカー（events.tsと同じパターン）
const AUTO_GEN_MARKER = '// [AUTO-GENERATED] このファイルはStory Editorにより自動生成されました。手動編集する場合はこの行を削除してください。'

// ===== 型定義 =====

interface FlowNodeData {
  label?: string
  description?: string
  day?: number
  timePhase?: string
  category?: string
  actionTag?: string
  setFlag?: string
  requiresFlag?: string
  characters?: Array<{ id: string; name: string }>
  dialogues?: Array<{ speakerName: string; lines: string[] }>
  // condition用
  conditions?: Array<{ type: string; key: string; operator?: string; value?: string | number | boolean }>
  logic?: string
  // choice用
  question?: string
  yesLabel?: string
  noLabel?: string
  // hasChoice（eventノード内の選択肢）
  hasChoice?: boolean
  choiceQuestion?: string
  choiceYesLabel?: string
  choiceNoLabel?: string
}

interface FlowNode {
  id: string
  type: 'dayStart' | 'event' | 'condition' | 'choice' | 'ending'
  position: { x: number; y: number }
  data: FlowNodeData
}

interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  data?: { label?: string }
}

interface EventFlowData {
  version: string
  lastModified: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface SyncResult {
  fileName: string
  status: 'created' | 'updated' | 'skipped'
  path: string
  reason?: string
}

// ===== ヘルパー関数 =====

/** C#文字列内の特殊文字をエスケープ */
function escapeCSharp(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

/** 日番号を2桁のゼロ埋め文字列に変換 */
function padDay(day: number): string {
  return String(day).padStart(2, '0')
}

/**
 * BFSで1日分のノードチェーンを構築
 * dayStartノードを起点にエッジをたどり、順序リストを返す
 * 分岐がある場合は分岐情報も含む
 */
interface ChainNode {
  node: FlowNode
  branch?: 'yes' | 'no' | 'true' | 'false'  // 分岐元からどのハンドルで来たか
  children: ChainNode[]
}

function buildDayChain(
  startNodeId: string,
  dayNodeIds: Set<string>,
  nodeMap: Map<string, FlowNode>,
  outEdges: Map<string, FlowEdge[]>,
): ChainNode | null {
  const startNode = nodeMap.get(startNodeId)
  if (!startNode) return null

  const visited = new Set<string>()

  function traverse(nodeId: string, branch?: 'yes' | 'no' | 'true' | 'false'): ChainNode | null {
    if (visited.has(nodeId)) return null
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) return null

    const chain: ChainNode = { node, branch, children: [] }

    const edges = (outEdges.get(nodeId) || []).filter(e => dayNodeIds.has(e.target))

    for (const edge of edges) {
      const childBranch = (edge.sourceHandle as ChainNode['branch']) || undefined
      const child = traverse(edge.target, childBranch)
      if (child) {
        chain.children.push(child)
      }
    }

    return chain
  }

  return traverse(startNodeId)
}

/**
 * チェーンノードからC#コルーチンのコードブロックを生成（再帰）
 */
function generateNodeCode(chain: ChainNode, indent: string = '        '): string[] {
  const lines: string[] = []
  const node = chain.node

  switch (node.type) {
    case 'dayStart':
      lines.push(`${indent}// --- ${escapeCSharp(node.data.label || `Day ${node.data.day}`)} ---`)
      lines.push(`${indent}Debug.Log("[DayFlow] ${escapeCSharp(node.data.label || '')} 開始");`)
      break

    case 'event': {
      lines.push(`${indent}// ${escapeCSharp(node.data.label || 'イベント')}`)

      // requiresFlagがある場合の条件チェック
      if (node.data.requiresFlag) {
        lines.push(`${indent}// フラグ条件チェック`)
        lines.push(`${indent}if (!GameManager.Instance.GetFlag("${escapeCSharp(node.data.requiresFlag)}"))`)
        lines.push(`${indent}{`)
        lines.push(`${indent}    Debug.Log("[DayFlow] フラグ未達成のためスキップ: ${escapeCSharp(node.data.requiresFlag)}");`)
        // スキップ時もchildrenは処理する必要がある場合があるが、ここでは省略
        lines.push(`${indent}}`)
        lines.push(`${indent}else`)
        lines.push(`${indent}{`)
        generateEventBody(node, lines, indent + '    ')
        lines.push(`${indent}}`)
      } else {
        generateEventBody(node, lines, indent)
      }

      // hasChoice（eventノード内の選択肢）
      if (node.data.hasChoice && chain.children.length >= 2) {
        lines.push('')
        lines.push(`${indent}// 選択肢: ${escapeCSharp(node.data.choiceQuestion || '')}`)
        lines.push(`${indent}// TODO: 選択UIを表示してプレイヤーの入力を待つ`)
        lines.push(`${indent}bool playerChoice = false; // プレイヤーの選択結果`)
        lines.push(`${indent}yield return StartCoroutine(WaitForPlayerChoice("${escapeCSharp(node.data.choiceQuestion || '')}", "${escapeCSharp(node.data.choiceYesLabel || 'はい')}", "${escapeCSharp(node.data.choiceNoLabel || 'いいえ')}", (result) => playerChoice = result));`)
        lines.push('')
        lines.push(`${indent}if (playerChoice)`)
        lines.push(`${indent}{`)
        const yesChild = chain.children.find(c => c.branch === 'yes')
        if (yesChild) {
          lines.push(...generateNodeCode(yesChild, indent + '    '))
          // yesChildのchildrenも再帰的に処理
          for (const grandChild of yesChild.children) {
            lines.push(...generateNodeCode(grandChild, indent + '    '))
          }
        }
        lines.push(`${indent}}`)
        lines.push(`${indent}else`)
        lines.push(`${indent}{`)
        const noChild = chain.children.find(c => c.branch === 'no')
        if (noChild) {
          lines.push(...generateNodeCode(noChild, indent + '    '))
          for (const grandChild of noChild.children) {
            lines.push(...generateNodeCode(grandChild, indent + '    '))
          }
        }
        lines.push(`${indent}}`)

        // children処理済みなのでここでreturn
        return lines
      }
      break
    }

    case 'condition': {
      lines.push(`${indent}// 条件分岐: ${escapeCSharp(node.data.label || '条件')}`)
      const condStr = generateConditionExpression(node)
      lines.push(`${indent}if (${condStr})`)
      lines.push(`${indent}{`)

      // true（上段）側
      const trueChild = chain.children.find(c => c.branch === 'true' || c.branch === 'yes')
      if (trueChild) {
        lines.push(...generateNodeCode(trueChild, indent + '    '))
        for (const grandChild of trueChild.children) {
          lines.push(...generateNodeCode(grandChild, indent + '    '))
        }
      }

      lines.push(`${indent}}`)
      lines.push(`${indent}else`)
      lines.push(`${indent}{`)

      // false（下段）側
      const falseChild = chain.children.find(c => c.branch === 'false' || c.branch === 'no')
      if (falseChild) {
        lines.push(...generateNodeCode(falseChild, indent + '    '))
        for (const grandChild of falseChild.children) {
          lines.push(...generateNodeCode(grandChild, indent + '    '))
        }
      }

      lines.push(`${indent}}`)
      return lines  // children処理済み
    }

    case 'choice': {
      lines.push(`${indent}// 選択: ${escapeCSharp(node.data.label || 'Yes/No選択')}`)
      lines.push(`${indent}bool playerChoice = false;`)
      lines.push(`${indent}yield return StartCoroutine(WaitForPlayerChoice("${escapeCSharp(node.data.question || '')}", "${escapeCSharp(node.data.yesLabel || 'はい')}", "${escapeCSharp(node.data.noLabel || 'いいえ')}", (result) => playerChoice = result));`)
      lines.push('')
      lines.push(`${indent}if (playerChoice)`)
      lines.push(`${indent}{`)
      const yesChild = chain.children.find(c => c.branch === 'yes')
      if (yesChild) {
        lines.push(...generateNodeCode(yesChild, indent + '    '))
        for (const gc of yesChild.children) {
          lines.push(...generateNodeCode(gc, indent + '    '))
        }
      }
      lines.push(`${indent}}`)
      lines.push(`${indent}else`)
      lines.push(`${indent}{`)
      const noChild = chain.children.find(c => c.branch === 'no')
      if (noChild) {
        lines.push(...generateNodeCode(noChild, indent + '    '))
        for (const gc of noChild.children) {
          lines.push(...generateNodeCode(gc, indent + '    '))
        }
      }
      lines.push(`${indent}}`)
      return lines  // children処理済み
    }

    case 'ending':
      lines.push(`${indent}// エンディング: ${escapeCSharp(node.data.label || 'エンディング')}`)
      lines.push(`${indent}Debug.Log("[DayFlow] エンディング到達: ${escapeCSharp(node.data.label || '')}");`)
      break
  }

  // childrenを順に処理（分岐ノードの場合は上で処理済みのためreturnしている）
  for (const child of chain.children) {
    lines.push('')
    lines.push(...generateNodeCode(child, indent))
  }

  return lines
}

/** イベントノードの本体コード生成 */
function generateEventBody(node: FlowNode, lines: string[], indent: string): void {
  // 場所設定
  if (node.data.location) {
    lines.push(`${indent}// 場所: ${escapeCSharp(node.data.location)}`)
    lines.push(`${indent}// TODO: LocationManager.Instance.SetCurrentLocation("${escapeCSharp(node.data.location)}");`)
  }

  // シーン遷移
  const sceneTransitions = (node.data as Record<string, unknown>).sceneTransitions as Array<{ fromScene: string; toScene: string; trigger?: string }> | undefined
  if (sceneTransitions && sceneTransitions.length > 0) {
    lines.push(`${indent}// シーン遷移`)
    for (const st of sceneTransitions) {
      if (st.trigger) {
        lines.push(`${indent}// トリガー: ${escapeCSharp(st.trigger)}`)
      }
      lines.push(`${indent}// TODO: SceneTransitionManager.Instance.TransitionTo("${escapeCSharp(st.fromScene)}", "${escapeCSharp(st.toScene)}");`)
      lines.push(`${indent}// yield return new WaitUntil(() => !SceneTransitionManager.Instance.IsTransitioning);`)
    }
  }

  // キャラクター演出
  const characterDirections = (node.data as Record<string, unknown>).characterDirections as Array<{ characterId: string; animation: string; movement?: string; position?: string }> | undefined
  if (characterDirections && characterDirections.length > 0) {
    lines.push(`${indent}// キャラクター演出`)
    for (const cd of characterDirections) {
      if (cd.movement) {
        lines.push(`${indent}// 移動: ${escapeCSharp(cd.characterId)} - ${escapeCSharp(cd.movement)}`)
      }
      if (cd.position) {
        lines.push(`${indent}// 位置: ${escapeCSharp(cd.characterId)} - ${escapeCSharp(cd.position)}`)
      }
      lines.push(`${indent}// TODO: CharacterManager.Instance.PlayAnimation("${escapeCSharp(cd.characterId)}", "${escapeCSharp(cd.animation)}");`)
    }
  }

  // 会話（dialogues配列がある場合）
  const dialogues = node.data.dialogues || []
  if (dialogues.length > 0) {
    for (const d of dialogues) {
      // セリフ中のアニメーション
      const animation = (d as Record<string, unknown>).animation as string | undefined
      if (animation) {
        lines.push(`${indent}// アニメーション: ${escapeCSharp(animation)}`)
      }
      const linesArr = (d.lines || []).map(l => `"${escapeCSharp(l)}"`).join(', ')
      lines.push(`${indent}DialogueUI.Instance.ShowDialogue("${escapeCSharp(d.speakerName || '')}", new string[] { ${linesArr} });`)
      lines.push(`${indent}yield return new WaitUntil(() => !DialogueUI.Instance.IsDialogueActive);`)
    }
  } else if (node.data.description) {
    // dialogues配列がない場合はdescriptionからナレーション会話を生成
    lines.push(`${indent}DialogueUI.Instance.ShowDialogue("", new string[] { "${escapeCSharp(node.data.description)}" });`)
    lines.push(`${indent}yield return new WaitUntil(() => !DialogueUI.Instance.IsDialogueActive);`)
  }

  // フラグ設定
  if (node.data.setFlag) {
    lines.push(`${indent}GameManager.Instance.SetFlag("${escapeCSharp(node.data.setFlag)}", true);`)
  }

  // actionTag（行動ログ）
  if (node.data.actionTag) {
    lines.push(`${indent}EventManager.Instance.TriggerActionLogged("${escapeCSharp(node.data.actionTag)}");`)
  }
}

/** conditionノードの条件式を生成 */
function generateConditionExpression(node: FlowNode): string {
  const conditions = node.data.conditions || []
  if (conditions.length === 0) {
    // conditionsが空なら、labelから推測
    return `/* ${escapeCSharp(node.data.label || '条件')} */ true`
  }

  const logic = (node.data.logic || 'AND').toUpperCase() === 'OR' ? ' || ' : ' && '
  const parts: string[] = []

  for (const c of conditions) {
    switch (c.type) {
      case 'flag':
        parts.push(`GameManager.Instance.GetFlag("${escapeCSharp(c.key)}") == ${c.value ?? true}`)
        break
      case 'intValue':
        parts.push(`GameManager.Instance.GetIntValue("${escapeCSharp(c.key)}") ${c.operator || '>='} ${c.value ?? 0}`)
        break
      case 'day':
        parts.push(`GameManager.Instance.CurrentDay ${c.operator || '=='} ${c.value ?? 1}`)
        break
      case 'timePhase':
        parts.push(`GameManager.Instance.CurrentTimePhase == TimePhase.${c.value || 'Morning'}`)
        break
      default:
        parts.push(`/* 未対応条件: ${escapeCSharp(c.type)} */ true`)
    }
  }

  return parts.join(logic)
}

// ===== DayFlow C# ファイル生成 =====

/** 1日分のDayFlowスクリプトを生成 */
function generateDayFlowScript(day: number, chain: ChainNode): string {
  const className = `DayFlow_Day${padDay(day)}`
  const codeLines = generateNodeCode(chain)
  const codeBody = codeLines.join('\n')

  return `${AUTO_GEN_MARKER}
// 生成日時: ${new Date().toISOString()}
using UnityEngine;
using System;
using System.Collections;

/// <summary>Day ${day} のイベントフロー定義（自動生成）</summary>
public class ${className} : DayFlowBase
{
    /// <summary>この日のフローを実行するコルーチン</summary>
    public override IEnumerator ExecuteDayFlow()
    {
        Debug.Log("[DayFlow] Day ${day} フロー開始");

${codeBody}

        Debug.Log("[DayFlow] Day ${day} フロー完了");
    }

    /// <summary>プレイヤー選択を待つコルーチン（UIシステムと連携）</summary>
    private IEnumerator WaitForPlayerChoice(string question, string yesLabel, string noLabel, Action<bool> onResult)
    {
        Debug.Log($"[DayFlow] 選択: {question} ({yesLabel} / {noLabel})");
        // TODO: 実際のUI表示とプレイヤー入力待ちを実装
        // 仮実装: 常にYesを選択
        onResult(true);
        yield return null;
    }
}
`
}

/** DayFlowManager.csを生成（全日のフローを管理） */
function generateDayFlowManager(days: number[]): string {
  const switchCases = days.map(d =>
    `            case ${d}: return GetComponent<DayFlow_Day${padDay(d)}>();`
  ).join('\n')

  return `${AUTO_GEN_MARKER}
// 生成日時: ${new Date().toISOString()}
using UnityEngine;
using System.Collections;

/// <summary>
/// DayFlowManager - 日ごとのイベントフローを管理するシングルトン
/// GameManager.StartNewDay()から呼ばれ、その日のフローを実行する
/// </summary>
public class DayFlowManager : MonoBehaviour
{
    private static DayFlowManager _instance;
    public static DayFlowManager Instance
    {
        get
        {
            if (_instance == null)
            {
                var go = new GameObject("DayFlowManager");
                _instance = go.AddComponent<DayFlowManager>();
                DontDestroyOnLoad(go);
            }
            return _instance;
        }
    }

    private void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }
        _instance = this;
        DontDestroyOnLoad(gameObject);
    }

    /// <summary>指定した日のフロー定義を取得</summary>
    private DayFlowBase GetDayFlow(int day)
    {
        switch (day)
        {
${switchCases}
            default:
                Debug.LogWarning($"[DayFlowManager] Day {day} のフロー定義が見つかりません");
                return null;
        }
    }

    /// <summary>指定した日のフローを実行</summary>
    public void ExecuteDay(int day)
    {
        var flow = GetDayFlow(day);
        if (flow != null)
        {
            StartCoroutine(flow.ExecuteDayFlow());
        }
    }

    /// <summary>現在の日のフローを実行</summary>
    public void ExecuteCurrentDay()
    {
        ExecuteDay(GameManager.Instance.CurrentDay);
    }
}
`
}

// ===== ルートハンドラー =====

/** POST /sync - EventFlow.jsonからDayFlow C#を生成 */
eventflowRouter.post('/sync', async (_req, res) => {
  try {
    // EventFlow.jsonを読み込み
    const raw = await fs.readFile(EVENT_FLOW_PATH, 'utf-8')
    const flowData: EventFlowData = JSON.parse(raw)

    // ノードとエッジのルックアップテーブル
    const nodeMap = new Map<string, FlowNode>()
    const outEdges = new Map<string, FlowEdge[]>()

    flowData.nodes.forEach(n => nodeMap.set(n.id, n))
    flowData.edges.forEach(e => {
      if (!outEdges.has(e.source)) outEdges.set(e.source, [])
      outEdges.get(e.source)!.push(e)
    })

    // 日付ごとにノードをグループ化
    const dayGroups = new Map<number, FlowNode[]>()
    flowData.nodes.forEach(n => {
      if (n.data.day != null) {
        if (!dayGroups.has(n.data.day)) dayGroups.set(n.data.day, [])
        dayGroups.get(n.data.day)!.push(n)
      }
    })

    await fs.mkdir(UNITY_DAYFLOW_DIR, { recursive: true })
    const results: SyncResult[] = []
    const generatedDays: number[] = []

    // 各日のDayFlow C#を生成
    for (const [day, dayNodes] of dayGroups.entries()) {
      const dayNodeIds = new Set(dayNodes.map(n => n.id))
      const startNode = dayNodes.find(n => n.type === 'dayStart')

      if (!startNode) {
        results.push({
          fileName: `DayFlow_Day${padDay(day)}.cs`,
          status: 'skipped',
          path: '',
          reason: `Day ${day} にdayStartノードがありません`,
        })
        continue
      }

      // BFSでチェーン構築
      const chain = buildDayChain(startNode.id, dayNodeIds, nodeMap, outEdges)
      if (!chain) {
        results.push({
          fileName: `DayFlow_Day${padDay(day)}.cs`,
          status: 'skipped',
          path: '',
          reason: 'チェーン構築に失敗',
        })
        continue
      }

      const fileName = `DayFlow_Day${padDay(day)}.cs`
      const filePath = path.join(UNITY_DAYFLOW_DIR, fileName)
      const relPath = `Assets/_Project/Scripts/DayFlow/${fileName}`
      const newContent = generateDayFlowScript(day, chain)

      // 既存ファイルチェック
      let existing: string | null = null
      try { existing = await fs.readFile(filePath, 'utf-8') } catch { /* 新規 */ }

      // 手動編集ファイルは保護
      if (existing !== null && !existing.startsWith(AUTO_GEN_MARKER)) {
        results.push({ fileName, status: 'skipped', path: relPath, reason: '手動編集ファイル' })
        continue
      }

      // 変更なしならスキップ
      if (existing !== null) {
        const strip = (s: string) => s.replace(/^\/\/ 生成日時: .+$/m, '')
        if (strip(existing) === strip(newContent)) {
          results.push({ fileName, status: 'skipped', path: relPath, reason: '変更なし' })
          generatedDays.push(day)
          continue
        }
      }

      await fs.writeFile(filePath, newContent, 'utf-8')
      results.push({ fileName, status: existing ? 'updated' : 'created', path: relPath })
      generatedDays.push(day)
    }

    // DayFlowManager.csを生成
    generatedDays.sort((a, b) => a - b)
    if (generatedDays.length > 0) {
      const mgrFileName = 'DayFlowManager.cs'
      const mgrFilePath = path.join(UNITY_DAYFLOW_DIR, mgrFileName)
      const mgrRelPath = `Assets/_Project/Scripts/DayFlow/${mgrFileName}`
      const mgrContent = generateDayFlowManager(generatedDays)

      let existingMgr: string | null = null
      try { existingMgr = await fs.readFile(mgrFilePath, 'utf-8') } catch { /* 新規 */ }

      if (existingMgr !== null && !existingMgr.startsWith(AUTO_GEN_MARKER)) {
        results.push({ fileName: mgrFileName, status: 'skipped', path: mgrRelPath, reason: '手動編集ファイル' })
      } else {
        const strip = (s: string) => s.replace(/^\/\/ 生成日時: .+$/m, '')
        if (existingMgr !== null && strip(existingMgr) === strip(mgrContent)) {
          results.push({ fileName: mgrFileName, status: 'skipped', path: mgrRelPath, reason: '変更なし' })
        } else {
          await fs.writeFile(mgrFilePath, mgrContent, 'utf-8')
          results.push({ fileName: mgrFileName, status: existingMgr ? 'updated' : 'created', path: mgrRelPath })
        }
      }
    }

    // DayFlowBase.csを生成（存在しない場合のみ）
    const basePath = path.join(UNITY_DAYFLOW_DIR, 'DayFlowBase.cs')
    try {
      await fs.access(basePath)
      // 既に存在する場合は何もしない
    } catch {
      // ファイルが存在しない場合のみ作成
      const baseContent = `// DayFlowBase.cs - DayFlowの基底クラス
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
`
      await fs.writeFile(basePath, baseContent, 'utf-8')
      results.push({ fileName: 'DayFlowBase.cs', status: 'created', path: 'Assets/_Project/Scripts/DayFlow/DayFlowBase.cs' })
    }

    const created = results.filter(r => r.status === 'created').length
    const updated = results.filter(r => r.status === 'updated').length
    const skipped = results.filter(r => r.status === 'skipped').length

    res.json({
      success: true,
      summary: { created, updated, skipped, total: results.length },
      results,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '不明なエラー'
    console.error('EventFlow同期エラー:', msg)
    res.status(500).json({ success: false, error: `同期エラー: ${msg}` })
  }
})
