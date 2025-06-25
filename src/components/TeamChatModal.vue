<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')" class="team-chat-modal">
    <ion-header class="modal-header">
      <ion-toolbar class="modal-toolbar">
        <ion-title class="modal-title">
          <div class="title-content">
            <ion-icon :icon="chatbubblesOutline" class="title-icon"></ion-icon>
            <span>{{ team?.name }} - Chat</span>
            <ion-badge v-if="messageCount > 0" color="primary" class="message-count">
              {{ messageCount }}
            </ion-badge>
          </div>
        </ion-title>
        <ion-button fill="clear" slot="end" @click="$emit('close')" class="close-button">
          <ion-icon :icon="closeOutline" class="close-icon"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="chatContent" class="chat-content" :scroll-events="true">
      <!-- Loading State -->
      <div v-if="loading && !hasMessages" class="loading-container animate-fade-in">
        <div class="loading-content">
          <ion-spinner class="loading-spinner"></ion-spinner>
          <p class="loading-text">Ładuję wiadomości...</p>
        </div>
      </div>

      <!-- Messages List -->
      <div v-else-if="hasMessages" class="messages-container">
        <div 
          v-for="(message, index) in messages" 
          :key="message.id"
          class="message-wrapper animate-slide-in"
          :style="{ animationDelay: (index * 0.05) + 's' }"
        >
          <!-- System Message -->
          <div v-if="message.type === 'system'" class="system-message">
            <div class="system-content">
              <ion-icon :icon="informationCircleOutline" class="system-icon"></ion-icon>
              <span class="system-text">{{ message.message }}</span>
            </div>
            <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
          </div>

          <!-- Regular Message -->
          <div 
            v-else 
            class="message-item"
            :class="{ 
              'own-message': isOwnMessage(message),
              'other-message': !isOwnMessage(message)
            }"
          >
            <!-- Avatar (for other users) -->
            <div v-if="!isOwnMessage(message)" class="message-avatar">
              <ion-avatar class="user-avatar">
                <img 
                  v-if="message.userAvatar" 
                  :src="getAvatarDisplaySrc(message.userAvatar)" 
                  alt="Avatar użytkownika"
                  @error="handleAvatarError"
                />
                <div v-else class="avatar-placeholder">
                  <ion-icon :icon="personOutline" class="placeholder-icon"></ion-icon>
                </div>
              </ion-avatar>
            </div>

            <!-- Message Content -->
            <div class="message-content">
              <!-- Username (for other users) -->
              <div v-if="!isOwnMessage(message)" class="message-username">
                {{ message.userName }}
              </div>

              <!-- Message Bubble -->
              <div class="message-bubble">
                <div class="message-text">{{ message.message }}</div>
                <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing Indicator Placeholder -->
        <div v-if="false" class="typing-indicator animate-pulse">
          <div class="typing-content">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="typing-text">Ktoś pisze...</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-chat animate-fade-in">
        <div class="empty-illustration">
          <ion-icon :icon="chatbubblesOutline" class="empty-icon"></ion-icon>
        </div>
        <div class="empty-content">
          <h3 class="empty-title">Rozpocznij rozmowę</h3>
          <p class="empty-message">Bądź pierwszy i napisz wiadomość do drużyny!</p>
        </div>
      </div>
    </ion-content>

    <!-- Message Input -->
    <ion-footer class="message-footer">
      <ion-toolbar class="input-toolbar">
        <div class="message-input-container">
          <div class="input-wrapper">
            <ion-textarea
              ref="messageInput"
              v-model="newMessage"
              placeholder="Napisz wiadomość..."
              :rows="1"
              :auto-grow="true"
              :maxlength="500"
              @keydown="handleKeydown"
              @ionInput="handleInput"
              class="message-textarea"
              :disabled="sending"
            ></ion-textarea>
            
            <!-- Character Counter -->
            <div class="char-counter" :class="{ 'warning': newMessage.length > 400 }">
              {{ newMessage.length }}/500
            </div>
          </div>

          <ion-button
            @click="handleSendMessage"
            :disabled="!canSendMessage"
            class="send-button"
            fill="solid"
            shape="round"
          >
            <template v-if="sending">
              <ion-spinner class="send-spinner"></ion-spinner>
            </template>
            <template v-else>
              <ion-icon :icon="sendOutline" class="send-icon"></ion-icon>
            </template>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonSpinner,
  IonAvatar,
  IonTextarea,
  IonBadge
} from '@ionic/vue'
import {
  closeOutline,
  chatbubblesOutline,
  sendOutline,
  personOutline,
  informationCircleOutline
} from 'ionicons/icons'
import { useTeamChat } from '@/composables/useTeamChat'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'
import { getAvatarDisplaySrc } from '@/utils/avatars'
import { ref as dbRef, get, push, set } from 'firebase/database'
import { database } from '@/firebase/config'
import type { Team } from '@/types'

