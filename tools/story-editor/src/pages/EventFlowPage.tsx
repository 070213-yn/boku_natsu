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
import { Trash2, Save, GitBranch, Sun, Flag, Diamond, LayoutGrid, Network, Grid3X3 } from 'lucide-react';
import Button from '../components/common/Button';
import { useEventFlowStore } from '../hooks/useStores';
import type {
  FlowNode,
  FlowEdge,
  EventNodeData,
  ConditionNodeData,
  EventCategory,
  TimePhase,
} from '../types';
import { CATEGORY_CONFIG, TIME_PHASE_CONFIG } from '../types';
import { autoLayoutNodes } from '../utils/autoLayout';
import MonthlyOverview from '../components/eventflow/MonthlyOverview';

// ================================================
// カスタムノードコンポーネント（4種類）
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
 */
function EventNode({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || 'イベント';
  const description = data.description as string | undefined;
  const category = data.category as EventCategory | undefined;
  const timePhase = data.timePhase as TimePhase | undefined;

  // カテゴリ設定を取得（未設定の場合はデフォルト色を使う）
  const catConfig = category ? CATEGORY_CONFIG[category] : null;
  const timeConfig = timePhase ? TIME_PHASE_CONFIG[timePhase] : null;

  return (
    <div
      className="rounded-xl shadow-lg min-w-[180px] max-w-[240px] overflow-hidden border"
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
          <div className="text-xs text-gray-500 mb-2 line-clamp-2">
            {description}
          </div>
        )}

        {/* バッジ行 */}
        <div className="flex items-center gap-1.5 flex-wrap">
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
        </div>
      </div>

      {/* 左にtarget ハンドル */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2"
        style={{ background: catConfig ? catConfig.color : '#9CA3AF', borderColor: '#FFF' }}
      />
      {/* 右にsource ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2"
        style={{ background: catConfig ? catConfig.color : '#9CA3AF', borderColor: '#FFF' }}
      />
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
  type: 'dayStart' | 'event' | 'condition' | 'ending';
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { type: 'dayStart', label: '日の始まり', icon: <Sun size={16} />, color: '#0EA5E9' },
  { type: 'event', label: 'イベント', icon: <GitBranch size={16} />, color: '#22C55E' },
  { type: 'condition', label: '条件分岐', icon: <Diamond size={16} />, color: '#6366F1' },
  { type: 'ending', label: 'エンディング', icon: <Flag size={16} />, color: '#F97316' },
];

// ================================================
// ストアのFlowNode/FlowEdge ⇔ ReactFlowのNode/Edge 変換
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
    data: { ...n.data } as EventNodeData | ConditionNodeData | { label: string; day?: number },
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

  // 選択中のノード管理
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // 日別フィルター
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  // ビューモード切替（フロー表示 or 月間概要表示）
  const [viewMode, setViewMode] = useState<'flow' | 'monthly'>('flow');

  // カスタムノードタイプをメモ化（リレンダリング時に再作成させない）
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      dayStart: DayStartNode,
      event: EventNode,
      condition: ConditionNode,
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
  }, [data, setNodes, setEdges]);

  // ノードのドラッグ終了時にdirtyマーク
  const handleNodeDragStop = useCallback(
    () => { markDirty(); },
    [markDirty]
  );

  // エッジの接続時
  const handleConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: `edge_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        animated: true,
        style: { stroke: '#94A3B8', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      markDirty();
    },
    [setEdges, markDirty]
  );

  // ノードの選択状態を追跡
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      setSelectedNodeIds(new Set(selectedNodes.map((n) => n.id)));
    },
    []
  );

  // ノードの追加
  const handleAddNode = useCallback(
    (type: 'dayStart' | 'event' | 'condition' | 'ending') => {
      const id = `node_${Date.now()}`;
      // キャンバス中央付近にランダムなオフセットを加えて配置
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
          };
          break;
        case 'condition':
          nodeData = {
            label: '条件分岐',
            conditions: [],
            logic: 'AND',
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
    [setNodes, markDirty]
  );

  // 選択中のノードを削除
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.size === 0) return;
    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
    setEdges((eds) => eds.filter(
      (e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    ));
    setSelectedNodeIds(new Set());
    markDirty();
  }, [selectedNodeIds, setNodes, setEdges, markDirty]);

  // エッジ削除時にdirtyマーク
  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      const deletedIds = new Set(deletedEdges.map((e) => e.id));
      setEdges((eds) => eds.filter((e) => !deletedIds.has(e.id)));
      markDirty();
    },
    [setEdges, markDirty]
  );

  // ノード削除時にdirtyマーク（Deleteキー対応）
  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      const deletedIds = new Set(deletedNodes.map((n) => n.id));
      setNodes((nds) => nds.filter((n) => !deletedIds.has(n.id)));
      setEdges((eds) => eds.filter(
        (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
      ));
      markDirty();
    },
    [setNodes, setEdges, markDirty]
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

  // 自動整列（dagre によるノード自動配置）
  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = autoLayoutNodes(nodes, edges);
    setNodes(layoutedNodes);
    markDirty();
  }, [nodes, edges, setNodes, markDirty]);

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
      case 'ending':
        return '#F97316';
      default:
        return '#9CA3AF';
    }
  }, []);

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
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 mr-1">追加:</span>
          {TOOLBAR_ITEMS.map((item) => (
            <motion.button
              key={item.type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAddNode(item.type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors shadow-sm"
              style={{ background: item.color }}
              title={`${item.label}ノードを追加`}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* 日別フィルター & 自動整列 */}
        <div className="flex items-center gap-2">
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
          {/* 選択中ノード削除ボタン */}
          <Button
            variant="danger"
            icon={<Trash2 size={14} />}
            onClick={handleDeleteSelected}
            disabled={selectedNodeIds.size === 0}
            className="!px-3 !py-1.5 !text-xs"
          >
            削除 {selectedNodeIds.size > 0 && `(${selectedNodeIds.size})`}
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
              // 選択した日でフィルターしてフロー表示に切替
              setDayFilter(day);
              setViewMode('flow');
            }}
          />
        </div>
      ) : (
        <div className="flex-1 rounded-xl overflow-hidden border border-white/20 shadow-lg">
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeDragStop={handleNodeDragStop}
            onSelectionChange={handleSelectionChange}
            onNodesDelete={handleNodesDelete}
            onEdgesDelete={handleEdgesDelete}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
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
        </div>
      )}

      {/* ステータスバー */}
      <div className="flex items-center justify-between px-2 py-1 text-[10px] text-gray-400 mt-1">
        <span>
          ノード: {nodes.length} / エッジ: {edges.length}
        </span>
        <span>手動保存: Ctrl+S または保存ボタン</span>
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
