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
  type EdgeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import {
  Trash2, Save, GitBranch, Sun, Flag, Diamond,
  Network, Grid3X3, Undo2, Redo2, HelpCircle, Users, MessageSquare,
  Copy, AlignLeft, Upload,
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
import { horizontalDayLayout } from '../utils/autoLayout';
import MonthlyOverview from '../components/eventflow/MonthlyOverview';
import NodeDetailPanel from '../components/event-flow/panels/NodeDetailPanel';
import PresetPanel, { type NodePreset } from '../components/event-flow/panels/PresetPanel';
import MemoEdge from '../components/event-flow/edges/MemoEdge';

// ================================================
// カスタムノードコンポーネント（5種類）
// ================================================

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
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2"
        style={{ background: '#0EA5E9', borderColor: '#0369A1' }}
      />
    </div>
  );
}

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
      <div
        className="h-2 w-full"
        style={{ background: catConfig ? catConfig.color : '#9CA3AF' }}
      />

      <div className="px-3 py-2">
        <div className="text-sm font-bold text-gray-800 mb-1">{label}</div>

        {description && (
          <div className="text-xs text-gray-500 mb-1 line-clamp-2">
            {description}
          </div>
        )}

        {hasChoice && choiceQuestion && (
          <div className="text-xs text-indigo-600 mb-1 font-medium flex items-center gap-1">
            <HelpCircle size={10} />
            {choiceQuestion}
          </div>
        )}

        <div className="flex items-center gap-1 flex-wrap">
          {catConfig && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: catConfig.color }}
            >
              {catConfig.label}
            </span>
          )}
          {timeConfig && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: timeConfig.color }}
            >
              {timeConfig.label}
            </span>
          )}
          {characters.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 flex items-center gap-0.5">
              <Users size={8} />
              {characters.length}
            </span>
          )}
          {dialogues.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 flex items-center gap-0.5">
              <MessageSquare size={8} />
              {dialogues.length}
            </span>
          )}
        </div>

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

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: catConfig ? catConfig.color : '#9CA3AF', borderColor: '#FFF' }}
      />

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

