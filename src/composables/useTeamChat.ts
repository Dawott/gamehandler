import { ref, computed } from 'vue'
import { 
  ref as dbRef, 
  push, 
  set,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  update
} from 'firebase/database'
import { database } from '@/firebase/config'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar: string
  message: string
  timestamp: string
  type: 'text' | 'system'
}

export function useTeamChat(teamId: string, currentUser: any = null, currentProfile: any = null) {
  console.log('🚀 useTeamChat initialized for team:', teamId)
  console.log('🚀 Received user:', currentUser?.uid)
  console.log('🚀 Received profile:', currentProfile?.name)
  
  // Use passed parameters or fallback to composables
  const { user: authUser } = useAuth()
  const { profile: authProfile, loadProfile } = useProfile()
  
  const user = currentUser || authUser
  const profile = currentProfile || authProfile
  
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)
  
  let unsubscribe: (() => void) | null = null

  // Real-time messages listener
  const subscribeToMessages = () => {
    if (!teamId) {
      console.error('❌ No teamId provided to subscribeToMessages')
      return
    }

    console.log('📡 Subscribing to messages for team:', teamId)
    loading.value = true
    
    const messagesRef = query(
      dbRef(database, `chats/${teamId}/messages`),
      orderByChild('timestamp'),
      limitToLast(100)
    )

    console.log('📡 Messages ref created:', messagesRef)

    unsubscribe = onValue(messagesRef, (snapshot) => {
      console.log('📨 Messages snapshot received:', snapshot.exists())
      
      const messagesData = snapshot.val()
      if (messagesData) {
        console.log('📨 Raw messages data:', messagesData)
        messages.value = Object.entries(messagesData)
          .map(([id, data]: [string, any]) => ({
            ...data,
            id
          }))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        console.log('📨 Processed messages:', messages.value)
      } else {
        console.log('📨 No messages found')
        messages.value = []
      }
      loading.value = false
    }, (err) => {
      console.error('❌ Chat subscription error:', err)
      error.value = 'Nie udało się załadować wiadomości'
      loading.value = false
    })
  }

  // Send a message
  const sendMessage = async (messageText: string) => {
    console.log('📤 Attempting to send message:', messageText)
    console.log('📤 Current user (passed):', currentUser?.uid)
    console.log('📤 Current profile (passed):', currentProfile?.name)
    console.log('📤 Auth user (composable):', authUser.value?.uid)
    console.log('📤 Auth profile (composable):', authProfile.value?.name)
    console.log('📤 Final user:', user.value?.uid)
    console.log('📤 Final profile:', profile.value?.name)

    // Use the most reliable source
    const finalUser = currentUser || user.value || authUser.value
    const finalProfile = currentProfile || profile.value || authProfile.value

    console.log('📤 Final resolved user:', finalUser?.uid)
    console.log('📤 Final resolved profile:', finalProfile?.name)

    if (!finalUser) {
      console.error('❌ No user authenticated')
      return
    }

    if (!messageText.trim()) {
      console.error('❌ Empty message text')
      return
    }

    // Ensure we have profile data
    let userProfile = finalProfile
    if (!userProfile || !userProfile.name) {
      console.log('📤 Loading profile...')
      await loadProfile()
      userProfile = authProfile.value
    }

    if (!userProfile?.name) {
      console.error('❌ No profile name available')
      return
    }

    try {
      sending.value = true
      error.value = null

      console.log('📤 Creating message reference...')
      const messagesRef = dbRef(database, `chats/${teamId}/messages`)
      const newMessageRef = push(messagesRef)
      
      console.log('📤 Message ref created:', newMessageRef.key)

      const message: ChatMessage = {
        id: newMessageRef.key!,
        userId: finalUser.uid,
        userName: userProfile.name,
        userAvatar: userProfile.avatar || '',
        message: messageText.trim(),
        timestamp: new Date().toISOString(),
        type: 'text'
      }

      console.log('📤 Message object created:', message)
      console.log('📤 Attempting to write to Firebase...')

      await set(newMessageRef, message)
      console.log('✅ Message written to Firebase successfully')

      // Update chat metadata
      console.log('📤 Updating chat metadata...')
      await update(dbRef(database, `chats/${teamId}`), {
        lastActivity: new Date().toISOString()
      })
      console.log('✅ Chat metadata updated')

    } catch (err: any) {
      console.error('❌ Send message error:', err)
      console.error('❌ Error code:', err.code)
      console.error('❌ Error message:', err.message)
      error.value = 'Nie udało się wysłać wiadomości: ' + err.message
      throw err
    } finally {
      sending.value = false
    }
  }

  // Send system message
  const sendSystemMessage = async (messageText: string) => {
    console.log('📤 Sending system message:', messageText)
    if (!teamId) return

    try {
      const messagesRef = dbRef(database, `chats/${teamId}/messages`)
      const newMessageRef = push(messagesRef)
      
      const message: ChatMessage = {
        id: newMessageRef.key!,
        userId: 'system',
        userName: 'System',
        userAvatar: '',
        message: messageText,
        timestamp: new Date().toISOString(),
        type: 'system'
      }

      await set(newMessageRef, message)
      console.log('✅ System message sent successfully')
    } catch (err) {
      console.error('❌ System message error:', err)
    }
  }

  // Cleanup
  const cleanup = () => {
    console.log('🧹 Cleaning up chat subscription')
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // Computed
  const messageCount = computed(() => messages.value.length)
  const hasMessages = computed(() => messageCount.value > 0)
  const lastMessage = computed(() => 
    messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  )

  return {
    messages,
    loading,
    sending,
    error,
    messageCount,
    hasMessages,
    lastMessage,
    subscribeToMessages,
    sendMessage,
    sendSystemMessage,
    cleanup
  }
}