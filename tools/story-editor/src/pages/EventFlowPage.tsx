import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import {
  Trash2, Save, GitBranch, Sun, Flag, Diamond, LayoutGrid,
  Network, Grid3X3, Undo2, Redo2, HelpCircle, Users, MessageSquare,
} from 'lucide-react';
import Button from '../components/common/Button';
import { useEventFlowStore } from '../hooks/useStores';
import { useFlowHistory } from '../hooks/useFlowHistory';
import type {
  FlowNode,
  FlowEdge,
  EventNodeData,
  ConditionNodeData,
  ChoiceNodeData,
  EventCategory,
  TimePhase,
} from '../types';
import { CATEGORY_CONFIG, TIME_PHASE_CONFIG } from '../types';
import { autoLayoutNodes } from '../utils/autoLayout';
import MonthlyOverview from '../components/eventflow/MonthlyOverview';
import NodeDetailPanel from '../components/event-flow/panels/NodeDetailPanel';

// ================================================
// カスタムノードコンポーネント（5種類）
// ================================================

/**
 * 日の始まりノード
 * 丸みのある開始ノード。日付ラベルを表示する。
 */
function DayStartNode({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || '日の始まり';
  const day = data.day as number | undefined;

  return (
    <div
      className="px-5 py-3 rounded-full border-2 shadow-lg min-w-[140px] text-center"
      style={{
        background: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
        borderColor: '#0EA5E9',
      }}
    >
      {/* 日付バッジ */}
      {day !== undefined && (
        <div
          className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: '#0EA5E9' }}
        >
          {day}
        </div>
      )}
      <div className="text-sm font-bold" style={{ color: '#0369A1' }}>
        {label}
      </div>
      {/* 右側にsource ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2"
        style={{ background: '#0EA5E9', borderColor: '#0369A1' }}
      />
    </div>
  );
}

/**
 * イベントノード（メイン）
 * カテゴリに応じた色帯、ラベル、カテゴリバッジ、時間帯バッジを表示する。
 * hasChoice が true の場合、Yes/No の2つの出力ハンドルを持つ。
 */
function EventNode({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || 'イベント';
  const description = data.description as string | undefined;
  const category = data.category as EventCategory | undefined;
  const timePhase = data.timePhase as TimePhase | undefined;
  const hasChoice = data.hasChoice as boolean | undefined;
  const choiceYesLabel = (data.choiceYesLabel as string) || 'はい';
  const choiceNoLabel = (data.choiceNoLabel as string) || 'いいえ';
  const choiceQuestion = data.choiceQuestion as string | undefined;
  const characters = (data.characters as { id: string; name: string }[]) || [];
  const dialogues = (data.dialogues as { id: string }[]) || [];

  // カテゴリ設定を取得（未設定の場合はデフォルト色を使う）
  const catConfig = category ? CATEGORY_CONFIG[category] : null;
  const timeConfig = timePhase ? TIME_PHASE_CONFIG[timePhase] : null;

  return (
    <div
      className="rounded-xl shadow-lg min-w-[180px] max-w-[260px] overflow-hidden border"
      style={{
        background: catConfig ? catConfig.bgColor : '#FFFFFF',
        borderColor: catConfig ? catConfig.color : '#D1D5DB',
      }}
    >
      {/* カテゴリ色帯（上部） */}
      <div
        className="h-2 w-full"
        style={{ background: catConfig ? catConfig.color : '#9CA3AF' }}
      />

      <div className="px-3 py-2">
        {/* ラベル */}
        <div className="text-sm font-bold text-gray-800 mb-1">{label}</div>

        {/* 説明文（あれば） */}
        {description && (
          <div className="text-xs text-gray-500 mb-1 line-clamp-2">
            {description}
          </div>
        )}

        {/* 選択肢質問（hasChoiceの場合） */}
        {hasChoice && choiceQuestion && (
          <div className="text-xs text-indigo-600 mb-1 font-medium flex items-center gap-1">
            <HelpCircle size={10} />
            {choiceQuestion}
          </div>
        )}

        {/* バッジ行 */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* カテゴリバッジ */}
          {catConfig && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: catConfig.color }}
            >
              {catConfig.label}
            </span>
          )}
          {/* 時間帯バッジ */}
          {timeConfig && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: timeConfig.color }}
            >
              {timeConfig.label}
            </span>
          )}
          {/* 登場人物数バッジ */}
          {characters.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 flex items-center gap-0.5">
              <Users size={8} />
              {characters.length}
            </span>
          )}
          {/* セリフ数バッジ */}
          {dialogues.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 flex items-center gap-0.5">
              <MessageSquare size={8} />
              {dialogues.length}
            </span>
          )}
        </div>

        {/* Yes/Noラベル表示（hasChoiceの場合） */}
        {hasChoice && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
              {choiceYesLabel}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
              {choiceNoLabel}
            </span>
          </div>
        )}
      </div>

      {/* 左にtarget ハンドル */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: catConfig ? catConfig.color : '#9CA3AF', borderColor: '#FFF' }}
      />

      {/* 右にsource ハンドル（hasChoiceの場合はYes/Noの2つ） */}
      {hasChoice ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className="!w-3 !h-3 !border-2"
            style={{ background: '#22C55E', borderColor: '#FFF', top: '35%', right: -6 }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className="!w-3 !h-3 !border-2"
            style={{ background: '#EF4444', borderColor: '#FFF', top: '65%', right: -6 }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !border-2"
          style={{ background: catConfig ? catConfig.color : '#9CA3AF', borderColor: '#FFF' }}
        />
      )}
    </div>
  );
}

