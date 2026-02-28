import Card from '../components/common/Card';

/**
 * タイムラインページ（仮実装）
 * 後でゲーム内の時間軸管理UIに差し替え。
 */
export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <Card title="タイムライン">
        <p className="text-gray-600">
          ゲーム内の時間軸に沿ったイベントを管理します。
        </p>
        <p className="text-gray-400 text-sm mt-2">
          ここにタイムラインエディタが表示されます。
        </p>
      </Card>
    </div>
  );
}
