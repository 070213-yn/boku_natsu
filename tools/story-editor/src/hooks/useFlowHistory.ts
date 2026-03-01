import { useRef, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';

// Undo/Redo用の履歴スナップショット
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

// 最大履歴数（メモリ節約のため制限）
const MAX_HISTORY = 50;

/**
 * フローエディタのUndo/Redo機能を提供するカスタムフック
 *
 * 使い方:
 * 1. 変更前に pushHistory(currentNodes, currentEdges) を呼んで現在の状態を保存
 * 2. Ctrl+Z で undo()、Ctrl+Shift+Z で redo() を呼ぶ
 */
export function useFlowHistory() {
  const undoStack = useRef<HistoryState[]>([]);
  const redoStack = useRef<HistoryState[]>([]);

  // ノード・エッジをディープコピー（参照を切り離す）
  const deepCopy = useCallback((nodes: Node[], edges: Edge[]): HistoryState => {
    return {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
  }, []);

  // 現在の状態を履歴に保存（変更操作の前に呼ぶ）
  const pushHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    undoStack.current.push(deepCopy(nodes, edges));
    // 最大数を超えたら古いものを削除
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    // 新しい操作をしたらRedoスタックはクリア
    redoStack.current = [];
  }, [deepCopy]);

  // 元に戻す（Ctrl+Z）
  const undo = useCallback((
    currentNodes: Node[],
    currentEdges: Edge[],
    setNodes: (updater: Node[] | ((nodes: Node[]) => Node[])) => void,
    setEdges: (updater: Edge[] | ((edges: Edge[]) => Edge[])) => void,
  ): boolean => {
    if (undoStack.current.length === 0) return false;

    // 現在の状態をRedoスタックに保存
    redoStack.current.push(deepCopy(currentNodes, currentEdges));

    // Undoスタックから復元
    const state = undoStack.current.pop()!;
    setNodes(state.nodes);
    setEdges(state.edges);
    return true;
  }, [deepCopy]);

  // やり直す（Ctrl+Shift+Z）
  const redo = useCallback((
    currentNodes: Node[],
    currentEdges: Edge[],
    setNodes: (updater: Node[] | ((nodes: Node[]) => Node[])) => void,
    setEdges: (updater: Edge[] | ((edges: Edge[]) => Edge[])) => void,
  ): boolean => {
    if (redoStack.current.length === 0) return false;

    // 現在の状態をUndoスタックに保存
    undoStack.current.push(deepCopy(currentNodes, currentEdges));

    // Redoスタックから復元
    const state = redoStack.current.pop()!;
    setNodes(state.nodes);
    setEdges(state.edges);
    return true;
  }, [deepCopy]);

  // 履歴があるか確認
  const canUndo = useCallback(() => undoStack.current.length > 0, []);
  const canRedo = useCallback(() => redoStack.current.length > 0, []);

  // 履歴をリセット（データ再読み込み時など）
  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  return { pushHistory, undo, redo, canUndo, canRedo, clearHistory };
}
