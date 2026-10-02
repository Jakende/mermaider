import { Blobatar } from '@blobatar/react'
import { localProfile } from '../utils/userProfile'
export default function UserBlob({size=32}:{size?:number}) {
  const profile=localProfile()
  return <span className="user-blob" title="Your local profile" data-profile-id={profile.id}><Blobatar name={profile.avatar} size={size} title="Your personal blob avatar" /></span>
}
