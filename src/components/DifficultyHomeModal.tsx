import { Modal } from '@/components/ui/Modal'
import { DifficultyPicker } from '@/components/DifficultyPicker'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

interface DifficultyHomeModalProps {
  open: boolean
  onClose: () => void
}

export function DifficultyHomeModal({ open, onClose }: DifficultyHomeModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const difficulty = useStore((s) => s.profile.difficulty ?? 'medium')
  const setDifficulty = useStore((s) => s.setDifficulty)

  return (
    <Modal open={open} onClose={onClose} title={t('settings.difficulty')} position="center">
      <p className="text-sm text-white/45 mb-4 -mt-1">{t('home.changeDifficultyDesc')}</p>
      <DifficultyPicker
        value={difficulty}
        onChange={(d) => {
          setDifficulty(d)
          toast(t('settings.difficultyUpdated'), 'info')
          onClose()
        }}
        compact
      />
    </Modal>
  )
}
