// イベント同期ルーター - Unity C#スクリプト自動生成
import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

export const eventsRouter = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// C#スクリプトの出力先ディレクトリ
const UNITY_EVENTS_DIR = path.resolve(__dirname, '../../../Assets/_Project/Scripts/Events')

// 自動生成マーカー（この行があるファイルは上書き対象）
const AUTO_GEN_MARKER = '// [AUTO-GENERATED] このファイルはStory Editorにより自動生成されました。手動編集する場合はこの行を削除してください。'

// ===== 型定義 =====

interface EventTrigger {
  type: 'always' | 'day' | 'timePhase' | 'flag' | 'intValue'
  timePhase?: string
  day?: number
  dayOperator?: '>=' | '<=' | '==' | '>' | '<'
  flagKey?: string
  flagValue?: boolean
  intKey?: string
  intValue?: number
  intOperator?: '>=' | '<=' | '==' | '>' | '<'
}

interface EventAction {
  type: 'dialogue' | 'setFlag' | 'setInt' | 'incrementInt' | 'movePlayer' | 'logAction' | 'playSound' | 'giveItem'
  speakerName?: string
  dialogueLines?: string[]
  flagKey?: string
  flagValue?: boolean
  intKey?: string
  intValue?: number
  targetLocation?: string
  actionTag?: string
  soundId?: string
  itemId?: string
}

interface GameEvent {
  id: string
  name: string
  description: string
  category: string
  triggers: EventTrigger[]
  actions: EventAction[]
  scriptName: string
  isRepeatable: boolean
  priority: number
  enabled: boolean
}

interface SyncResult {
  scriptName: string
  status: 'created' | 'updated' | 'skipped'
  path: string
  reason?: string
}

// ===== C#コード生成ヘルパー =====

