export const AVATAR_PATHS = {
  DEFAULT: '/src/assets/avatars/default.png',
  /*AVATAR_1: '/src/assets/avatars/avatar-1.png',
  AVATAR_2: '/src/assets/avatars/avatar-2.png',
  AVATAR_3: '/src/assets/avatars/avatar-3.png',
  AVATAR_4: '/src/assets/avatars/avatar-4.png',
  AVATAR_5: '/src/assets/avatars/avatar-5.png',
  AVATAR_6: '/src/assets/avatars/avatar-6.png',
  AVATAR_7: '/src/assets/avatars/avatar-7.png',
  AVATAR_8: '/src/assets/avatars/avatar-8.png',*/
} as const

export const AVAILABLE_AVATARS = [
  { id: 'default', name: 'Domyślny', path: AVATAR_PATHS.DEFAULT },
 /* { id: 'avatar1', name: 'Gracz', path: AVATAR_PATHS.AVATAR_1 },
  { id: 'avatar2', name: 'Wojownik', path: AVATAR_PATHS.AVATAR_2 },
  { id: 'avatar3', name: 'Mag', path: AVATAR_PATHS.AVATAR_3 },
  { id: 'avatar4', name: 'Zwiadowca', path: AVATAR_PATHS.AVATAR_4 },
  { id: 'avatar5', name: 'Kleryk', path: AVATAR_PATHS.AVATAR_5 },
  { id: 'avatar6', name: 'Łotrzyk', path: AVATAR_PATHS.AVATAR_6 },
  { id: 'avatar7', name: 'Berserker', path: AVATAR_PATHS.AVATAR_7 },
  { id: 'avatar8', name: 'Cyborg', path: AVATAR_PATHS.AVATAR_8 },*/
] as const

/**
 * Get the default avatar path
 */
export const getDefaultAvatar = (): string => {
  return AVATAR_PATHS.DEFAULT
}

/**
 * Check if avatar is a base64 uploaded image
 */
export const isUploadedAvatar = (avatarPath: string): boolean => {
  return avatarPath.startsWith('data:image/')
}

/**
 * Validate if an avatar path exists in our available avatars or is uploaded
 */
export const isValidAvatarPath = (path: string): boolean => {
  return isUploadedAvatar(path) || AVAILABLE_AVATARS.some(avatar => avatar.path === path)
}

/**
 * Get avatar path or fallback to default
 */
export const getAvatarPath = (avatarPath?: string): string => {
  if (!avatarPath || !isValidAvatarPath(avatarPath)) {
    return getDefaultAvatar()
  }
  return avatarPath
}

/**
 * Get avatar name by path
 */
export const getAvatarName = (path: string): string => {
  if (isUploadedAvatar(path)) {
    return 'Przesłany awatar'
  }
  const avatar = AVAILABLE_AVATARS.find(avatar => avatar.path === path)
  return avatar?.name || 'Nieznany'
}

/**
 * Get avatar display source (for img src attribute)
 */
export const getAvatarDisplaySrc = (avatarPath?: string): string => {
  if (!avatarPath) return getDefaultAvatar()
  if (isUploadedAvatar(avatarPath)) return avatarPath
  if (isValidAvatarPath(avatarPath)) return avatarPath
  return getDefaultAvatar()
}

/**
 * Get random avatar path (useful for testing or default assignment)
 */
export const getRandomAvatar = (): string => {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_AVATARS.length)
  return AVAILABLE_AVATARS[randomIndex].path
}