import { BaseEdge, getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

/**
 * カスタムエッジコンポーネント（メモ付き遷移ライン）
 *
 * - 選択中は緑色、非選択時はグレー
 * - メモ（ラベル）があれば中央に表示
 * - ラベルクリックでメモ編集を発火（カスタムイベント）
 * - 右クリックメモ追加はEventFlowEditor側で処理
 */
export default function MemoEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  label,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const memo = (label as string) || '';

  return (
    <>
      {/* エッジのパス（選択中は緑色、太さも変更） */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? '#22C55E' : '#94A3B8',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: 5,
        }}
        interactionWidth={20}
      />

      {/* メモラベル（あれば表示） */}
      {memo && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className="px-2 py-0.5 rounded text-[10px] bg-white/95 border text-gray-600 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors shadow-sm max-w-[160px] truncate"
              style={{
                borderColor: selected ? '#22C55E' : '#D1D5DB',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // カスタムイベントでメモ編集を通知
                window.dispatchEvent(
                  new CustomEvent('edge-label-click', {
                    detail: { edgeId: id, clientX: e.clientX, clientY: e.clientY },
                  })
                );
              }}
            >
              {memo}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
