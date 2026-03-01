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
