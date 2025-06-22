import { ref, onMounted } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth } from '@/firebase/config'

export function useAuth() {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const isNewUser = ref(false)


  const getErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Brak konta powiązanego z mailem'
    case 'auth/wrong-password':
      return 'Błędne hasło'
    case 'auth/email-already-in-use':
      return 'Email już istnieje'
    case 'auth/weak-password':
      return 'Hasło musi mieć minimum 6 znaków i znaki specjalne'
      case 'auth/too-many-requests':
        return 'Za dużo nieudanych prób. Spróbuj ponownie'
    default:
      return 'Błąd uwierzytelnienia'
  }
}

  // Logowanie
  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      error.value = getErrorMessage(err.code)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Rejestracja
  
   const register = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      const result = await createUserWithEmailAndPassword(auth, email, password)
      isNewUser.value = true
      return result
    } catch (err: any) {
      error.value = getErrorMessage(err.code)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Logout
  const logout = async () => {
    try {
      error.value = null
      await signOut(auth)
    } catch (err: any) {
      error.value = getErrorMessage(err.code)
      throw err
    }
  }

  const requireAuth = () => {
    return !!user.value
  }

  const isAuthenticated = () => {
    return !!user.value
  }

  // Nasłuchuj zmian w auth
  onMounted(() => {
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
    })
  })

  return {
    user,
    loading,
    error,
    isNewUser,
    login,
    register,
    logout,
    requireAuth,
    isAuthenticated
  }
}

