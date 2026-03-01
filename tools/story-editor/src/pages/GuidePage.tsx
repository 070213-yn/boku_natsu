import { motion } from 'framer-motion';
import { BookOpen, Copy, Check, MessageSquare, Gamepad2, Palette, Wrench, Bug, FileText, Lightbulb, ArrowRight, Zap, XCircle, Terminal } from 'lucide-react';
import Card from '../components/common/Card';
import { useState, useCallback } from 'react';

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

// コピーボタンコンポーネント
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/20 hover:bg-white/30 text-gray-500 hover:text-gray-700 transition-all"
      title="コピー"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? 'コピーしました' : 'コピー'}
    </button>
  );
}

// セッションカテゴリの定義
interface SessionCategory {
  icon: React.ReactNode;
  title: string;
  color: string;
  bgColor: string;
  description: string;
  starterPrompt: string;
  examples: string[];
  canCombineWith: string[];
  shouldSeparateFrom: string[];
}

const SESSION_CATEGORIES: SessionCategory[] = [
  {
    icon: <Wrench size={20} />,
    title: 'Story Editor機能追加',
    color: 'text-ocean-500',
    bgColor: 'bg-ocean-100',
    description: 'Story Editorに新しいページや機能を追加するとき',
    starterPrompt: 'C:\\boku_natsu のなつのしまプロジェクトで作業します。PROGRESS.mdを読んでから、Story Editorに〇〇機能を追加してください。',
    examples: [
      '新しい編集ページを追加したい',
      '既存ページに機能を追加したい',
      'ダッシュボードに新しい統計を表示したい',
    ],
    canCombineWith: ['Story EditorのUI修正やバグ修正は同じセッションでOK'],
    shouldSeparateFrom: ['Unity C#の作業', 'ゲーム企画の議論'],
  },
  {
    icon: <Bug size={20} />,
    title: 'Story Editorバグ修正・UI調整',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    description: 'Story Editorの表示崩れ、動作不具合、デザイン調整',
    starterPrompt: 'C:\\boku_natsu のStory Editorで問題があります。以下のバグを修正してください: 〇〇',
    examples: [
      'ページの表示が崩れている',
      'ボタンが効かない',
      'デザインの色や配置を変えたい',
    ],
    canCombineWith: ['同じページに関する複数のバグは一緒に依頼OK', '小さなUI調整は機能追加と一緒でもOK'],
    shouldSeparateFrom: ['大きな新機能追加', 'Unity側の作業'],
  },
  {
    icon: <Gamepad2 size={20} />,
    title: 'Unity ゲーム実装',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'UnityのC#スクリプト作成・ゲームシステム実装',
    starterPrompt: 'C:\\boku_natsu のなつのしまプロジェクトで作業します。GAME_DESIGN.mdを読んでから、Unity側の〇〇を実装してください。',
    examples: [
      'プレイヤー移動を実装したい',
      'イベント実行エンジンを作りたい',
      '会話UIを実装したい',
      'セーブ・ロード機能を作りたい',
    ],
    canCombineWith: ['関連するシステム同士（例: 移動+カメラ、イベント+会話）'],
    shouldSeparateFrom: ['Story Editorの作業', '3Dモデルの話'],
  },
  {
    icon: <MessageSquare size={20} />,
    title: 'ゲームデータ編集・イベント追加',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    description: 'イベント・会話・フラグなどのゲームデータをJSONで追加・修正',
    starterPrompt: 'C:\\boku_natsu のなつのしまプロジェクトで作業します。PROGRESS.mdを読んでから、〇〇のゲームデータを追加・修正してください。',
    examples: [
      'イベントを追加したい',
      'NPCの会話内容を充実させたい',
      'フラグや解放条件を調整したい',
      'タイムラインのイベント配置を見直したい',
    ],
    canCombineWith: ['関連するデータ同士（例: イベント+会話+フラグ）はまとめてOK'],
    shouldSeparateFrom: ['UIの変更', 'Unity実装'],
  },
  {
    icon: <FileText size={20} />,
    title: 'ゲーム企画・設計の相談',
    color: 'text-sunset-500',
    bgColor: 'bg-sunset-100',
    description: 'ゲームの仕様、ストーリー、演出、バランスについて相談',
    starterPrompt: 'C:\\boku_natsu のなつのしまプロジェクトについて相談です。GAME_PLAN.mdとGAME_DESIGN.mdを読んでから、〇〇について一緒に考えてほしいです。',
    examples: [
      'エンディングの条件を決めたい',
      'イベントのバランスを見直したい',
      '新しいイベントのアイデアを出したい',
      '未決定事項を決めたい',
    ],
    canCombineWith: ['企画を決めた後そのままデータ編集するのはOK'],
    shouldSeparateFrom: ['コーディング作業'],
  },
  {
    icon: <Palette size={20} />,
    title: 'アセット・リソース関連',
    color: 'text-pink-500',
    bgColor: 'bg-pink-100',
    description: '3Dモデル、テクスチャ、サウンド、アニメーションの準備や設定',
    starterPrompt: 'C:\\boku_natsu のなつのしまプロジェクトで作業します。〇〇のアセットについて作業してください。',
    examples: [
      'サウンド設定を追加したい',
      'アニメーション設定を作りたい',
      'アセットの整理をしたい',
    ],
    canCombineWith: ['同じ種類のアセット作業はまとめてOK'],
    shouldSeparateFrom: ['ゲームロジック', 'Story Editor'],
  },
];

