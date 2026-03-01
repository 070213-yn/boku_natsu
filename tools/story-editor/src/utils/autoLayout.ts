/**
 * dagre を使ったノード自動レイアウトユーティリティ
 * ノードとエッジの接続関係に基づいて、見やすい配置を自動計算する
 */
import type { Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';

/** 各ノードのデフォルトサイズ */
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

/**
 * ノードを自動レイアウトして、位置が更新された新しいNodes配列を返す
 *
 * @param nodes - 現在のノード配列
 * @param edges - 現在のエッジ配列
 * @param direction - レイアウト方向。'TB'=上から下、'LR'=左から右（デフォルト: LR）
 * @returns 位置が更新された新しいNodes配列
 */
export function autoLayoutNodes(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'
): Node[] {
  // dagre のグラフを作成
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  // グラフ全体の設定（方向、ノード間隔、ランク間隔）
  g.setGraph({
    rankdir: direction,
    nodesep: 80,  // 同ランク内のノード間隔
    ranksep: 150, // ランク間の間隔
  });

  // ノードをグラフに追加
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // エッジをグラフに追加
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // レイアウトを計算
  dagre.layout(g);

  // 計算結果を元に新しいノード配列を生成
  // dagre はノード中心座標を返すので、左上座標に変換する
  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

// 時間帯の表示順序（横並びのときの左→右の順番）
const TIME_PHASE_ORDER: Record<string, number> = {
  'EarlyMorning': 0,
  'Morning': 1,
  'Noon': 2,
  'Afternoon': 3,
  'Evening': 4,
  'Night': 5,
};

/**
 * 日付ごとに横一直線レイアウト
 *
 * 画像のように、各日付のノードを1行（横一直線）に並べる。
 * - dayStart が左端
 * - イベントが timePhase 順に左→右
 * - 絵日記・就寝系が右端
 * - 日ごとに行が変わる（上→下）
 * - 日付を持たないノード（condition, ending等）は最下行にまとめる
 */
export function horizontalDayLayout(nodes: Node[], edges: Edge[]): Node[] {
  const ROW_SPACING = 250;   // 日付間の縦間隔
  const COL_SPACING = 280;   // ノード間の横間隔

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

  // 日付をソート
  const sortedDays = Array.from(dayGroups.keys()).sort((a, b) => a - b);

  const positionMap = new Map<string, { x: number; y: number }>();

  // 日付ごとに横一行に配置
  sortedDays.forEach((day, dayIndex) => {
    const rowY = dayIndex * ROW_SPACING;
    const dayNodes = dayGroups.get(day)!;

    // ノードを並べ替え: dayStart → timePhase順 → ending
    dayNodes.sort((a, b) => {
      // dayStartは一番左
      if (a.type === 'dayStart') return -1;
      if (b.type === 'dayStart') return 1;
      // endingは一番右
      if (a.type === 'ending') return 1;
      if (b.type === 'ending') return -1;

      // timePhaseで並べる
      const aData = a.data as Record<string, unknown>;
      const bData = b.data as Record<string, unknown>;
      const aPhase = (aData.timePhase as string) || 'Noon';
      const bPhase = (bData.timePhase as string) || 'Noon';
      const aOrder = TIME_PHASE_ORDER[aPhase] ?? 2;
      const bOrder = TIME_PHASE_ORDER[bPhase] ?? 2;

      if (aOrder !== bOrder) return aOrder - bOrder;

      // 同じtimePhaseならラベル順
      const aLabel = (aData.label as string) || '';
      const bLabel = (bData.label as string) || '';
      return aLabel.localeCompare(bLabel);
    });

    // 横一直線に配置
    dayNodes.forEach((node, colIndex) => {
      positionMap.set(node.id, {
        x: colIndex * COL_SPACING,
        y: rowY,
      });
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