function ConditionNode({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || '条件分岐';
  const logic = data.logic as string | undefined;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 160, height: 100 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
          border: '2px solid #6366F1',
          borderRadius: '12px',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      />
      <div className="relative z-10 text-center px-2">
        <div className="text-xs font-bold text-indigo-700">{label}</div>
        {logic && (
          <div className="text-[10px] text-indigo-400 mt-0.5">{logic}</div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: '#6366F1', borderColor: '#FFF', left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!w-3 !h-3 !border-2"
        style={{ background: '#22C55E', borderColor: '#FFF', top: '25%', right: -6 }}
      />
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
        <div className="text-sm font-bold text-gray-800 mb-1">{label}</div>
        {question && (
          <div className="text-xs text-amber-700 mb-2 font-medium">{question}</div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200">
            {yesLabel}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200">
            {noLabel}
          </span>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: '#EAB308', borderColor: '#FFF' }}
      />
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
    </div>
  );
}

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
// ツールバー定義
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
// ストア <-> ReactFlow 変換
// ================================================

function toReactFlowNode(n: FlowNode): Node {
  return {
    id: n.id,
    type: n.type,
    position: { x: n.position.x, y: n.position.y },
    data: { ...n.data } as Record<string, unknown>,
  };
}

function toFlowNode(n: Node): FlowNode {
  return {
    id: n.id,
    type: (n.type || 'event') as FlowNode['type'],
    position: { x: n.position.x, y: n.position.y },
    data: { ...n.data } as EventNodeData | ConditionNodeData | ChoiceNodeData | { label: string; day?: number },
  };
}

function toReactFlowEdge(e: FlowEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.data?.label || undefined,
    type: 'memo',
    interactionWidth: 20,
  };
}

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
// メモ編集ポップアップの型
// ================================================
interface MemoEditorState {
  edgeId: string;
  x: number;
  y: number;
  text: string;
}

// ================================================
// メインのフローエディタコンポーネント
// ================================================

function EventFlowEditor() {
  const { data, isLoading, load, save, update, markDirty } = useEventFlowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { pushHistory, undo, redo, canUndo, canRedo, clearHistory } = useFlowHistory();
  const [historyVersion, setHistoryVersion] = useState(0);

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'flow' | 'monthly'>('flow');

  // プリセットパネルの表示切替
  const [showPresetPanel, setShowPresetPanel] = useState(false);

  // Unity同期の状態管理
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // メモ編集ポップアップ
  const [memoEditor, setMemoEditor] = useState<MemoEditorState | null>(null);
  const memoInputRef = useRef<HTMLInputElement>(null);

  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

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

  // カスタムエッジタイプ（選択時緑色、ラベルクリック編集対応、点線アニメーション）
  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      memo: MemoEdge,
    }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!data || initialLoadDone.current) return;
    initialLoadDone.current = true;
    setNodes(data.nodes.map(toReactFlowNode));
    setEdges(data.edges.map(toReactFlowEdge));
    clearHistory();
  }, [data, setNodes, setEdges, clearHistory]);

  // メモ保存関数
  const saveMemo = useCallback(() => {
    if (!memoEditor) return;
    pushHistory(nodesRef.current, edgesRef.current);
    setEdges((eds) =>
      eds.map((e) =>
        e.id === memoEditor.edgeId
          ? { ...e, label: memoEditor.text.trim() || undefined }
          : e
      )
    );
    markDirty();
    setMemoEditor(null);
  }, [memoEditor, pushHistory, setEdges, markDirty]);

  // エッジラベルクリック時のカスタムイベントリスナー
  useEffect(() => {
    const handleLabelClick = (e: Event) => {
      const { edgeId, clientX, clientY } = (e as CustomEvent).detail;
      const edge = edgesRef.current.find((ed) => ed.id === edgeId);
      setMemoEditor({
        edgeId,
        x: clientX,
        y: clientY,
        text: (edge?.label as string) || '',
      });
    };
    window.addEventListener('edge-label-click', handleLabelClick);
    return () => window.removeEventListener('edge-label-click', handleLabelClick);
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        const success = undo(nodesRef.current, edgesRef.current, setNodes, setEdges);
        if (success) {
          markDirty();
          setHistoryVersion((v) => v + 1);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        const success = redo(nodesRef.current, edgesRef.current, setNodes, setEdges);
        if (success) {
          markDirty();
          setHistoryVersion((v) => v + 1);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setNodes, setEdges, markDirty]);

  const handleNodeDragStart = useCallback(() => {
    pushHistory(nodesRef.current, edgesRef.current);
  }, [pushHistory]);

  const handleNodeDragStop = useCallback(() => {
    markDirty();
  }, [markDirty]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const newEdge: Edge = {
        id: `edge_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'memo',
        interactionWidth: 20,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      markDirty();
    },
    [setEdges, markDirty, pushHistory]
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodeIds(new Set(selectedNodes.map((n) => n.id)));
      setSelectedEdgeIds(new Set(selectedEdges.map((e) => e.id)));
    },
    []
  );

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEditingNodeId(node.id);
  }, []);

  // 右クリックでメモ追加/編集ポップアップを開く
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setMemoEditor({
        edgeId: edge.id,
        x: event.clientX,
        y: event.clientY,
        text: (edge.label as string) || '',
      });
    },
    []
  );

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
          nodeData = { label: '条件分岐', conditions: [], logic: 'AND' };
          break;
        case 'choice':
          nodeData = { label: 'Yes/No選択', question: '', yesLabel: 'はい', noLabel: 'いいえ' };
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

  // プリセットからノードを追加
  const handleAddPresetNode = useCallback(
    (preset: NodePreset) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const id = `node_${Date.now()}`;
      const offsetX = Math.random() * 100 - 50;
      const offsetY = Math.random() * 100 - 50;

      const newNode: Node = {
        id,
        type: preset.nodeType,
        position: { x: 400 + offsetX, y: 300 + offsetY },
        data: { ...preset.nodeData },
      };

      setNodes((nds) => [...nds, newNode]);
      markDirty();
    },
    [setNodes, markDirty, pushHistory]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;
    pushHistory(nodesRef.current, edgesRef.current);

    if (selectedNodeIds.size > 0) {
      setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target))
      );
    }
    if (selectedEdgeIds.size > 0) {
      setEdges((eds) => eds.filter((e) => !selectedEdgeIds.has(e.id)));
    }

    if (editingNodeId && selectedNodeIds.has(editingNodeId)) {
      setEditingNodeId(null);
    }
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    markDirty();
  }, [selectedNodeIds, selectedEdgeIds, setNodes, setEdges, markDirty, pushHistory, editingNodeId]);

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const deletedIds = new Set(deletedEdges.map((e) => e.id));
      setEdges((eds) => eds.filter((e) => !deletedIds.has(e.id)));
      markDirty();
    },
    [setEdges, markDirty, pushHistory]
  );

  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      pushHistory(nodesRef.current, edgesRef.current);
      const deletedIds = new Set(deletedNodes.map((n) => n.id));
      setNodes((nds) => nds.filter((n) => !deletedIds.has(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target))
      );
      if (editingNodeId && deletedIds.has(editingNodeId)) {
        setEditingNodeId(null);
      }
      markDirty();
    },
    [setNodes, setEdges, markDirty, pushHistory, editingNodeId]
  );

  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      pushHistory(nodesRef.current, edgesRef.current);
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n)));
      markDirty();
    },
    [setNodes, markDirty, pushHistory]
  );

  const handleManualSave = useCallback(() => {
    update((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      nodes: nodes.map(toFlowNode),
      edges: edges.map(toFlowEdge),
    }));
    save();
  }, [nodes, edges, update, save]);

  // 整列レイアウト（BFSベース、日付ごとに横一直線）
  const handleHorizontalLayout = useCallback(() => {
    pushHistory(nodesRef.current, edgesRef.current);
    const layoutedNodes = horizontalDayLayout(nodes, edges);
    setNodes(layoutedNodes);
    markDirty();
  }, [nodes, edges, setNodes, markDirty, pushHistory]);

  // Unity同期（EventFlow → DayFlow C#生成）
  const handleUnitySync = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      // まず保存
      handleManualSave();
      // C#生成APIを呼び出し
      const res = await fetch('/api/eventflow/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const { created, updated, skipped } = data.summary;
        setSyncResult({
          success: true,
          message: `生成: ${created}件 / 更新: ${updated}件 / スキップ: ${skipped}件`,
        });
      } else {
        setSyncResult({ success: false, message: data.error || '同期に失敗しました' });
      }
    } catch (err) {
      setSyncResult({ success: false, message: `通信エラー: ${err}` });
    } finally {
      setIsSyncing(false);
      // 5秒後に結果表示を消す
      setTimeout(() => setSyncResult(null), 5000);
    }
  }, [handleManualSave]);

  // キャンバスクリック時にメモエディタを閉じる
  const handlePaneClick = useCallback(() => {
    if (memoEditor) {
      saveMemo();
    }
  }, [memoEditor, saveMemo]);

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

  const editingNode = useMemo(
    () => (editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null),
    [nodes, editingNodeId]
  );

  // プリセットパネルに渡す「現在選択中のノード」情報
  const currentNodeForPreset = useMemo(() => {
    if (!editingNode) return null;
    return {
      type: editingNode.type || 'event',
      data: editingNode.data as Record<string, unknown>,
    };
  }, [editingNode]);

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

  const selectedCount = selectedNodeIds.size + selectedEdgeIds.size;

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

          {/* プリセットボタン */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPresetPanel(!showPresetPanel)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm ${
              showPresetPanel
                ? 'bg-ocean-500 text-white'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
            title="プリセット一覧"
          >
            <Copy size={16} />
            プリセット
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                const success = undo(nodesRef.current, edgesRef.current, setNodes, setEdges);
                if (success) {
                  markDirty();
                  setHistoryVersion((v) => v + 1);
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
                  setHistoryVersion((v) => v + 1);
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
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>

          {/* 整列ボタン */}
          <button
            onClick={handleHorizontalLayout}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-ocean-100 hover:bg-ocean-200 text-ocean-700 transition-colors"
            title="エッジ接続順に横一直線で整列"
          >
            <AlignLeft size={14} />
            整列
          </button>

          {/* Unity同期ボタン */}
          <button
            onClick={handleUnitySync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
            title="EventFlow → Unity DayFlow C# を生成"
          >
            <Upload size={14} />
            {isSyncing ? '同期中...' : 'Unity同期'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('flow')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'flow'
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
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
          >
            <Grid3X3 size={14} />
            月間概要
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            icon={<Trash2 size={14} />}
            onClick={handleDeleteSelected}
            disabled={selectedCount === 0}
            className="!px-3 !py-1.5 !text-xs"
          >
            削除 {selectedCount > 0 && `(${selectedCount})`}
          </Button>
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

      {/* メインコンテンツ */}
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
            onEdgeContextMenu={handleEdgeContextMenu}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'memo' }}
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
            <Background color="#c4c4c4" gap={20} size={1} />
            <Controls
              position="bottom-left"
              showInteractive={false}
              style={{ borderRadius: '8px', overflow: 'hidden' }}
            />
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

          {/* プリセットパネル（左側スライドイン） */}
          {showPresetPanel && (
            <PresetPanel
              onAddPreset={handleAddPresetNode}
              onClose={() => setShowPresetPanel(false)}
              currentNodeData={currentNodeForPreset}
            />
          )}

          {/* ノード詳細パネル（右側スライドイン） */}
          {editingNode && (
            <NodeDetailPanel
              node={editingNode}
              onUpdateNode={handleUpdateNodeData}
              onClose={() => setEditingNodeId(null)}
            />
          )}
        </div>
      )}

      {/* メモ編集ポップアップ（右クリック or ラベルクリック時） */}
      {memoEditor && (
        <div
          className="fixed z-[9999]"
          style={{
            left: Math.min(memoEditor.x, window.innerWidth - 260),
            top: Math.min(memoEditor.y, window.innerHeight - 100),
          }}
        >
          {/* 背景クリックで閉じる */}
          <div className="fixed inset-0" onClick={saveMemo} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 p-3 min-w-[240px]">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              遷移メモを編集
            </div>
            <input
              ref={memoInputRef}
              autoFocus
              type="text"
              value={memoEditor.text}
              onChange={(e) => setMemoEditor({ ...memoEditor, text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveMemo();
                if (e.key === 'Escape') setMemoEditor(null);
              }}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
              placeholder="メモを入力..."
            />
            <div className="text-[9px] text-gray-300 mt-1">
              Enter: 保存 / Esc: キャンセル
            </div>
          </div>
        </div>
      )}

      {/* Unity同期結果の通知 */}
      {syncResult && (
        <div
          className={`mx-2 mt-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
            syncResult.success
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          {syncResult.success ? 'Unity同期完了' : 'Unity同期エラー'}: {syncResult.message}
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
          Ctrl+Z: 戻す / Ctrl+Shift+Z: 進む / Delete: 選択削除 / 右クリック: メモ追加
        </span>
      </div>
    </div>
  );
}

export default function EventFlowPage() {
  return (
    <ReactFlowProvider>
      <EventFlowEditor />
    </ReactFlowProvider>
  );
}