// 重要なルールセクション
const IMPORTANT_RULES = [
  {
    title: 'セッションの始め方',
    content: '「C:\\\\boku_natsu の〇〇をやって」とパスを含めて伝えてください。パスがあればClaude Codeが迷わずプロジェクトに到達し、CLAUDE.mdを自動で読みます。',
  },
  {
    title: '必要なファイルだけ読ませる',
    content: 'CLAUDE.mdは最小限の情報だけ。作業に必要なファイル（PROGRESS.mdやGAME_DESIGN.md等）は指示テンプレートに含まれているので、コピペするだけでOKです。',
  },
  {
    title: 'セッション終了時',
    content: '大きな変更をしたら「PROGRESS.mdを更新して」と伝えてください。次のセッションで現状を把握できるようになります。',
  },
  {
    title: '1セッション = 1テーマ',
    content: '1つの会話では1つのテーマに集中。会話が長くなるとコンテキストが圧縮され、古い内容を忘れます。30往復を超えたら新しいセッションに。',
  },
];

export default function GuidePage() {
  return (
    <motion.div className="space-y-8 max-w-5xl" {...fadeIn}>
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <BookOpen size={28} className="text-sunset-500" />
        <div>
          <h2 className="font-serif-jp text-2xl font-bold text-gray-800">開発ガイド</h2>
          <p className="text-sm text-gray-500 mt-1">Claude Codeでの開発セッションの始め方と進め方</p>
        </div>
      </div>

      {/* 重要なルール */}
      <Card>
        <h3 className="font-serif-jp text-lg font-bold text-sunset-600 mb-4 flex items-center gap-2">
          <Lightbulb size={20} />
          基本ルール
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {IMPORTANT_RULES.map((rule, idx) => (
            <div key={idx} className="bg-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-700 mb-2">{rule.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{rule.content}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* セッションカテゴリ */}
      <div>
        <h3 className="font-serif-jp text-lg font-bold text-gray-700 mb-4">セッションの種類と始め方</h3>
        <div className="space-y-4">
          {SESSION_CATEGORIES.map((cat, idx) => (
            <Card key={idx}>
              {/* カテゴリヘッダー */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${cat.bgColor}`}>
                  <span className={cat.color}>{cat.icon}</span>
                </div>
                <div>
                  <h4 className="font-serif-jp font-bold text-gray-800">{cat.title}</h4>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>
              </div>

              {/* スターター指示テンプレート */}
              <div className="bg-gray-900/5 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Claude Codeに最初に伝える文:</span>
                  <CopyButton text={cat.starterPrompt} />
                </div>
                <p className="text-sm text-gray-700 font-mono leading-relaxed">{cat.starterPrompt}</p>
              </div>

              {/* 例 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-400 block mb-2">こんなときに使う:</span>
                  <ul className="space-y-1">
                    {cat.examples.map((ex, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-ocean-400 mt-0.5">-</span>
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-medium text-green-500 block mb-2">一緒にやってOK:</span>
                  <ul className="space-y-1">
                    {cat.canCombineWith.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-green-400 mt-0.5">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-medium text-red-400 block mb-2">別セッションにすべき:</span>
                  <ul className="space-y-1">
                    {cat.shouldSeparateFrom.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Unity連携セクション */}
      <div>
        <h3 className="font-serif-jp text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Gamepad2 size={20} className="text-green-600" />
          Unity連携
        </h3>

        {/* データフロー図 */}
        <Card>
          <h4 className="text-sm font-bold text-gray-700 mb-4">データフロー</h4>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: 'Story Editor', sub: '(ビジュアル編集)', color: 'bg-ocean-100 text-ocean-700 border-ocean-300' },
              { label: 'JSON', sub: '(data/*.json)', color: 'bg-gray-100 text-gray-700 border-gray-300' },
              { label: 'C# 自動生成', sub: '(サーバーAPI)', color: 'bg-green-100 text-green-700 border-green-300' },
              { label: 'Unity', sub: '(Assets/_Project/)', color: 'bg-purple-100 text-purple-700 border-purple-300' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`px-4 py-3 rounded-xl border text-center ${step.color}`}>
                  <div className="text-sm font-bold">{step.label}</div>
                  <div className="text-[10px] mt-0.5">{step.sub}</div>
                </div>
                {i < 3 && <ArrowRight size={16} className="text-gray-300" />}
              </div>
            ))}
          </div>
        </Card>

        {/* 自動化できること / できないこと */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Card>
            <h4 className="text-sm font-bold text-green-600 mb-3 flex items-center gap-1.5">
              <Zap size={16} />
              自動化できること
            </h4>
            <ul className="space-y-2">
              {[
                'EventFlow → DayFlow C#（日ごとのコルーチンチェーン）',
                'EventList → 個別イベント C#（トリガー＋アクション）',
                'JSON一括エクスポート（Story Editor → Unity Data）',
                'フラグ整合性チェック（未定義フラグの検出）',
              ].map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h4 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-1.5">
              <XCircle size={16} />
              自動化できないこと
            </h4>
            <ul className="space-y-2">
              {[
                'シーン上のGameObject配置・階層構成',
                '3Dモデル・テクスチャ・マテリアルの作成',
                'UIプレハブの作成・レイアウト調整',
                'InspectorでのSerializeField参照設定',
              ].map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Claude Codeへの指示テンプレート */}
        <Card>
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-1.5 mt-4">
            <Terminal size={16} />
            Claude Codeへの指示テンプレート
          </h4>
          <div className="space-y-3">
            {[
              {
                title: 'EventFlow変更後のUnity同期',
                prompt: 'C:\\boku_natsu のStory EditorでEventFlowを変更しました。「Unity同期」ボタンでC#を再生成してから、生成されたDayFlowスクリプトに問題がないか確認してください。',
              },
              {
                title: 'C#スクリプトの手動修正',
                prompt: 'C:\\boku_natsu のAssets/_Project/Scripts/DayFlow/ にある DayFlow_DayXX.cs の自動生成コードを確認して、必要な修正を加えてください。修正後はAUTO-GENERATEDマーカーを削除して手動管理に切り替えてください。',
              },
              {
                title: 'デバッグ依頼',
                prompt: 'C:\\boku_natsu のUnityプロジェクトでDay XX のイベントフローが正しく動きません。DayFlow_DayXX.cs と EventFlow.json の該当日のノードを確認して、原因を特定してください。',
              },
            ].map((tmpl, i) => (
              <div key={i} className="bg-gray-900/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600">{tmpl.title}</span>
                  <CopyButton text={tmpl.prompt} />
                </div>
                <p className="text-xs text-gray-700 font-mono leading-relaxed">{tmpl.prompt}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* セッション判断フローチャート */}
      <Card>
        <h3 className="font-serif-jp text-lg font-bold text-sunset-600 mb-4">迷ったときの判断基準</h3>
        <div className="space-y-3">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-700 font-medium mb-2">同じセッションでやるべき場合:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>- 変更Aの結果を確認してから変更Bを決めたい（依存関係がある）</li>
              <li>- 同じファイルの複数箇所を修正する</li>
              <li>- 企画を相談 → その場でデータに反映したい</li>
              <li>- バグ修正 → 修正確認 → 関連する別のバグも修正</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-700 font-medium mb-2">別セッションに分けるべき場合:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>- Story Editor（Web）とUnity（C#）は必ず別セッション</li>
              <li>- 会話が30往復を超えたら、区切りの良いところで新しいセッションを始める</li>
              <li>- 全く関係ないテーマ（例: UI修正とゲーム企画の相談）</li>
              <li>- 前のセッションから日が変わった場合</li>
            </ul>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
