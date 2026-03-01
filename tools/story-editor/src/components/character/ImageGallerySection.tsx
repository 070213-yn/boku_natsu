import { useState, useCallback, useRef } from 'react';
import { ImagePlus, Trash2, X, ZoomIn } from 'lucide-react';
import Card from '../common/Card';
import { uploadCharacterImage, deleteCharacterImage } from '../../utils/api';
import type { CharacterProfile } from '../../types';

interface Props {
  character: CharacterProfile;
  onUpdate: (updater: (char: CharacterProfile) => CharacterProfile) => void;
}

export default function ImageGallerySection({ character, onUpdate }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルアップロード処理
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const newPaths: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const path = await uploadCharacterImage(file);
        newPaths.push(path);
      }
      if (newPaths.length > 0) {
        onUpdate((c) => ({ ...c, images: [...c.images, ...newPaths] }));
      }
    } catch (err) {
      console.error('画像アップロードエラー:', err);
    } finally {
      setUploading(false);
    }
  }, [onUpdate]);

  // D&Dハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // 画像削除
  const handleDelete = useCallback(async (imagePath: string, index: number) => {
    try {
      // パスからファイル名を取得
      const filename = imagePath.split('/').pop();
      if (filename) {
        await deleteCharacterImage(filename);
      }
    } catch {
      // サーバーから削除できなくてもリストからは除去する
    }
    onUpdate((c) => ({ ...c, images: c.images.filter((_, i) => i !== index) }));
  }, [onUpdate]);

  return (
    <>
      <Card>
        <h3 className="font-serif-jp text-lg font-bold text-sunset-600 mb-4 flex items-center gap-2">
          <ImagePlus size={20} />
          デザイン画像
          <span className="text-xs font-normal text-gray-400 ml-1">({character.images.length}枚)</span>
        </h3>

        {/* 画像グリッド */}
        {character.images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {character.images.map((img, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-white/10 border border-white/20">
                <img src={img} alt={`${character.displayName} ${idx + 1}`} className="w-full h-full object-cover" />
                {/* ホバーオーバーレイ */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setPreviewImage(img)}
                    className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-colors"
                    title="拡大表示"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(img, idx)}
                    className="p-2 bg-red-500/90 rounded-lg text-white hover:bg-red-600 transition-colors"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* D&Dアップロードエリア */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
            ${isDragging
              ? 'border-ocean-400 bg-ocean-50/20'
              : 'border-white/30 hover:border-ocean-300 hover:bg-white/5'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <ImagePlus size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">
            {uploading ? 'アップロード中...' : 'クリックまたはD&Dで画像を追加'}
          </p>
          <p className="text-xs text-gray-300 mt-1">PNG, JPG, WebP（10MBまで）</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleUpload(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </Card>

      {/* プレビューモーダル */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
          <img
            src={previewImage}
            alt="プレビュー"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
