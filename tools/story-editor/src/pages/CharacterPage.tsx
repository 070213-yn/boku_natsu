import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import CharacterList from '../components/character/CharacterList';
import CharacterDetail from '../components/character/CharacterDetail';
import { useCharacterStore, useDialogueStore, useEventListStore, useEventFlowStore } from '../hooks/useStores';
import { useToastStore } from '../components/common/Toast';
import type { CharacterProfile } from '../types';

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

export default function CharacterPage() {
  const { data, isLoading, load, update } = useCharacterStore();
  const dialogueStore = useDialogueStore();
  const eventListStore = useEventListStore();
  const eventFlowStore = useEventFlowStore();
  const addToast = useToastStore((s) => s.addToast);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  // 初回読み込み（3ストアとも）
  useEffect(() => {
    load();
    dialogueStore.load();
    eventListStore.load();
    eventFlowStore.load();
  }, [load, dialogueStore.load, eventListStore.load, eventFlowStore.load]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 font-sans-jp">読み込み中...</div>
      </div>
    );
  }

  const characters = data.characters;
  const selectedCharacter = characters[selectedIndex] ?? null;

  // EventFlowのノード一覧（リンク用）
  const flowNodes = (eventFlowStore.data?.nodes ?? [])
    .filter((n: any) => n.data?.label)
    .map((n: any) => ({ id: n.id, label: n.data.label as string }));

  // EventListのイベント一覧（リンク用）
  const eventListItems = (eventListStore.data?.events ?? [])
    .map((e: any) => ({ id: e.id, name: e.name }));

  // キャラクター追加
  const handleAdd = () => {
    const newChar: CharacterProfile = {
      id: `char_${Date.now().toString(36)}`,
      name: '新しいキャラクター',
      displayName: '新しいキャラクター',
      profile: '',
      images: [],
      type: 'npc',
      specialInteractions: [],
    };
    update((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      characters: [...prev.characters, newChar],
    }));
    setSelectedIndex(characters.length);
    addToast('キャラクターを追加しました', 'success');
  };

  // キャラクター削除（2回クリックで確認）
  const handleDelete = (index: number) => {
    if (confirmDeleteIndex !== index) {
      setConfirmDeleteIndex(index);
      setTimeout(() => setConfirmDeleteIndex(null), 3000);
      return;
    }
    update((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      characters: prev.characters.filter((_, i) => i !== index),
    }));
    setConfirmDeleteIndex(null);
    if (selectedIndex >= characters.length - 1) {
      setSelectedIndex(Math.max(0, characters.length - 2));
    }
    addToast('キャラクターを削除しました', 'info');
  };

  // キャラクター更新（名前伝播ロジック含む）
  const handleUpdateCharacter = (updater: (char: CharacterProfile) => CharacterProfile) => {
    update((prev) => {
      const oldChar = prev.characters[selectedIndex];
      const newChar = updater(oldChar);

      // displayNameが変更された場合、他ストアにも伝播
      if (oldChar && newChar.displayName !== oldChar.displayName) {
        const oldName = oldChar.displayName;
        const newName = newChar.displayName;

        // DialogueStoreのnpcNameを更新
        if (dialogueStore.data) {
          dialogueStore.update((dlg) => ({
            ...dlg,
            lastModified: new Date().toISOString(),
            npcs: dlg.npcs.map((npc) =>
              npc.npcId === oldChar.id ? { ...npc, npcName: newName } : npc
            ),
          }));
        }

        // EventListStoreのspeakerNameを更新
        if (eventListStore.data) {
          eventListStore.update((el) => ({
            ...el,
            lastModified: new Date().toISOString(),
            events: el.events.map((evt) => ({
              ...evt,
              actions: evt.actions.map((action) =>
                action.speakerName === oldName
                  ? { ...action, speakerName: newName }
                  : action
              ),
            })),
          }));
        }
      }

      return {
        ...prev,
        lastModified: new Date().toISOString(),
        characters: prev.characters.map((c, i) => (i === selectedIndex ? newChar : c)),
      };
    });
  };

  return (
    <motion.div className="flex gap-6 h-[calc(100vh-8rem)]" {...fadeIn}>
      <CharacterList
        characters={characters}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onAdd={handleAdd}
        onDelete={handleDelete}
        confirmDeleteIndex={confirmDeleteIndex}
      />
      <CharacterDetail
        character={selectedCharacter}
        selectedIndex={selectedIndex}
        onUpdateCharacter={handleUpdateCharacter}
        flowNodes={flowNodes}
        eventListItems={eventListItems}
      />
    </motion.div>
  );
}
