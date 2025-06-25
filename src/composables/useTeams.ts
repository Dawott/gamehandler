import { ref, computed } from 'vue'
import { 
  ref as dbRef, 
  set, 
  get, 
  push,
  update,
  onValue,
  off,
  query,
  orderByChild,
  equalTo
} from 'firebase/database'
import { database } from '@/firebase/config'
import { useAuth } from './useAuth'
import type { Team, JoinRequest } from '@/types'
import { useTeamChat } from './useTeamChat'

export function useTeams() {
  const { user } = useAuth()
  const teams = ref<Team[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Filters
  const filters = ref({
    game: '',
    location: '',
    showOnlyAvailable: false
  })

  // Filtered teams
  const filteredTeams = computed(() => {
    let result = teams.value

    if (filters.value.game) {
      result = result.filter(team => team.game === filters.value.game)
    }

    if (filters.value.location) {
      result = result.filter(team => team.location === filters.value.location)
    }

    if (filters.value.showOnlyAvailable) {
      result = result.filter(team => team.currentMembers < team.maxMembers)
    }

    return result
  })

  // Load all teams
  const loadTeams = async () => {
    try {
      loading.value = true
      error.value = null
      
      const teamsRef = dbRef(database, 'teams')
      const snapshot = await get(teamsRef)
      
      if (snapshot.exists()) {
        const teamsData = snapshot.val()
        teams.value = Object.entries(teamsData).map(([id, data]: [string, any]) => ({
          ...data,
          id
        }))
      } else {
        teams.value = []
      }
    } catch (err: any) {
      error.value = 'Nie udało się załadować drużyn'
      console.error('Błąd ładowania drużyn:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Subscribe to teams updates
  const subscribeToTeams = () => {
    const teamsRef = dbRef(database, 'teams')
    
    const unsubscribe = onValue(teamsRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamsData = snapshot.val()
        teams.value = Object.entries(teamsData).map(([id, data]: [string, any]) => ({
          ...data,
          id
        }))
      } else {
        teams.value = []
      }
    })

    return () => {
      off(teamsRef)
    }
  }

  // Create new team
  const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'currentMembers' | 'members' | 'ownerId'>) => {
    if (!user.value?.uid) throw new Error('Użytkownik nie uwierzytelniony')

    try {
      loading.value = true
      error.value = null

      const teamsRef = dbRef(database, 'teams')
      const newTeamRef = push(teamsRef)
      
      const newTeam: Team = {
        ...teamData,
        id: newTeamRef.key!,
        ownerId: user.value.uid,
        members: {
          [user.value.uid]: 'owner'
        },
        currentMembers: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await set(newTeamRef, newTeam)
      
      // Add team to user's teams
      const userTeamsRef = dbRef(database, `users/${user.value.uid}/teams`)
      await update(userTeamsRef, {
        [newTeam.id]: true
      })

      const teamChat = useTeamChat(newTeam.id)
    await teamChat.sendSystemMessage(`Drużyna "${newTeam.name}" została utworzona! Witajcie w czacie!`)
      
      return newTeam
    } catch (err: any) {
      error.value = 'Nie udało się utworzyć drużyny'
      console.error('Błąd tworzenia drużyny:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get single team
  const getTeam = async (teamId: string) => {
    try {
      loading.value = true
      error.value = null
      
      const teamRef = dbRef(database, `teams/${teamId}`)
      const snapshot = await get(teamRef)
      
      if (snapshot.exists()) {
        return { ...snapshot.val(), id: teamId } as Team
      } else {
        throw new Error('Drużyna nie znaleziona')
      }
    } catch (err: any) {
      error.value = 'Nie udało się załadować drużyny'
      console.error('Błąd ładowania drużyny:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Request to join team
  const requestJoinTeam = async (teamId: string) => {
    if (!user.value?.uid) throw new Error('Użytkownik nie uwierzytelniony')

    try {
      loading.value = true
      error.value = null

      // Check if already a member
      const team = await getTeam(teamId)
      if (team.members[user.value.uid]) {
        throw new Error('Już jesteś członkiem tej drużyny')
      }

      // Check if team is full
      if (team.currentMembers >= team.maxMembers) {
        throw new Error('Drużyna jest pełna')
      }

      // Create join request
      const requestsRef = dbRef(database, 'joinRequests')
      const newRequestRef = push(requestsRef)
      
      const joinRequest: JoinRequest = {
        id: newRequestRef.key!,
        teamId,
        userId: user.value.uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await set(newRequestRef, joinRequest)
      
      return joinRequest
    } catch (err: any) {
      error.value = err.message || 'Nie udało się wysłać prośby o dołączenie'
      console.error('Błąd wysyłania prośby:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Check if user has pending request for team
  const checkPendingRequest = async (teamId: string) => {
    if (!user.value?.uid) return false

    try {
      const requestsRef = dbRef(database, 'joinRequests')
      const snapshot = await get(requestsRef)
      
      if (snapshot.exists()) {
        const requests = snapshot.val()
        return Object.values(requests).some((req: any) => 
          req.teamId === teamId && 
          req.userId === user.value!.uid && 
          req.status === 'pending'
        )
      }
      return false
    } catch (err) {
      console.error('Error checking pending request:', err)
      return false
    }
  }

  // Get user's teams
  const getUserTeams = async (userId?: string) => {
    const uid = userId || user.value?.uid
    if (!uid) return []

    try {
      loading.value = true 
      error.value = null
      
      console.log('Loading teams for user:', uid) // Debug log
      
      const userRef = dbRef(database, `users/${uid}`)
      const snapshot = await get(userRef)
      
      if (snapshot.exists() && snapshot.val().teams) {
        const userTeams = snapshot.val().teams
        console.log('User teams from database:', userTeams) // Debug log
        
        const teamIds = Object.keys(userTeams)
        console.log('Team IDs to load:', teamIds) // Debug log
        
        const loadedTeams: Team[] = []
        
        for (const teamId of teamIds) {
          try {
            const team = await getTeam(teamId)
            loadedTeams.push(team)
            console.log('Loaded team:', team.name) // Debug log
          } catch (err) {
            console.error(`Error loading team ${teamId}:`, err)
          }
        }
        
        console.log('Final loaded teams:', loadedTeams) // Debug log
        return loadedTeams
      } else {
        console.log('No teams found for user or user not found') // Debug log
        return []
      }
    } catch (err) {
      console.error('Error loading user teams:', err)
      error.value = 'Nie udało się załadować drużyn'
      return []
    } finally {
      loading.value = false
    }
  }

  const deleteTeam = async (teamId: string) => {
  if (!user.value?.uid) throw new Error('Użytkownik nie uwierzytelniony')

  try {
    loading.value = true
    error.value = null

    console.log('=== DELETING TEAM ===')
    console.log('Team ID:', teamId)
    console.log('User ID:', user.value.uid)

    // Get team data first to verify ownership and get member list
    const teamRef = dbRef(database, `teams/${teamId}`)
    const teamSnapshot = await get(teamRef)
    
    if (!teamSnapshot.exists()) {
      throw new Error('Drużyna nie znaleziona')
    }
    
    const team = teamSnapshot.val() as Team

    // Verify user is team owner
    if (team.ownerId !== user.value.uid) {
      throw new Error('Tylko właściciel może usunąć drużynę')
    }

    // Prepare atomic updates for deletion
    const updates: Record<string, any> = {}
    
    // Remove team
    updates[`teams/${teamId}`] = null
    
    // Remove team from all members' profiles
    const memberIds = Object.keys(team.members || {})
    for (const memberId of memberIds) {
      updates[`users/${memberId}/teams/${teamId}`] = null
      updates[`users/${memberId}/updatedAt`] = new Date().toISOString()
    }
    
    // Remove all join requests for this team
    const requestsRef = dbRef(database, 'joinRequests')
    const requestsSnapshot = await get(requestsRef)
    
    if (requestsSnapshot.exists()) {
      const allRequests = requestsSnapshot.val()
      for (const [requestId, request] of Object.entries(allRequests) as [string, any][]) {
        if (request.teamId === teamId) {
          updates[`joinRequests/${requestId}`] = null
        }
      }
    }

    console.log('Atomic delete updates:', updates)
    
    // Execute all updates atomically
    await update(dbRef(database), updates)
    
    console.log('Team deleted successfully')
    return true
    
  } catch (err: any) {
    error.value = err.message || 'Nie udało się usunąć drużyny'
    console.error('Błąd usuwania drużyny:', err)
    throw err
  } finally {
    loading.value = false
  }
}


  // Update filters
  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // Clear filters
  const clearFilters = () => {
    filters.value = {
      game: '',
      location: '',
      showOnlyAvailable: false
    }
  }

  return {
    teams,
    filteredTeams,
    loading,
    error,
    filters,
    loadTeams,
    subscribeToTeams,
    createTeam,
    getTeam,
    requestJoinTeam,
    checkPendingRequest,
    getUserTeams,
    updateFilters,
    clearFilters,
    deleteTeam
  }
}