/** C#文字列内の特殊文字をエスケープ */
function escapeCSharp(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

/** C#のbool値に変換 */
function toBool(value: boolean): string {
  return value ? 'true' : 'false'
}

/** 比較演算子をそのまま返す */
function toOp(op: string | undefined): string {
  return op ?? '=='
}

/** Start()内のイベント購読コード */
function genSubscriptions(triggers: EventTrigger[]): string {
  const lines: string[] = []
  if (triggers.some(t => t.type === 'always')) lines.push('        StartCoroutine(ExecuteEvent());')
  if (triggers.some(t => t.type === 'day')) lines.push('        EventManager.Instance.OnDayChanged += OnDayChanged;')
  if (triggers.some(t => t.type === 'timePhase')) lines.push('        EventManager.Instance.OnTimePhaseChanged += OnTimePhaseChanged;')
  return lines.length > 0 ? lines.join('\n') : '        // トリガー条件は条件チェックメソッド内で評価'
}

/** OnDestroy()内の購読解除コード */
function genUnsubscriptions(triggers: EventTrigger[]): string {
  const lines: string[] = []
  if (triggers.some(t => t.type === 'day')) lines.push('        EventManager.Instance.OnDayChanged -= OnDayChanged;')
  if (triggers.some(t => t.type === 'timePhase')) lines.push('        EventManager.Instance.OnTimePhaseChanged -= OnTimePhaseChanged;')
  return lines.length > 0 ? lines.join('\n') : '        // 購読解除なし'
}

/** flag/intValue条件をC#のif条件式として生成 */
function genExtraConds(triggers: EventTrigger[]): string[] {
  const conds: string[] = []
  for (const t of triggers) {
    if (t.type === 'flag' && t.flagKey) {
      conds.push(`GameManager.Instance.GetFlag("${escapeCSharp(t.flagKey)}") == ${toBool(t.flagValue ?? true)}`)
    }
    if (t.type === 'intValue' && t.intKey) {
      conds.push(`GameManager.Instance.GetIntValue("${escapeCSharp(t.intKey)}") ${toOp(t.intOperator)} ${t.intValue ?? 0}`)
    }
  }
  return conds
}

/** 条件チェックメソッド群を生成 */
function genConditionMethods(triggers: EventTrigger[]): string {
  const methods: string[] = []
  const extra = genExtraConds(triggers)
  const guard = extra.length > 0 ? `\n            if (!(${extra.join(' && ')})) return;\n` : ''

  const dayT = triggers.find(t => t.type === 'day')
  if (dayT) {
    methods.push(
      `    private void OnDayChanged(int currentDay)\n` +
      `    {\n` +
      `        if (currentDay ${toOp(dayT.dayOperator)} ${dayT.day ?? 1})\n` +
      `        {${guard}            StartCoroutine(ExecuteEvent());\n` +
      `        }\n` +
      `    }`
    )
  }

  const timeT = triggers.find(t => t.type === 'timePhase')
  if (timeT) {
    methods.push(
      `    private void OnTimePhaseChanged(TimePhase phase)\n` +
      `    {\n` +
      `        if (phase == TimePhase.${timeT.timePhase ?? 'Morning'})\n` +
      `        {${guard}            StartCoroutine(ExecuteEvent());\n` +
      `        }\n` +
      `    }`
    )
  }

  if (!dayT && !timeT && !triggers.some(t => t.type === 'always') && extra.length > 0) {
    methods.push(
      `    public void CheckAndExecute()\n` +
      `    {\n` +
      `        if (!(${extra.join(' && ')})) return;\n` +
      `        StartCoroutine(ExecuteEvent());\n` +
      `    }`
    )
  }

  return methods.join('\n\n')
}

/** アクションからコルーチン本体コードを生成 */
function genActions(actions: EventAction[]): string {
  const lines: string[] = []
  for (const a of actions) {
    switch (a.type) {
      case 'dialogue': {
        const arr = (a.dialogueLines ?? []).map(l => `"${escapeCSharp(l)}"`).join(', ')
        lines.push(`        DialogueUI.Instance.ShowDialogue("${escapeCSharp(a.speakerName ?? '')}", new string[] { ${arr} });`)
        lines.push(`        yield return new WaitUntil(() => !DialogueUI.Instance.IsDialogueActive);`)
        break
      }
      case 'setFlag':
        lines.push(`        GameManager.Instance.SetFlag("${escapeCSharp(a.flagKey ?? '')}", ${toBool(a.flagValue ?? true)});`)
        break
      case 'setInt':
        lines.push(`        GameManager.Instance.SetIntValue("${escapeCSharp(a.intKey ?? '')}", ${a.intValue ?? 0});`)
        break
      case 'incrementInt':
        lines.push(`        GameManager.Instance.IncrementIntValue("${escapeCSharp(a.intKey ?? '')}");`)
        break
      case 'movePlayer':
        lines.push(`        // TODO: プレイヤーを${a.targetLocation ?? '不明'}に移動`)
        break
      case 'logAction':
        lines.push(`        EventManager.Instance.TriggerActionLogged("${escapeCSharp(a.actionTag ?? '')}");`)
        break
      case 'playSound':
        lines.push(`        AudioManager.Instance.PlaySFX("${escapeCSharp(a.soundId ?? '')}");`)
        break
      case 'giveItem':
        lines.push(`        // TODO: アイテム「${a.itemId ?? ''}」をインベントリに追加`)
        break
    }
  }
  return lines.join('\n')
}

/** 1つのイベントからC#スクリプト全体を生成 */
function generateScript(event: GameEvent): string {
  const subs = genSubscriptions(event.triggers)
  const unsubs = genUnsubscriptions(event.triggers)
  const conds = genConditionMethods(event.triggers)
  const acts = genActions(event.actions)

  return `${AUTO_GEN_MARKER}
// 生成日時: ${new Date().toISOString()}
using UnityEngine;
using System.Collections;

/// <summary>${escapeCSharp(event.description)}</summary>
public class ${event.scriptName} : MonoBehaviour
{
    [Header("イベント設定")]
    [SerializeField] private string eventId = "${escapeCSharp(event.id)}";
    [SerializeField] private string eventName = "${escapeCSharp(event.name)}";
    [SerializeField] private int priority = ${event.priority};
    [SerializeField] private bool isRepeatable = ${toBool(event.isRepeatable)};

    private bool _hasTriggered = false;

    private void Start()
    {
${subs}
    }

    private void OnDestroy()
    {
${unsubs}
    }

${conds}

    /// <summary>イベント実行</summary>
    private IEnumerator ExecuteEvent()
    {
        if (!isRepeatable && _hasTriggered) yield break;
        _hasTriggered = true;

${acts}
    }
}
`
}

// ===== ルートハンドラー =====

/** POST /sync - イベント一覧からC#スクリプトを自動生成・更新 */
eventsRouter.post('/sync', async (req, res) => {
  try {
    const { events } = req.body as { events: GameEvent[] }
    if (!events || !Array.isArray(events)) {
      res.status(400).json({ success: false, error: 'events配列が必要です' })
      return
    }

    await fs.mkdir(UNITY_EVENTS_DIR, { recursive: true })
    const results: SyncResult[] = []

    for (const event of events) {
      if (!event.scriptName) {
        results.push({ scriptName: event.id ?? '不明', status: 'skipped', path: '', reason: 'scriptName未設定' })
        continue
      }

      const filePath = path.join(UNITY_EVENTS_DIR, `${event.scriptName}.cs`)
      const relPath = `Assets/_Project/Scripts/Events/${event.scriptName}.cs`

      // 既存ファイルチェック
      let existing: string | null = null
      try { existing = await fs.readFile(filePath, 'utf-8') } catch { /* 新規 */ }

      // 手動編集ファイルはスキップ
      if (existing !== null && !existing.startsWith(AUTO_GEN_MARKER)) {
        results.push({ scriptName: event.scriptName, status: 'skipped', path: relPath, reason: '手動編集ファイル' })
        continue
      }

      const newContent = generateScript(event)

      // 変更なしならスキップ
      if (existing !== null) {
        const strip = (s: string) => s.replace(/^\/\/ 生成日時: .+$/m, '')
        if (strip(existing) === strip(newContent)) {
          results.push({ scriptName: event.scriptName, status: 'skipped', path: relPath, reason: '変更なし' })
          continue
        }
      }

      await fs.writeFile(filePath, newContent, 'utf-8')
      results.push({ scriptName: event.scriptName, status: existing ? 'updated' : 'created', path: relPath })
    }

    res.json({ success: true, results })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '不明なエラー'
    console.error('イベント同期エラー:', msg)
    res.status(500).json({ success: false, error: `同期エラー: ${msg}` })
  }
})
