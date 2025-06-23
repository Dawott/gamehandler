export interface UserProfile {
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
  teams: Record<string, boolean>
  createdAt: string
  updatedAt: string
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
  createdAt: string
  updatedAt: string
}

export interface JoinRequest {
  id: string
  teamId: string
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export type TeamRole = 'owner' | 'member'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'