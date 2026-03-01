/**
 * ノード自動レイアウトユーティリティ
 * エッジ接続順（BFS）に基づいて、日付ごとに横一直線で並べる
 */
import type { Node, Edge } from '@xyflow/react';

/** レイアウト定数 */
const ROW_SPACING = 250;      // 日付間の縦間隔
const COL_SPACING = 280;      // ノード間の横間隔
const BRANCH_OFFSET = 130;    // 分岐時の上下オフセット

/**
 * 分岐ハンドルかどうかを判定
 * condition: true/false、choice/event(hasChoice): yes/no
 */
function isBranchSource(node: Node): boolean {
  if (node.type === 'condition' || node.type === 'choice') return true;
  const data = node.data as Record<string, unknown>;
  return data.hasChoice === true;
}

/**
 * エッジが「上段（Yes/True）」側かどうかを判定
 */
function isYesBranch(edge: Edge): boolean {
  const h = edge.sourceHandle;
  return h === 'yes' || h === 'true';
}

/**
 * 日付ごとにBFSで横一直線レイアウト
 *
 * アルゴリズム:
 * 1. ノードを日付ごとにグループ化
 * 2. 各日付グループで dayStart を起点にエッジをBFS（幅優先探索）でたどる
 * 3. condition/choiceノードで分岐 → Yes=上段(y-BRANCH_OFFSET)、No=下段(y+BRANCH_OFFSET)
 * 4. 合流ノード（複数の入力エッジを持つ）は中央に戻す
 * 5. 日付を持たないノードは最下行にまとめる
 */
export function horizontalDayLayout(nodes: Node[], edges: Edge[]): Node[] {
  // エッジのルックアップテーブルを構築
  // sourceId → そこから出るエッジ一覧
  const outEdges = new Map<string, Edge[]>();
  // targetId → そこに入るエッジ一覧
  const inEdges = new Map<string, Edge[]>();
  const nodeMap = new Map<string, Node>();

  nodes.forEach((n) => nodeMap.set(n.id, n));
  edges.forEach((e) => {
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    outEdges.get(e.source)!.push(e);
    if (!inEdges.has(e.target)) inEdges.set(e.target, []);
    inEdges.get(e.target)!.push(e);
  });

  // 日付ごとにノードをグループ化
  const dayGroups = new Map<number, Node[]>();
  const noDayNodes: Node[] = [];

  nodes.forEach((node) => {
    const day = (node.data as Record<string, unknown>)?.day as number | undefined;
    if (day != null) {
      if (!dayGroups.has(day)) dayGroups.set(day, []);
      dayGroups.get(day)!.push(node);
    } else {
      noDayNodes.push(node);
    }
  });

  const sortedDays = Array.from(dayGroups.keys()).sort((a, b) => a - b);
  const positionMap = new Map<string, { x: number; y: number }>();

  // 各日付グループをBFSで配置
  sortedDays.forEach((day, dayIndex) => {
    const baseY = dayIndex * ROW_SPACING;
    const dayNodes = dayGroups.get(day)!;
    const dayNodeIds = new Set(dayNodes.map((n) => n.id));

    // dayStartノードを探す
    const startNode = dayNodes.find((n) => n.type === 'dayStart');

    if (!startNode) {
      // dayStartがない場合はそのまま横に並べる
      dayNodes.forEach((node, i) => {
        positionMap.set(node.id, { x: i * COL_SPACING, y: baseY });
      });
      return;
    }

    // BFSで接続順にノードを配置
    const visited = new Set<string>();
    // キュー: [ノードID, y方向のオフセット]
    const queue: Array<[string, number]> = [[startNode.id, 0]];
    visited.add(startNode.id);
    let colIndex = 0;

    while (queue.length > 0) {
      const [nodeId, yOffset] = queue.shift()!;
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      // 合流ノードの判定: 複数の入力エッジがある場合はy方向を中央(0)に戻す
      const incoming = (inEdges.get(nodeId) || []).filter((e) => dayNodeIds.has(e.source));
      const finalYOffset = incoming.length > 1 ? 0 : yOffset;

      positionMap.set(nodeId, {
        x: colIndex * COL_SPACING,
        y: baseY + finalYOffset,
      });
      colIndex++;

      // このノードから出るエッジをたどる
      const outgoing = (outEdges.get(nodeId) || []).filter(
        (e) => dayNodeIds.has(e.target) && !visited.has(e.target)
      );

      if (outgoing.length === 0) continue;

      // 分岐ノードの場合: Yes=上段、No=下段
      if (isBranchSource(node) && outgoing.length >= 2) {
        // Yes（上段）とNo（下段）を分ける
        const yesEdges = outgoing.filter((e) => isYesBranch(e));
        const noEdges = outgoing.filter((e) => !isYesBranch(e));

        // Yes側を先にキューに追加（上段）
        yesEdges.forEach((e) => {
          if (!visited.has(e.target)) {
            visited.add(e.target);
            queue.push([e.target, -BRANCH_OFFSET]);
          }
        });
        // No側（下段）
        noEdges.forEach((e) => {
          if (!visited.has(e.target)) {
            visited.add(e.target);
            queue.push([e.target, BRANCH_OFFSET]);
          }
        });
      } else {
        // 直線: 同じyオフセットを維持
        outgoing.forEach((e) => {
          if (!visited.has(e.target)) {
            visited.add(e.target);
            queue.push([e.target, finalYOffset]);
          }
        });
      }
    }

    // BFSで到達しなかったノード（孤立ノード）を末尾に配置
    dayNodes.forEach((node) => {
      if (!visited.has(node.id)) {
        positionMap.set(node.id, {
          x: colIndex * COL_SPACING,
          y: baseY,
        });
        colIndex++;
      }
    });
  });

  // 日付なしノードは最下行にまとめて配置
  if (noDayNodes.length > 0) {
    const lastRowY = sortedDays.length * ROW_SPACING;
    noDayNodes.forEach((node, colIndex) => {
      positionMap.set(node.id, {
        x: colIndex * COL_SPACING,
        y: lastRowY,
      });
    });
  }

  // 位置を適用
  return nodes.map((node) => {
    const pos = positionMap.get(node.id);
    if (pos) {
      return { ...node, position: pos };
    }
    return node;
  });
}
