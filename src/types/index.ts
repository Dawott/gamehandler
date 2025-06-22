export interface User {
  id: string
  email: string
  name: string
  location: string
  favoriteGame: string
  avatar?: string
  socials: {
    discord?: string
    twitter?: string
    steam?: string
  }
  teams: string[]
}

export interface Team {
  id: string
  name: string
  location: string
  game: string
  maxMembers: number
  currentMembers: number
  ownerId: string
  members: Record<string, 'owner' | 'member'>
  meetingTimes: string[]
  description?: string
}