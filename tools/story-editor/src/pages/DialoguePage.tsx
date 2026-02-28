import Card from '../components/common/Card';

/**
 * 会話テキストページ（仮実装）
 * 後でキャラクター会話エディタに差し替え。
 */
export default function DialoguePage() {
  return (
    <div className="space-y-6">
      <Card title="会話テキスト">
        <p className="text-gray-600">
          キャラクター同士の会話テキストを編集します。
        </p>
        <p className="text-gray-400 text-sm mt-2">
          ここに会話エディタが表示されます。
        </p>
      </Card>
    </div>
  );
}
