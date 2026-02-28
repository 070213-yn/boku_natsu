import Card from '../components/common/Card';

/**
 * ストーリー分岐ページ（仮実装）
 * 後でノードベースのストーリー分岐エディタに差し替え。
 */
export default function EventFlowPage() {
  return (
    <div className="space-y-6">
      <Card title="ストーリー分岐">
        <p className="text-gray-600">
          ストーリーの分岐をノード形式で管理します。
        </p>
        <p className="text-gray-400 text-sm mt-2">
          ここにイベントフローエディタが表示されます。
        </p>
      </Card>
    </div>
  );
}