/**
 * 条件分岐ノード
 * ひし形風デザイン（角を丸めたダイヤモンド形）。
 * true/false の2つの出力ハンドルを持つ。
 */
function ConditionNode({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || '条件分岐';
  const logic = data.logic as string | undefined;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 160, height: 100 }}
    >
      {/* ひし形風の背景 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
          border: '2px solid #6366F1',
          borderRadius: '12px',
          transform: 'rotate(0deg)',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      />

      {/* テキスト（回転しない） */}
      <div className="relative z-10 text-center px-2">
        <div className="text-xs font-bold text-indigo-700">{label}</div>
        {logic && (
          <div className="text-[10px] text-indigo-400 mt-0.5">{logic}</div>
        )}
      </div>

      {/* 左にtarget ハンドル */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: '#6366F1', borderColor: '#FFF', left: -6 }}
      />
      {/* 右上に"true" source ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!w-3 !h-3 !border-2"
        style={{ background: '#22C55E', borderColor: '#FFF', top: '25%', right: -6 }}
      />
      {/* 右下に"false" source ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!w-3 !h-3 !border-2"
        style={{ background: '#EF4444', borderColor: '#FFF', top: '75%', right: -6 }}
      />
    </div>
  );
}

/**
 * Yes/No 選択ノード
 * プレイヤーに提示する選択肢ノード。質問テキストとYes/Noラベルを表示する。
 * （条件分岐ノードはプログラム的な判定、こちらはプレイヤーの選択）
 */
function ChoiceNode({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || 'Yes/No選択';
  const question = (data.question as string) || '';
  const yesLabel = (data.yesLabel as string) || 'はい';
  const noLabel = (data.noLabel as string) || 'いいえ';

  return (
    <div
      className="rounded-xl shadow-lg min-w-[180px] max-w-[240px] overflow-hidden border-2"
      style={{
        background: 'linear-gradient(135deg, #FEF9C3, #FEF08A)',
        borderColor: '#EAB308',
      }}
    >
      {/* 上部のアイコンバー */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{ background: 'rgba(234, 179, 8, 0.2)' }}
      >
        <HelpCircle size={12} style={{ color: '#A16207' }} />
        <span className="text-[10px] font-bold" style={{ color: '#A16207' }}>
          Yes/No 選択
        </span>
      </div>

      <div className="px-3 py-2">
        {/* ラベル */}
        <div className="text-sm font-bold text-gray-800 mb-1">{label}</div>

        {/* 質問テキスト */}
        {question && (
          <div className="text-xs text-amber-700 mb-2 font-medium">
            {question}
          </div>
        )}

        {/* Yes/No ラベル */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200">
            {yesLabel}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200">
            {noLabel}
          </span>
        </div>
      </div>

      {/* 左にtarget ハンドル */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: '#EAB308', borderColor: '#FFF' }}
      />
      {/* 右上に"yes" source ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="!w-3 !h-3 !border-2"
        style={{ background: '#22C55E', borderColor: '#FFF', top: '35%', right: -6 }}
      />
      {/* 右下に"no" source ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        className="!w-3 !h-3 !border-2"
        style={{ background: '#EF4444', borderColor: '#FFF', top: '65%', right: -6 }}
      />
    </div>
  );
}

/**
 * エンディングノード
 * 終端ノード。sunset系の色で表示する。
 */
function EndingNode({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || 'エンディング';

  return (
    <div
      className="px-5 py-3 rounded-2xl border-2 shadow-lg min-w-[140px] text-center"
      style={{
        background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
        borderColor: '#F97316',
      }}
    >
      <div className="text-sm font-bold" style={{ color: '#EA580C' }}>
        {label}
      </div>
      {/* 左にtarget ハンドル */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: '#F97316', borderColor: '#EA580C' }}
      />
    </div>
  );
}

// ================================================
// ノード追加用ツールバーの型定義
// ================================================

interface ToolbarItem {
  type: 'dayStart' | 'event' | 'condition' | 'choice' | 'ending';
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { type: 'dayStart', label: '日の始まり', icon: <Sun size={16} />, color: '#0EA5E9' },
  { type: 'event', label: 'イベント', icon: <GitBranch size={16} />, color: '#22C55E' },
  { type: 'choice', label: 'Yes/No選択', icon: <HelpCircle size={16} />, color: '#EAB308' },
  { type: 'condition', label: '条件分岐', icon: <Diamond size={16} />, color: '#6366F1' },
  { type: 'ending', label: 'エンディング', icon: <Flag size={16} />, color: '#F97316' },
];

// ================================================
// ストアのFlowNode/FlowEdge <-> ReactFlowのNode/Edge 変換
// ================================================

/** ストアのFlowNodeをReactFlowのNodeに変換 */
function toReactFlowNode(n: FlowNode): Node {
  return {
    id: n.id,
    type: n.type,
    position: { x: n.position.x, y: n.position.y },
    data: { ...n.data } as Record<string, unknown>,
  };
}

/** ReactFlowのNodeをストアのFlowNodeに変換 */
function toFlowNode(n: Node): FlowNode {
  return {
    id: n.id,
    type: (n.type || 'event') as FlowNode['type'],
    position: { x: n.position.x, y: n.position.y },
    data: { ...n.data } as EventNodeData | ConditionNodeData | ChoiceNodeData | { label: string; day?: number },
  };
}

/** ストアのFlowEdgeをReactFlowのEdgeに変換 */
function toReactFlowEdge(e: FlowEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.data?.label || undefined,
    animated: true,
    interactionWidth: 20, // クリック範囲を広くする（エッジ選択しやすくする）
    style: { stroke: '#94A3B8', strokeWidth: 2 },
  };
}

/** ReactFlowのEdgeをストアのFlowEdgeに変換 */
function toFlowEdge(e: Edge): FlowEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    data: { label: (e.label as string) || undefined },
  };
}

// ================================================
// メインのフローエディタコンポーネント（内部）
// ================================================

function EventFlowEditor() {
  const { data, isLoading, load, save, update, markDirty } = useEventFlowStore();

  // ReactFlowのノードとエッジの状態管理
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Undo/Redo 履歴管理
  const { pushHistory, undo, redo, canUndo, canRedo, clearHistory } = useFlowHistory();

  // Undo/Redo の状態変更を追跡してUIを更新するためのカウンター
  const [historyVersion, setHistoryVersion] = useState(0);

  // 選択中のノード・エッジ管理
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

  // ノード詳細パネル用（クリックしたノード）
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // 日別フィルター
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  // ビューモード切替（フロー表示 or 月間概要表示）
  const [viewMode, setViewMode] = useState<'flow' | 'monthly'>('flow');

  // 現在のノード・エッジへの参照（Undo/Redo のキーボードハンドラーで使用）
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // カスタムノードタイプをメモ化
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      dayStart: DayStartNode,
      event: EventNode,
      condition: ConditionNode,
      choice: ChoiceNode,
      ending: EndingNode,
    }),
    []
  );

  // 初回ロード
  useEffect(() => {
    load();
  }, [load]);

  // 初回ロード時のみストアからReactFlowに反映
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!data || initialLoadDone.current) return;
    initialLoadDone.current = true;
    setNodes(data.nodes.map(toReactFlowNode));
    setEdges(data.edges.map(toReactFlowEdge));
    clearHistory();
  }, [data, setNodes, setEdges, clearHistory]);

  // Undo/Redo & 保存のキーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // パネル内の入力中は無視
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      // Ctrl+Z: 元に戻す
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        const success = undo(nodesRef.current, edgesRef.current, setNodes, setEdges);
        if (success) {
          markDirty();
          setHistoryVersion(v => v + 1);
        }
        return;
      }
      // Ctrl+Shift+Z: やり直す
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        const success = redo(nodesRef.current, edgesRef.current, setNodes, setEdges);
        if (success) {
          markDirty();
          setHistoryVersion(v => v + 1);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setNodes, setEdges, markDirty]);

  // ノードのドラッグ開始時に履歴を保存
  const handleNodeDragStart = useCallback(() => {
    pushHistory(nodesRef.current, edgesRef.current);
  }, [pushHistory]);

  // ノードのドラッグ終了時にdirtyマーク
  const handleNodeDragStop = useCallback(
    () => { markDirty(); },
    [markDirty]
  );

  // エッジの接続時（履歴保存付き）
  const handleConnect = useCallback(
    (connection: Connection) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const newEdge: Edge = {
        id: `edge_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        animated: true,
        interactionWidth: 20,
        style: { stroke: '#94A3B8', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      markDirty();
    },
    [setEdges, markDirty, pushHistory]
  );

  // ノード・エッジの選択状態を追跡
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodeIds(new Set(selectedNodes.map((n) => n.id)));
      setSelectedEdgeIds(new Set(selectedEdges.map((e) => e.id)));
    },
    []
  );

  // ノードクリック時に詳細パネルを開く
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEditingNodeId(node.id);
  }, []);

  // ノード追加（履歴保存付き）
  const handleAddNode = useCallback(
    (type: 'dayStart' | 'event' | 'condition' | 'choice' | 'ending') => {
      pushHistory(nodesRef.current, edgesRef.current);
      const id = `node_${Date.now()}`;
      const offsetX = Math.random() * 100 - 50;
      const offsetY = Math.random() * 100 - 50;

      let nodeData: Record<string, unknown>;
      switch (type) {
        case 'dayStart':
          nodeData = { label: '新しい日の始まり', day: 1 };
          break;
        case 'event':
          nodeData = {
            label: '新しいイベント',
            description: '',
            category: 'routine' as EventCategory,
            timePhase: 'Morning' as TimePhase,
            characters: [],
            dialogues: [],
          };
          break;
        case 'condition':
          nodeData = {
            label: '条件分岐',
            conditions: [],
            logic: 'AND',
          };
          break;
        case 'choice':
          nodeData = {
            label: 'Yes/No選択',
            question: '',
            yesLabel: 'はい',
            noLabel: 'いいえ',
          };
          break;
        case 'ending':
          nodeData = { label: 'エンディング' };
          break;
      }

      const newNode: Node = {
        id,
        type,
        position: { x: 400 + offsetX, y: 300 + offsetY },
        data: nodeData,
      };

      setNodes((nds) => [...nds, newNode]);
      markDirty();
    },
    [setNodes, markDirty, pushHistory]
  );

  // 選択中のノード・エッジを削除（履歴保存付き）
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;
    pushHistory(nodesRef.current, edgesRef.current);

    if (selectedNodeIds.size > 0) {
      setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
      setEdges((eds) => eds.filter(
        (e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
      ));
    }
    if (selectedEdgeIds.size > 0) {
      setEdges((eds) => eds.filter((e) => !selectedEdgeIds.has(e.id)));
    }

    // 編集中のノードが削除されたらパネルを閉じる
    if (editingNodeId && selectedNodeIds.has(editingNodeId)) {
      setEditingNodeId(null);
    }

    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    markDirty();
  }, [selectedNodeIds, selectedEdgeIds, setNodes, setEdges, markDirty, pushHistory, editingNodeId]);

  // エッジ削除時（Deleteキー対応、履歴保存付き）
  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const deletedIds = new Set(deletedEdges.map((e) => e.id));
      setEdges((eds) => eds.filter((e) => !deletedIds.has(e.id)));
      markDirty();
    },
    [setEdges, markDirty, pushHistory]
  );

  // ノード削除時（Deleteキー対応、履歴保存付き）
  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const deletedIds = new Set(deletedNodes.map((n) => n.id));
      setNodes((nds) => nds.filter((n) => !deletedIds.has(n.id)));
      setEdges((eds) => eds.filter(
        (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
      ));
      // 編集中のノードが削除されたらパネルを閉じる
      if (editingNodeId && deletedIds.has(editingNodeId)) {
        setEditingNodeId(null);
      }
      markDirty();
    },
    [setNodes, setEdges, markDirty, pushHistory, editingNodeId]
  );

  // ノード詳細パネルからの更新（履歴保存付き）
  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      pushHistory(nodesRef.current, edgesRef.current);
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
      );
      markDirty();
    },
    [setNodes, markDirty, pushHistory]
  );

  // 手動保存（ReactFlowの現在状態をストアに同期してから保存）
  const handleManualSave = useCallback(() => {
    update((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      nodes: nodes.map(toFlowNode),
      edges: edges.map(toFlowEdge),
    }));
    save();
  }, [nodes, edges, update, save]);

  // 自動整列（dagre によるノード自動配置、履歴保存付き）
  const handleAutoLayout = useCallback(() => {
    pushHistory(nodesRef.current, edgesRef.current);
    const layoutedNodes = autoLayoutNodes(nodes, edges);
    setNodes(layoutedNodes);
    markDirty();
  }, [nodes, edges, setNodes, markDirty, pushHistory]);

  // 日別フィルター用のデータ
  const availableDays = useMemo(() => {
    const days = new Set<number>();
    nodes.forEach((n) => {
      const day = (n.data as Record<string, unknown>)?.day as number | undefined;
      if (day != null) days.add(day);
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (dayFilter === null) return nodes;
    return nodes.filter((n) => {
      const day = (n.data as Record<string, unknown>)?.day as number | undefined;
      return day === dayFilter;
    });
  }, [nodes, dayFilter]);

  const filteredEdges = useMemo(() => {
    if (dayFilter === null) return edges;
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [edges, filteredNodes, dayFilter]);

  // 編集中のノードオブジェクトを取得
  const editingNode = useMemo(
    () => (editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null),
    [nodes, editingNodeId]
  );

  // MiniMapのノード色を決定する関数
  const miniMapNodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'dayStart':
        return '#0EA5E9';
      case 'event': {
        const cat = node.data?.category as EventCategory | undefined;
        return cat && CATEGORY_CONFIG[cat] ? CATEGORY_CONFIG[cat].color : '#9CA3AF';
      }
      case 'condition':
        return '#6366F1';
      case 'choice':
        return '#EAB308';
      case 'ending':
        return '#F97316';
      default:
        return '#9CA3AF';
    }
  }, []);

  // 選択中のアイテム総数（削除ボタン用）
  const selectedCount = selectedNodeIds.size + selectedEdgeIds.size;

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 8rem)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-ocean-300 border-t-ocean-600 rounded-full"
        />
        <span className="ml-3 text-gray-500 text-sm">フローデータを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* 上部ツールバー */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card flex items-center justify-between px-4 py-2 mb-2 !rounded-xl"
      >
        {/* 左側: ノード追加ボタン群 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 mr-1">追加:</span>
          {TOOLBAR_ITEMS.map((item) => (
            <motion.button
              key={item.type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAddNode(item.type)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors shadow-sm"
              style={{ background: item.color }}
              title={`${item.label}ノードを追加`}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* 中央: 日別フィルター & 自動整列 & Undo/Redo */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo ボタン */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                const success = undo(nodesRef.current, edgesRef.current, setNodes, setEdges);
                if (success) {
                  markDirty();
                  setHistoryVersion(v => v + 1);
                }
              }}
              disabled={!canUndo()}
              className="p-1.5 rounded-lg text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
              title="元に戻す (Ctrl+Z)"
            >
              <Undo2 size={14} className="text-gray-600" />
            </button>
            <button
              onClick={() => {
                const success = redo(nodesRef.current, edgesRef.current, setNodes, setEdges);
                if (success) {
                  markDirty();
                  setHistoryVersion(v => v + 1);
                }
              }}
              disabled={!canRedo()}
              className="p-1.5 rounded-lg text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
              title="やり直す (Ctrl+Shift+Z)"
            >
              <Redo2 size={14} className="text-gray-600" />
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200" />

          <span className="text-xs font-bold text-gray-500">日:</span>
          <select
            value={dayFilter ?? ''}
            onChange={(e) => setDayFilter(e.target.value === '' ? null : Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg text-xs bg-white/80 border border-gray-300 text-gray-700"
          >
            <option value="">全体</option>
            {availableDays.map((d) => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>

          {/* 自動整列ボタン */}
          <button
            onClick={handleAutoLayout}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="ノードを自動整列する"
          >
            <LayoutGrid size={14} />
            自動整列
          </button>
        </div>

        {/* ビューモード切替 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('flow')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'flow'
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="フロー表示"
          >
            <Network size={14} />
            フロー
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="月間概要表示"
          >
            <Grid3X3 size={14} />
            月間概要
          </button>
        </div>

        {/* 右側: 削除 & 保存ボタン */}
        <div className="flex items-center gap-2">
          {/* 選択中のノード・エッジ削除ボタン */}
          <Button
            variant="danger"
            icon={<Trash2 size={14} />}
            onClick={handleDeleteSelected}
            disabled={selectedCount === 0}
            className="!px-3 !py-1.5 !text-xs"
          >
            削除 {selectedCount > 0 && `(${selectedCount})`}
          </Button>

          {/* 手動保存ボタン */}
          <Button
            variant="secondary"
            icon={<Save size={14} />}
            onClick={handleManualSave}
            className="!px-3 !py-1.5 !text-xs"
          >
            保存
          </Button>
        </div>
      </motion.div>

      {/* メインコンテンツ: フロー表示 or 月間概要 */}
      {viewMode === 'monthly' ? (
        <div className="flex-1 rounded-xl overflow-hidden border border-white/20 shadow-lg">
          <MonthlyOverview
            nodes={nodes}
            onDaySelect={(day) => {
              setDayFilter(day);
              setViewMode('flow');
            }}
          />
        </div>
      ) : (
        <div className="relative flex-1 rounded-xl overflow-hidden border border-white/20 shadow-lg">
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragStop={handleNodeDragStop}
            onSelectionChange={handleSelectionChange}
            onNodesDelete={handleNodesDelete}
            onEdgesDelete={handleEdgesDelete}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.02}
            maxZoom={8}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
            edgesFocusable={true}
            edgesReconnectable={true}
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            {/* ドットパターン背景 */}
            <Background color="#c4c4c4" gap={20} size={1} />

            {/* 左下にズームコントロール */}
            <Controls
              position="bottom-left"
              showInteractive={false}
              style={{ borderRadius: '8px', overflow: 'hidden' }}
            />

            {/* 右下にミニマップ */}
            <MiniMap
              position="bottom-right"
              nodeColor={miniMapNodeColor}
              maskColor="rgba(0, 0, 0, 0.1)"
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.8)',
              }}
            />
          </ReactFlow>

          {/* ノード詳細パネル（クリックで開く） */}
          {editingNode && (
            <NodeDetailPanel
              node={editingNode}
              onUpdateNode={handleUpdateNodeData}
              onClose={() => setEditingNodeId(null)}
            />
          )}
        </div>
      )}

      {/* ステータスバー */}
      <div className="flex items-center justify-between px-2 py-1 text-[10px] text-gray-400 mt-1">
        <span>
          ノード: {nodes.length} / エッジ: {edges.length}
          {selectedCount > 0 && (
            <span className="ml-2 text-ocean-500">
              選択中: {selectedNodeIds.size > 0 && `${selectedNodeIds.size}ノード`}
              {selectedNodeIds.size > 0 && selectedEdgeIds.size > 0 && '、'}
              {selectedEdgeIds.size > 0 && `${selectedEdgeIds.size}エッジ`}
            </span>
          )}
        </span>
        <span>
          Ctrl+Z: 戻す / Ctrl+Shift+Z: 進む / Delete: 選択削除 / Ctrl+S: 保存
        </span>
      </div>
    </div>
  );
}

// ================================================
// メインエクスポート（ReactFlowProviderでラップ）
// ================================================

/**
 * ストーリー分岐フローエディタページ
 * ReactFlowを使ったビジュアルノードエディタで、
 * ゲームのイベントフロー（ストーリー分岐）を編集する。
 */
export default function EventFlowPage() {
  return (
    <ReactFlowProvider>
      <EventFlowEditor />
    </ReactFlowProvider>
  );
}
