import Card from '../components/common/Card';

/**
 * 日記システムページ（仮実装）
 * 後でゲーム内日記の編集UIに差し替え。
 */
export default function DiaryPage() {
  return (
    <div className="space-y-6">
      <Card title="日記システム">
        <p className="text-gray-600">
          ゲーム内の日記エントリーを作成・管理します。
        </p>
        <p className="text-gray-400 text-sm mt-2">
          ここに日記エディタが表示されます。
        </p>
      </Card>
    </div>
  );
}
