import { AnimatePresence, motion } from 'framer-motion';
import ProfileSection from './ProfileSection';
import ImageGallerySection from './ImageGallerySection';
import SpecialInteractionSection from './SpecialInteractionSection';
import type { CharacterProfile } from '../../types';

interface Props {
  character: CharacterProfile | null;
  selectedIndex: number;
  onUpdateCharacter: (updater: (char: CharacterProfile) => CharacterProfile) => void;
  flowNodes: { id: string; label: string }[];
  eventListItems: { id: string; name: string }[];
}

export default function CharacterDetail({ character, selectedIndex, onUpdateCharacter, flowNodes, eventListItems }: Props) {
  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-5">
      <AnimatePresence mode="wait">
        {character ? (
          <motion.div
            key={character.id + selectedIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <ProfileSection character={character} onUpdate={onUpdateCharacter} />
            <ImageGallerySection character={character} onUpdate={onUpdateCharacter} />
            <SpecialInteractionSection
              character={character}
              onUpdate={onUpdateCharacter}
              flowNodes={flowNodes}
              eventListItems={eventListItems}
            />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
            <p className="text-gray-400 font-sans-jp">左のキャラクター一覧から選択してください。</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