// Props
interface Props {
  isOpen: boolean
  team: Team | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Composables
const { user } = useAuth()
const { profile, loadProfile } = useProfile()

// Refs
const chatContent = ref<any>(null)
const messageInput = ref<any>(null)

// State
const newMessage = ref('')
const isScrolledToBottom = ref(true)

// Store user/profile to avoid reactivity issues
const storedUser = ref<any>(null)
const storedProfile = ref<any>(null)

// Team chat state
const messages = ref<any[]>([])
const loading = ref(false)
const sending = ref(false)
const messageCount = computed(() => messages.value.length)
const hasMessages = computed(() => messageCount.value > 0)

// Chat functions
let currentTeamChat: any = null

const initializeChat = () => {
  if (props.team && props.team.id) {
    console.log('🎯 Initializing chat for team:', props.team.id)
    console.log('🎯 Current user in modal:', user.value?.uid)
    console.log('🎯 Current profile in modal:', profile.value?.name)
    
    // Pass current user and profile to avoid reactivity issues
    currentTeamChat = useTeamChat(props.team.id, user.value, profile.value)
    return currentTeamChat
  }
  return null
}

const subscribeToMessages = () => {
  const chat = initializeChat()
  if (chat) {
    console.log('🎯 Subscribing to messages...')
    loading.value = true
    chat.subscribeToMessages()
    
    // Watch for messages changes
    watch(chat.messages, (newMessages) => {
      console.log('🎯 Messages updated:', newMessages.length)
      messages.value = newMessages
    }, { immediate: true })
    
    watch(chat.loading, (newLoading) => {
      loading.value = newLoading
    })
  }
}

const sendMessage = async (messageText: string) => {
  console.log('🎯 Sending message from modal:', messageText)
  console.log('🎯 Stored user:', storedUser.value?.uid)
  console.log('🎯 Stored profile:', storedProfile.value?.name)
  console.log('🎯 Current user:', user.value?.uid)
  console.log('🎯 Current profile:', profile.value?.name)

  // Use stored values to avoid reactivity issues
  const finalUser = storedUser.value || user.value
  const finalProfile = storedProfile.value || profile.value

  console.log('🎯 Final user for message:', finalUser?.uid)
  console.log('🎯 Final profile for message:', finalProfile?.name)

  if (!finalUser) {
    console.error('🎯 No user available for sending message')
    return
  }

  if (!finalProfile?.name) {
    console.error('🎯 No profile name available for sending message')
    
    // Try one more time to load profile
    try {
      console.log('🎯 Last attempt to load profile...')
      await loadProfile(finalUser.uid)
      
      if (profile.value?.name) {
        console.log('🎯 Profile loaded on last attempt:', profile.value.name)
        storedProfile.value = profile.value
      } else {
        console.error('🎯 Still no profile after last attempt')
        return
      }
    } catch (error) {
      console.error('🎯 Failed to load profile on last attempt:', error)
      return
    }
  }

  if (!messageText.trim()) {
    console.error('🎯 Empty message text')
    return
  }

  // Use the composable if available, otherwise fall back to direct Firebase
  const chat = currentTeamChat || initializeChat()
  if (chat) {
    sending.value = true
    try {
      await chat.sendMessage(messageText)
      console.log('🎯 Message sent successfully via composable')
    } catch (error) {
      console.error('🎯 Composable send failed, trying direct Firebase...', error)
      
      // Fallback to direct Firebase write
      try {
        const messagesRef = dbRef(database, `chats/${props.team!.id}/messages`)
        const newMessageRef = push(messagesRef)
        
        const message = {
          id: newMessageRef.key!,
          userId: finalUser.uid,
          userName: finalProfile.name,
          userAvatar: finalProfile.avatar || '',
          message: messageText.trim(),
          timestamp: new Date().toISOString(),
          type: 'text'
        }

        console.log('🎯 Writing message directly to Firebase:', message)
        await set(newMessageRef, message)
        console.log('🎯 Direct Firebase write successful!')
        
      } catch (directError) {
        console.error('🎯 Direct Firebase write also failed:', directError)
        throw directError
      }
    } finally {
      sending.value = false
    }
  }
}

const cleanup = () => {
  console.log('🎯 Cleaning up modal chat')
  if (currentTeamChat) {
    currentTeamChat.cleanup()
    currentTeamChat = null
  }
  messages.value = []
}

// Computed
const canSendMessage = computed(() => {
  return newMessage.value.trim().length > 0 && 
         newMessage.value.length <= 500 && 
         !sending.value
})

// Methods
const isOwnMessage = (message: any) => {
  return user.value && message.userId === user.value.uid
}

const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('pl-PL', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const handleSendMessage = async () => {
  if (!canSendMessage.value) return

  const messageText = newMessage.value.trim()
  newMessage.value = ''

  try {
    await sendMessage(messageText)
    await scrollToBottom()
    
    // Focus back to input
    await nextTick()
    if (messageInput.value) {
      messageInput.value.$el.querySelector('textarea')?.focus()
    }
  } catch (error) {
    // Error handling is done in the composable
    console.error('Send message error:', error)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSendMessage()
  }
}

const handleInput = (event: any) => {
  newMessage.value = event.detail.value
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContent.value) {
    chatContent.value.$el.scrollToBottom(300)
  }
}

const checkScrollPosition = () => {
  if (chatContent.value) {
    const content = chatContent.value.$el
    const threshold = 100
    isScrolledToBottom.value = 
      content.scrollHeight - content.scrollTop - content.clientHeight < threshold
  }
}

// Watch for new messages and auto-scroll
watch(messages, async (newMessages, oldMessages) => {
  if (newMessages.length > (oldMessages?.length || 0)) {
    // Only auto-scroll if user is near bottom
    if (isScrolledToBottom.value) {
      await scrollToBottom()
    }
  }
}, { deep: true })

// Watch for modal open/close
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.team) {
    console.log('🎯 Modal opening...')
    console.log('🎯 Current user:', user.value?.uid)
    console.log('🎯 Current profile before load:', profile.value?.name)
    
    // FORCE LOAD PROFILE WHEN MODAL OPENS
    if (user.value?.uid) {
      try {
        console.log('🎯 Force loading profile for user:', user.value.uid)
        await loadProfile(user.value.uid)
        console.log('🎯 Profile after force load:', profile.value?.name)
        
        // Double check - if still no profile, try alternative approach
        if (!profile.value?.name) {
          console.log('🎯 Profile still not loaded, trying alternative approach...')
          
          // Try loading profile directly from Firebase
          const userRef = dbRef(database, `users/${user.value.uid}`)
          const userSnapshot = await get(userRef)
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val()
            console.log('🎯 Direct Firebase profile data:', userData)
            
            // Store profile data directly
            storedProfile.value = userData
            console.log('🎯 Stored profile from Firebase:', storedProfile.value?.name)
          } else {
            console.error('🎯 No profile found in Firebase for user:', user.value.uid)
          }
        } else {
          // Store the loaded profile
          storedProfile.value = profile.value
        }
      } catch (error) {
        console.error('🎯 Error loading profile:', error)
      }
    }
    
    // Store user reference
    storedUser.value = user.value
    
    console.log('🎯 Final stored user:', storedUser.value?.uid)
    console.log('🎯 Final stored profile:', storedProfile.value?.name)
    
    subscribeToMessages()
    await nextTick()
    await scrollToBottom()
    
    // Focus input after a short delay
    setTimeout(() => {
      if (messageInput.value) {
        messageInput.value.$el.querySelector('textarea')?.focus()
      }
    }, 300)
  } else {
    cleanup()
    newMessage.value = ''
    storedUser.value = null
    storedProfile.value = null
  }
})

