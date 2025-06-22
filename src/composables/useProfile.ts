import { ref, computed } from 'vue'
import { 
  ref as dbRef, 
  set, 
  get, 
  child, 
  push,
  update 
} from 'firebase/database'
import { database } from '@/firebase/config'
import { useAuth } from './useAuth'
import type { UserProfile } from '@/types'

export function useProfile() {
  const { user } = useAuth()
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Sprawdz czy user zakonczyl setup profilu
  const hasProfile = computed(() => {
    return profile.value && profile.value.name && profile.value.location && profile.value.favoriteGame
  })

  // Ładuj profil z bazy
  const loadProfile = async (userId?: string) => {
    const uid = userId || user.value?.uid
    if (!uid) return null

    try {
      loading.value = true
      error.value = null
      
      const userRef = dbRef(database, `users/${uid}`)
      const snapshot = await get(userRef)
      
      if (snapshot.exists()) {
        profile.value = snapshot.val() as UserProfile
        return profile.value
      } else {
        profile.value = null
        return null
      }
    } catch (err: any) {
      error.value = 'Nie udało się załadować profilu'
      console.error('Błąd ładowania profilu:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Stwórz nowy profil użytkownika
  const createProfile = async (profileData: Partial<UserProfile>) => {
    if (!user.value?.uid) throw new Error('Użytkownik nie uwierzytelniony')

    try {
      loading.value = true
      error.value = null

      const newProfile: UserProfile = {
        id: user.value.uid,
        email: user.value.email || '',
        name: profileData.name || '',
        location: profileData.location || '',
        favoriteGame: profileData.favoriteGame || '',
        avatar: profileData.avatar || '',
        socials: profileData.socials || {},
        teams: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const userRef = dbRef(database, `users/${user.value.uid}`)
      await set(userRef, newProfile)
      
      profile.value = newProfile
      return newProfile
    } catch (err: any) {
      error.value = 'Nie udało się utworzyć profilu'
      console.error('Błąd tworzenia profilu:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update existing profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user.value?.uid || !profile.value) throw new Error('Brak profilu do aktualizacji')

    try {
      loading.value = true
      error.value = null

      const updatedProfile = {
        ...profile.value,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      const userRef = dbRef(database, `users/${user.value.uid}`)
      await set(userRef, updatedProfile)
      
      profile.value = updatedProfile
      return updatedProfile
    } catch (err: any) {
      error.value = 'Nie udało się zaktualizować profilu'
      console.error('Błąd aktualizacji profilu:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Save profile (create or update)
  const saveProfile = async (profileData: Partial<UserProfile>) => {
    if (profile.value) {
      return await updateProfile(profileData)
    } else {
      return await createProfile(profileData)
    }
  }

  // Check if profile exists for user
  const checkProfileExists = async (userId?: string) => {
    const uid = userId || user.value?.uid
    if (!uid) return false

    try {
      const userRef = dbRef(database, `users/${uid}`)
      const snapshot = await get(userRef)
      return snapshot.exists()
    } catch (err) {
      console.error('Check profile error:', err)
      return false
    }
  }

  return {
    profile,
    loading,
    error,
    hasProfile,
    loadProfile,
    createProfile,
    updateProfile,
    saveProfile,
    checkProfileExists
  }
}