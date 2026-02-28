import Card from '../components/common/Card';

/**
 * ダッシュボードページ（仮実装）
 * 後で実際のダッシュボードコンテンツに差し替え。
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card title="ダッシュボード">
        <p className="text-gray-600">
          「なつのしま」ゲーム開発の全体状況を確認できます。
        </p>
        <p className="text-gray-400 text-sm mt-2">
          ここにストーリー進捗、タスク一覧、最近の編集などが表示されます。
        </p>
      </Card>
    </div>
  );
}