// Cleanup on unmount
onUnmounted(() => {
  console.log('🎯 Modal unmounting, cleaning up...')
  cleanup()
})
</script>

<style scoped>
/* Modal Styles */
.team-chat-modal {
  --height: 90vh;
  --border-radius: 16px;
}

/* Animation Keyframes */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
  animation-fill-mode: both;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-toolbar {
  --background: transparent;
  --color: white;
  --border-color: transparent;
}

.modal-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.3rem;
}

.message-count {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.close-button {
  --color: white;
  --background-hover: rgba(255, 255, 255, 0.1);
}

.close-icon {
  font-size: 1.4rem;
  transition: transform 0.2s ease;
}

.close-button:hover .close-icon {
  transform: scale(1.1) rotate(90deg);
}

/* Chat Content */
.chat-content {
  --background: linear-gradient(180deg, var(--ion-color-light) 0%, var(--ion-color-light-tint) 100%);
  --padding-bottom: 0;
  --padding-top: 0;
  --padding-start: 0;
  --padding-end: 0;
}

/* Loading State */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  padding: 2rem;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
}

.loading-text {
  color: var(--ion-color-medium);
  margin: 0;
}

/* Messages Container */
.messages-container {
  padding: 1rem;
  padding-bottom: 0.5rem;
}

