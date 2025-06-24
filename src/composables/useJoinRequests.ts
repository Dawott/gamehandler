import { ref } from 'vue'
import { 
  ref as dbRef, 
  get, 
  update,
  query,
  orderByChild,
  equalTo,
  onValue,
  off
} from 'firebase/database'
import { database } from '@/firebase/config'
import { useAuth } from './useAuth'
import type { JoinRequest, Team } from '@/types'
import { getDefaultAvatar } from '@/utils/avatars'

export function useJoinRequests() {
  const { user } = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Get pending requests for a specific team
  const getPendingRequests = async (teamId: string) => {
    try {
      loading.value = true
      error.value = null
      
      const requestsRef = dbRef(database, 'joinRequests')
      const snapshot = await get(requestsRef)
      
      if (snapshot.exists()) {
        const allRequests = snapshot.val()
        const pendingRequests: (JoinRequest & { userName?: string; userLocation?: string; userGame?: string })[] = []
        
        // Filter requests for this team with pending status
        for (const [requestId, request] of Object.entries(allRequests) as [string, any][]) {
          if (request.teamId === teamId && request.status === 'pending') {
            // Load user profile for each request
            try {
              const userRef = dbRef(database, `users/${request.userId}`)
              const userSnapshot = await get(userRef)
              const userData = userSnapshot.exists() ? userSnapshot.val() : null
              
              pendingRequests.push({
                ...request,
                id: requestId,
                userName: userData?.name || 'Nieznany',
                userLocation: userData?.location || '',
                userGame: userData?.favoriteGame || '',
                userAvatar: userData?.avatar || getDefaultAvatar()
              })
            } catch (err) {
              console.error('Błąd ładowania danych:', err)
              pendingRequests.push({
                ...request,
                id: requestId,
                userName: 'Nieznany',
                userAvatar: getDefaultAvatar()
              })
            }
          }
        }
        
        return pendingRequests
      }
      return []
    } catch (err: any) {
      error.value = 'Nie udało się pobrać requestów'
      console.error('Błąd ładowania requestów:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Approve a join request
  const approveRequest = async (requestId: string, teamId: string, userId: string) => {
    if (!user.value?.uid) throw new Error('Użytkownik nie jest uwierzytelniony')

    try {
      loading.value = true
      error.value = null

      console.log('=== APPROVING REQUEST ===')
      console.log('Request ID:', requestId)
      console.log('Team ID:', teamId) 
      console.log('User ID:', userId)

      // Get current team data
      const teamRef = dbRef(database, `teams/${teamId}`)
      const teamSnapshot = await get(teamRef)
      
      if (!teamSnapshot.exists()) {
        throw new Error('Drużyny nie znaleziono')
      }
      
      const team = teamSnapshot.val() as Team

      // Verify user is team owner
      if (team.ownerId !== user.value.uid) {
        throw new Error('Jedynie właściciel zespołu może akceptować requesty')
      }

      // Check if team has space
      if (team.currentMembers >= team.maxMembers) {
        throw new Error('Zespół jest pełen')
      }
/*
      // Update join request status
      await update(dbRef(database, `joinRequests/${requestId}`), {
        status: 'approved',
        updatedAt: new Date().toISOString()
      })

      // Add user to team members
      await update(dbRef(database, `teams/${teamId}`), {
        [`members/${userId}`]: 'member',
        currentMembers: team.currentMembers + 1,
        updatedAt: new Date().toISOString()
      })*/
      
      const userRef = dbRef(database, `users/${userId}`)
      const userSnapshot = await get(userRef)
      
      if (!userSnapshot.exists()) {
        throw new Error('Profil użytkownika nie został znaleziony')
      }

      const currentProfile = userSnapshot.val()
      const currentTeams = currentProfile.teams || {}

      // ATOMIC UPDATE: Update all paths in one operation
      const updates: Record<string, any> = {}
      
      // Update join request
      updates[`joinRequests/${requestId}/status`] = 'approved'
      updates[`joinRequests/${requestId}/updatedAt`] = new Date().toISOString()
      
      // Update team
      updates[`teams/${teamId}/members/${userId}`] = 'member'
      updates[`teams/${teamId}/currentMembers`] = team.currentMembers + 1
      updates[`teams/${teamId}/updatedAt`] = new Date().toISOString()
      
      updates[`users/${userId}/teams`] = {
        ...currentTeams,
        [teamId]: true
      }
      updates[`users/${userId}/updatedAt`] = new Date().toISOString()

      console.log('Atomic updates:', updates)
      
      await update(dbRef(database), updates)
      
      console.log('Request approved successfully')
      return true
      
    } catch (err: any) {
      error.value = err.message || 'Nie udało się zaakceptować prośby'
      console.error('Błąd przy akceptowaniu prośby:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reject a join request
   const rejectRequest = async (requestId: string, teamId: string) => {
    if (!user.value?.uid) throw new Error('Użytkownik nie jest uwierzytelniony')

    try {
      loading.value = true
      error.value = null

      console.log('=== REJECTING REQUEST ===')
      console.log('Request ID:', requestId)
      console.log('Team ID:', teamId)

      // Verify user is team owner
      const teamRef = dbRef(database, `teams/${teamId}`)
      const teamSnapshot = await get(teamRef)
      
      if (!teamSnapshot.exists()) {
        throw new Error('Zespołu nie znaleziono')
      }
      
      const team = teamSnapshot.val() as Team
      
      if (team.ownerId !== user.value.uid) {
        throw new Error('Jedynie właściciel zespołu może odrzucać prośby')
      }

      // ONLY update the request status - don't touch team or user data
      await update(dbRef(database, `joinRequests/${requestId}`), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      })
      
      console.log('Request rejected successfully')
      return true
      
    } catch (err: any) {
      error.value = err.message || 'Nie udało się odrzucić prośby'
      console.error('Błąd odrzucania prośby:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get count of pending requests for teams owned by current user
  const getPendingRequestsCount = async (teamId: string) => {
    try {
      const requestsRef = dbRef(database, 'joinRequests')
      const snapshot = await get(requestsRef)
      
      if (snapshot.exists()) {
        const allRequests = snapshot.val()
        let count = 0
        
        for (const request of Object.values(allRequests) as any[]) {
          if (request.teamId === teamId && request.status === 'pending') {
            count++
          }
        }
        
        return count
      }
      return 0
    } catch (err) {
      console.error('Błąd pobierania ilości próśb:', err)
      return 0
    }
  }

  return {
    loading,
    error,
    getPendingRequests,
    approveRequest,
    rejectRequest,
    getPendingRequestsCount
  }
}