import Card from '../components/common/Card';

/**
 * フラグ管理ページ（仮実装）
 * 後でゲーム内フラグ（条件分岐用の変数）の管理UIに差し替え。
 */
export default function FlagsPage() {
  return (
    <div className="space-y-6">
      <Card title="フラグ管理">
        <p className="text-gray-600">
          ストーリー分岐に使うフラグ（条件変数）を管理します。
        </p>
        <p className="text-gray-400 text-sm mt-2">
          ここにフラグ一覧と編集UIが表示されます。
        </p>
      </Card>
    </div>
  );
}