.message-wrapper {
  margin-bottom: 1rem;
}

/* System Messages */
.system-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
}

.system-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  padding: 0.5rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
}

.system-icon {
  color: var(--ion-color-primary);
  font-size: 1rem;
}

.system-text {
  color: var(--ion-color-primary);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Message Items */
.message-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.own-message {
  flex-direction: row-reverse;
}

.own-message .message-content {
  align-items: flex-end;
}

.other-message .message-content {
  align-items: flex-start;
}

/* Avatar */
.message-avatar {
  flex-shrink: 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--ion-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.placeholder-icon {
  font-size: 1.2rem;
  color: var(--ion-color-medium);
}

/* Message Content */
.message-content {
  display: flex;
  flex-direction: column;
  max-width: 75%;
  min-width: 0;
}

.message-username {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
  margin-bottom: 0.25rem;
  padding: 0 0.75rem;
}

/* Message Bubble */
.message-bubble {
  position: relative;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.own-message .message-bubble {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.other-message .message-bubble {
  background: white;
  color: var(--ion-color-dark);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--ion-color-light-shade);
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.message-text {
  line-height: 1.4;
  margin-bottom: 0.25rem;
  white-space: pre-wrap;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.7;
  text-align: right;
}

.other-message .message-time {
  color: var(--ion-color-medium);
}

.own-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
}

.typing-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  border: 1px solid var(--ion-color-light-shade);
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: var(--ion-color-medium);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}

.typing-text {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-style: italic;
}

/* Empty State */
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  min-height: 50vh;
}

.empty-illustration {
  margin-bottom: 1.5rem;
}

.empty-icon {
  font-size: 4rem;
  color: var(--ion-color-light-shade);
}

.empty-content {
  max-width: 300px;
}

.empty-title {
  color: var(--ion-color-primary);
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.empty-message {
  color: var(--ion-color-medium);
  font-size: 1rem;
  line-height: 1.4;
  margin: 0;
}

/* Message Footer */
.message-footer {
  background: white;
  border-top: 1px solid var(--ion-color-light-shade);
}

.input-toolbar {
  --background: transparent;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 8px;
  --padding-bottom: 8px;
  --min-height: auto;
}

.message-input-container {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 0 1rem;
}

.input-wrapper {
  flex: 1;
  position: relative;
  background: var(--ion-color-light);
  border-radius: 20px;
  border: 1px solid var(--ion-color-light-shade);
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: var(--ion-color-primary);
  background: white;
  box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.1);
}

.message-textarea {
  --background: transparent;
  --color: var(--ion-color-dark);
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
  font-size: 1rem;
  line-height: 1.4;
  resize: none;
}

.char-counter {
  position: absolute;
  bottom: 0.25rem;
  right: 0.75rem;
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  transition: color 0.2s ease;
}

.char-counter.warning {
  color: var(--ion-color-warning);
  font-weight: 600;
}

.send-button {
  --border-radius: 50%;
  width: 44px;
  height: 44px;
  margin: 0;
  --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
  --color: white;
  transition: all 0.2s ease;
}

.send-button:not([disabled]):hover {
  transform: scale(1.05);
  --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
}

.send-button[disabled] {
  --background: var(--ion-color-light);
  --color: var(--ion-color-medium);
}

.send-icon,
.send-spinner {
  font-size: 1.2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .message-bubble {
    padding: 0.5rem 0.75rem;
  }
  
  .message-input-container {
    padding: 0 0.75rem;
    gap: 0.5rem;
  }
  
  .send-button {
    width: 40px;
    height: 40px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .chat-content {
    --background: linear-gradient(180deg, var(--ion-color-dark) 0%, var(--ion-color-dark-tint) 100%);
  }
  
  .other-message .message-bubble {
    background: var(--ion-color-dark-tint);
    color: var(--ion-color-light);
    border-color: var(--ion-color-dark-shade);
  }
  
  .input-wrapper {
    background: var(--ion-color-dark-tint);
    border-color: var(--ion-color-dark-shade);
  }
  
  .input-wrapper:focus-within {
    background: var(--ion-color-dark-shade);
  }
  
  .message-footer {
    background: var(--ion-color-dark);
    border-color: var(--ion-color-dark-shade);
  }
}
</style>