import Card from '../components/common/Card';

/**
 * 設定ページ（仮実装）
 * 後でプロジェクト設定やエクスポート設定UIに差し替え。
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card title="設定">
        <p className="text-gray-600">
          プロジェクトの各種設定を変更します。
        </p>
        <p className="text-gray-400 text-sm mt-2">
          ここにプロジェクト設定、エクスポート設定、テーマ設定などが表示されます。
        </p>
      </Card>
    </div>
  );
}
