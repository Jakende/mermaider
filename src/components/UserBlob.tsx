import { Blobatar } from '@blobatar/react'
import { thinking } from 'blobatar/expression'
import 'blobatar/motion.css'
import { useBlobMotion } from '../hooks/useBlobMotion'
import { localProfile } from '../utils/userProfile'
import './UserBlob.css'

export default function UserBlob({ size = 32, ambient = false, busy = false }: { size?: number; ambient?: boolean; busy?: boolean }) {
  const profile = localProfile()
  const motion = useBlobMotion()
  const mode = ambient || busy ? 'always' : 'hover'
  return <span className="user-blob" title="Your local profile" data-profile-id={profile.id} data-motion={motion ? mode : 'off'} data-busy={busy}>
    {motion
      ? <Blobatar name={profile.avatar} size={size} animate={mode} expression={busy ? thinking : undefined} className={busy ? undefined : 'mo-slow'} title="Your personal blob avatar" />
      : <Blobatar name={profile.avatar} size={size} title="Your personal blob avatar" />}
  </span>
}
