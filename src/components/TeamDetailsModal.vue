<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')" class="team-details-modal">
    <ion-header class="modal-header">
      <ion-toolbar class="modal-toolbar">
        <ion-title class="modal-title">{{ team?.name || 'Szczegóły drużyny' }}</ion-title>
        <ion-button fill="clear" slot="end" @click="$emit('close')" class="close-button">
          <ion-icon :icon="closeOutline" class="close-icon"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content v-if="team" class="modal-content">
      <!-- Team Header -->
      <div class="team-header animate-slide-down">
        <div class="header-background">
          <div class="gradient-bg"></div>
          <div class="pattern-overlay"></div>
        </div>
        
        <div class="header-content">
          <h1 class="team-name">{{ team.name }}</h1>
          
          <!-- capacity -->
          <div class="capacity-section">
            <div class="capacity-bar-container">
              <div class="capacity-label">Zapełnienie drużyny</div>
              <div class="capacity-bar">
                <div 
                  class="capacity-fill" 
                  :style="{ width: capacityPercentage + '%' }"
                  :class="{
                    'capacity-low': capacityPercentage < 50,
                    'capacity-medium': capacityPercentage >= 50 && capacityPercentage < 80,
                    'capacity-high': capacityPercentage >= 80 && capacityPercentage < 100,
                    'capacity-full': capacityPercentage >= 100
                  }"
                ></div>
              </div>
              <div class="capacity-text">
                <span class="current-members">{{ team.currentMembers }}</span>
                <span class="separator">/</span>
                <span class="max-members">{{ team.maxMembers }}</span>
                <span class="players-text">graczy</span>
              </div>
            </div>
            
            <ion-chip 
              :color="isTeamFull ? 'danger' : 'success'" 
              class="status-chip animate-bounce-in"
            >
              <ion-icon :icon="peopleOutline" class="chip-icon"></ion-icon>
              <ion-label>{{ isTeamFull ? 'Pełna' : 'Dostępna' }}</ion-label>
            </ion-chip>
          </div>
        </div>
      </div>

      <!-- Team Info Card -->
      <ion-card class="info-card animate-slide-up" style="animation-delay: 0.1s">
        <ion-card-header class="card-header">
          <ion-card-title class="card-title">
            <ion-icon :icon="informationCircleOutline" class="title-icon"></ion-icon>
            Informacje o drużynie
          </ion-card-title>
        </ion-card-header>
        
        <ion-card-content class="card-content">
          <div class="info-grid">
            <div class="info-item game-info animate-fade-in" style="animation-delay: 0.2s">
              <div class="info-icon-wrapper game-gradient">
                <ion-icon :icon="gameControllerOutline" class="info-icon"></ion-icon>
              </div>
              <div class="info-details">
                <p class="info-label">Gra/System</p>
                <p class="info-value">{{ team.game }}</p>
              </div>
            </div>
            
            <div class="info-item location-info animate-fade-in" style="animation-delay: 0.3s">
              <div class="info-icon-wrapper location-gradient">
                <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
              </div>
              <div class="info-details">
                <p class="info-label">Lokacja</p>
                <p class="info-value">{{ team.location }}</p>
              </div>
            </div>

            <div class="info-item schedule-info animate-fade-in" style="animation-delay: 0.4s">
              <div class="info-icon-wrapper schedule-gradient">
                <ion-icon :icon="calendarOutline" class="info-icon"></ion-icon>
              </div>
              <div class="info-details">
                <p class="info-label">Terminy spotkań</p>
                <p class="info-value">
                  <span v-if="!team.meetingTimes?.length" class="no-schedule">Do ustalenia</span>
                  <span v-else class="schedule-list">
                    <span 
                      v-for="(time, index) in team.meetingTimes" 
                      :key="time"
                      class="schedule-item"
                    >
                      {{ time }}<span v-if="index < team.meetingTimes.length - 1">, </span>
                    </span>
                  </span>
                </p>
              </div>
            </div>

            <div class="info-item owner-info animate-fade-in" style="animation-delay: 0.5s">
              <div class="info-icon-wrapper owner-gradient">
                <ion-icon :icon="ribbonOutline" class="info-icon"></ion-icon>
              </div>
              <div class="info-details">
                <p class="info-label">Właściciel</p>
                <p class="info-value">{{ ownerName || 'Ładowanie...' }}</p>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Pending Requests Section -->
      <ion-card 
        v-if="isUserOwner && pendingRequests.length > 0" 
        class="requests-card animate-slide-up" 
        style="animation-delay: 0.2s"
      >
        <ion-card-header class="card-header">
          <ion-card-title class="card-title requests-title">
            <ion-icon :icon="mailOutline" class="title-icon requests-icon animate-pulse"></ion-icon>
            Prośby o dołączenie
            <ion-badge color="warning" class="requests-count animate-bounce">
              {{ pendingRequests.length }}
            </ion-badge>
          </ion-card-title>
        </ion-card-header>
        
        <ion-card-content class="card-content">
          <div class="requests-list">
            <div 
              v-for="(request, index) in pendingRequests" 
              :key="request.id"
              class="request-item animate-slide-in-right"
              :style="{ animationDelay: (0.3 + index * 0.1) + 's' }"
            >
              <div class="request-user">
                <ion-avatar class="user-avatar">
                  <img 
                    v-if="request.userAvatar" 
                    :src="getAvatarDisplaySrc(request.userAvatar)" 
                    alt="Awatar użytkownika"
                    @error="handleAvatarError($event, 'request-' + request.id)"
                    class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder">
                    <ion-icon :icon="personOutline" class="placeholder-icon"></ion-icon>
                  </div>
                </ion-avatar>
                
                <div class="user-details">
                  <h4 class="user-name">{{ request.userName }}</h4>
                  <div class="user-meta">
                    <p v-if="request.userLocation" class="user-location">
                      <ion-icon :icon="locationOutline" class="meta-icon"></ion-icon>
                      {{ request.userLocation }}
                    </p>
                    <p v-if="request.userGame" class="user-game">
                      <ion-icon :icon="gameControllerOutline" class="meta-icon"></ion-icon>
                      {{ request.userGame }}
                    </p>
                  </div>
                  <p class="request-date">
                    <ion-icon :icon="timeOutline" class="meta-icon"></ion-icon>
                    {{ formatDate(request.createdAt) }}
                  </p>
                </div>
              </div>
              
              <div class="request-actions">
                <ion-button 
                  size="small" 
                  color="success"
                  @click="handleApprove(request)"
                  :disabled="requestsLoading"
                  class="action-button approve-button"
                >
                  <ion-icon :icon="checkmarkOutline" slot="icon-only" class="action-icon"></ion-icon>
                </ion-button>
                <ion-button 
                  size="small" 
                  color="danger" 
                  fill="outline"
                  @click="handleReject(request)"
                  :disabled="requestsLoading"
                  class="action-button reject-button"
                >
                  <ion-icon :icon="closeOutline" slot="icon-only" class="action-icon"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Loading state for requests -->
      <ion-card v-else-if="isUserOwner && requestsLoading" class="requests-card animate-pulse">
        <ion-card-content>
          <div class="loading-requests">
            <div class="loading-spinner">
              <ion-spinner class="spinner"></ion-spinner>
            </div>
            <p class="loading-text">Ładowanie próśb...</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Description Card -->
      <ion-card 
        v-if="team.description" 
        class="description-card animate-slide-up" 
        style="animation-delay: 0.3s"
      >
        <ion-card-header class="card-header">
          <ion-card-title class="card-title">
            <ion-icon :icon="documentTextOutline" class="title-icon"></ion-icon>
            Opis drużyny
          </ion-card-title>
        </ion-card-header>
        <ion-card-content class="card-content">
          <p class="description-text">{{ team.description }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Members Card -->
      <ion-card class="members-card animate-slide-up" style="animation-delay: 0.4s">
        <ion-card-header class="card-header">
          <ion-card-title class="card-title">
            <ion-icon :icon="peopleOutline" class="title-icon"></ion-icon>
            Członkowie drużyny
          </ion-card-title>
        </ion-card-header>
        
        <ion-card-content class="card-content">
          <div class="members-grid">
            <div 
              v-for="(role, userId, index) in team.members" 
              :key="userId"
              class="member-item animate-scale-in"
              :style="{ animationDelay: (0.5 + index * 0.1) + 's' }"
              @click="openUserProfile(userId)"
            >
              <div class="member-avatar-wrapper">
                <ion-avatar class="member-avatar">
                  <img 
                    v-if="memberAvatars[userId]" 
                    :src="getAvatarDisplaySrc(memberAvatars[userId])" 
                    alt="Awatar członka drużyny"
                    @error="handleAvatarError($event, 'member-' + userId)"
                    class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder">
                    <ion-icon :icon="personOutline" class="placeholder-icon"></ion-icon>
                  </div>
                </ion-avatar>
                
                <div v-if="role === 'owner'" class="owner-crown">
                  <ion-icon :icon="ribbonOutline" class="crown-icon"></ion-icon>
                </div>
              </div>
              
              <div class="member-info">
                <h4 class="member-name">{{ memberNames[userId] || 'Ładowanie...' }}</h4>
                <ion-badge 
                  :color="role === 'owner' ? 'warning' : 'primary'" 
                  class="role-badge"
                >
                  {{ role === 'owner' ? 'Właściciel' : 'Członek' }}
                </ion-badge>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Action Section -->
       <div class="action-section animate-slide-up" style="animation-delay: 0.5s" >
        <ion-button 
          v-if="isUserOwner"
          expand="block"
          disabled
          class="action-button owner-button"
        >
          <ion-icon :icon="ribbonOutline" slot="start" class="button-icon"></ion-icon>
          Jesteś właścicielem tej drużyny
        </ion-button>
        
        <ion-button 
          v-else-if="isUserMember"
          expand="block"
          color="secondary"
          disabled
          class="action-button member-button"
        >
          <ion-icon :icon="checkmarkCircleOutline" slot="start" class="button-icon"></ion-icon>
          Jesteś członkiem tej drużyny
        </ion-button>
        
        <ion-button 
          v-else-if="hasPendingRequest"
          expand="block"
          color="warning"
          disabled
          class="action-button pending-button animate-pulse"
        >
          <ion-icon :icon="timeOutline" slot="start" class="button-icon"></ion-icon>
          Oczekuje na akceptację
        </ion-button>
        
        <ion-button 
          v-else-if="isTeamFull"
          expand="block"
          disabled
          class="action-button full-button"
        >
          <ion-icon :icon="lockClosedOutline" slot="start" class="button-icon"></ion-icon>
          Drużyna jest pełna
        </ion-button>
        
        <ion-button 
          v-else
          expand="full"
          @click="handleJoinRequest"
          :disabled="loading"
          class="action-button join-button"
        >
          <template v-if="loading" #start>
            <ion-spinner class="button-spinner"></ion-spinner>
          </template>
          <template v-else #start>
            <ion-icon :icon="addOutline" class="button-icon"></ion-icon>
          </template>
          {{ loading ? 'Wysyłanie...' : 'Poproś o dołączenie' }}
        </ion-button>
      </div>
     
    </ion-content>
    
    <UserProfileModal
      :is-open="showUserProfile"
      :user-id="selectedUserId"
      @close="closeUserProfile"
    />
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonSpinner,
  toastController,
  alertController
} from '@ionic/vue'
import {
  closeOutline,
  peopleOutline,
  gameControllerOutline,
  locationOutline,
  calendarOutline,
  personOutline,
  timeOutline,
  checkmarkOutline,
  informationCircleOutline,
  ribbonOutline,
  mailOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  addOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useTeams } from '@/composables/useTeams'
import { useProfile } from '@/composables/useProfile'
import type { Team, JoinRequest } from '@/types'
import { useJoinRequests } from '@/composables/useJoinRequests'
import { getAvatarDisplaySrc, getDefaultAvatar, isUploadedAvatar } from '@/utils/avatars'
import UserProfileModal from '@/components/UserProfileModal.vue'

// Props
interface Props {
  isOpen: boolean
  team: Team | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  'join-requested': []
  'request-processed': []
}>()

// Composables
const { user } = useAuth()
const { 
  loading: requestsLoading, 
  getPendingRequests, 
  approveRequest, 
  rejectRequest 
} = useJoinRequests()
const { requestJoinTeam, checkPendingRequest, loading } = useTeams()
const { loadProfile, profile } = useProfile()

// State
const ownerName = ref<string>('')
const memberNames = ref<Record<string, string>>({})
const pendingRequests = ref<any[]>([])
const hasPendingRequest = ref(false)
const memberAvatars = ref<Record<string, string>>({})
const showUserProfile = ref(false)
const selectedUserId = ref<string | null>(null)

// Computed
const isTeamFull = computed(() => {
  return props.team ? props.team.currentMembers >= props.team.maxMembers : false
})

const isUserOwner = computed(() => {
  return user.value && props.team && props.team.ownerId === user.value.uid
})

const isUserMember = computed(() => {
  return user.value && props.team && props.team.members[user.value.uid] !== undefined
})

const capacityPercentage = computed(() => {
  if (!props.team) return 0
  return Math.min((props.team.currentMembers / props.team.maxMembers) * 100, 100)
})

// Methods
const openUserProfile = (userId: string) => {
  selectedUserId.value = userId
  showUserProfile.value = true
}

const closeUserProfile = () => {
  showUserProfile.value = false
  selectedUserId.value = null
}

const loadMemberNames = async () => {
  if (!props.team) return

  try {
    const ownerProfile = await loadProfile(props.team.ownerId)
    ownerName.value = ownerProfile?.name || 'Nieznany'
  } catch (err) {
    ownerName.value = 'Nieznany'
  }

  for (const userId of Object.keys(props.team.members)) {
    try {
      const profile = await loadProfile(userId)
      memberNames.value[userId] = profile?.name || 'Nieznany'
      const avatarPath = profile?.avatar || getDefaultAvatar()
      memberAvatars.value[userId] = avatarPath
    } catch (err) {
      memberNames.value[userId] = 'Nieznany'
      memberAvatars.value[userId] = getDefaultAvatar()
    }
  }
}

const checkRequestStatus = async () => {
  if (!props.team || !user.value) return
  hasPendingRequest.value = await checkPendingRequest(props.team.id)
}

const handleJoinRequest = async () => {
  if (!props.team) return

  if (!profile.value) {
    await loadProfile()
  }
  
  if (!profile.value?.name) {
    const alert = await alertController.create({
      header: 'Uzupełnij profil',
      message: 'Musisz uzupełnić swoją nazwę użytkownika przed dołączeniem do drużyny.',
      buttons: ['OK']
    })
    await alert.present()
    return
  }

  try {
    await requestJoinTeam(props.team.id)
    
    const toast = await toastController.create({
      message: 'Prośba o dołączenie została wysłana!',
      duration: 2000,
      color: 'success'
    })
    await toast.present()

    hasPendingRequest.value = true
    emit('join-requested')
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || 'Nie udało się wysłać prośby',
      duration: 2000,
      color: 'danger'
    })
    await toast.present()
  }
}

const loadPendingRequests = async () => {
  if (!props.team || !isUserOwner.value) return
 
  try {
    const requests = await getPendingRequests(props.team.id)
    pendingRequests.value = requests
  } catch (error) {
    console.error('Error loading pending requests:', error)
  }
}

const handleApprove = async (request: any) => {
  if (!props.team) return

  const alert = await alertController.create({
    header: 'Zaakceptuj Prośbę',
    message: `Czy chcesz przyjąć ${request.userName} do drużyny?`,
    buttons: [
      {
        text: 'Anuluj',
        role: 'cancel'
      },
      {
        text: 'Zaakceptuj',
        handler: async () => {
          try {
            await approveRequest(request.id, props.team!.id, request.userId)
            
            const toast = await toastController.create({
              message: `${request.userName} został przyjęty!`,
              duration: 2000,
              color: 'success'
            })
            await toast.present()

            await loadPendingRequests()
            emit('request-processed')
          } catch (error: any) {
            const toast = await toastController.create({
              message: error.message || 'Nie udało się zaakceptować prośby',
              duration: 2000,
              color: 'danger'
            })
            await toast.present()
          }
        }
      }
    ]
  })
  await alert.present()
}

const handleReject = async (request: any) => {
  if (!props.team) return

  const alert = await alertController.create({
    header: 'Odrzuć prośbę',
    message: `Czy na pewno chcesz odrzucić prośbę od ${request.userName}?`,
    buttons: [
      {
        text: 'Anuluj',
        role: 'cancel'
      },
      {
        text: 'Odrzuć',
        handler: async () => {
          try {
            await rejectRequest(request.id, props.team!.id)
            
            const toast = await toastController.create({
              message: `Prośba ${request.userName} odrzucona`,
              duration: 2000,
              color: 'warning'
            })
            await toast.present()

            await loadPendingRequests()
            emit('request-processed')
          } catch (error: any) {
            const toast = await toastController.create({
              message: error.message || 'Nie udało się odrzucić prośby',
              duration: 2000,
              color: 'danger'
            })
            await toast.present()
          }
        }
      }
    ]
  })
  await alert.present()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleAvatarError = (event: Event, context: string) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  
  if (context.startsWith('member-')) {
    const userId = context.replace('member-', '')
    memberAvatars.value[userId] = getDefaultAvatar()
  }
}

// Watch for team changes
watch(() => props.team, async (newTeam) => {
  if (newTeam) {
    memberNames.value = {}
    memberAvatars.value = {}
    pendingRequests.value = []

    await Promise.all([
      loadMemberNames(),
      checkRequestStatus(),
      loadProfile(),
      isUserOwner.value ? loadPendingRequests() : Promise.resolve()
    ])
  }
}, { immediate: true })
</script>

<style scoped>
/* Modal base styles */
.team-details-modal {
  --height: 90vh;
  --border-radius: 16px;
}

.modal-header {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
}

.modal-toolbar {
  --background: transparent;
  --color: white;
  --border-color: transparent;
}

.modal-title {
  font-weight: 600;
  font-size: 1.2rem;
}

.close-button {
  --color: white;
  --background-hover: rgba(255, 255, 255, 0.1);
}

.close-icon {
  font-size: 1.5rem;
  transition: transform 0.2s ease;
}

.close-button:hover .close-icon {
  transform: scale(1.1) rotate(90deg);
}

/* Content styles */
.modal-content {
  --background: linear-gradient(180deg, var(--ion-color-light) 0%, var(--ion-color-light-tint) 100%);
}

/* Animation keyframes */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

/* Animation classes */
.animate-slide-down {
  animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
  animation-fill-mode: both;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-scale-in {
  animation: scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-bounce-in {
  animation: bounceIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-bounce {
  animation: bounceIn 0.6s ease-out;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Team header styles */
.team-header {
  position: relative;
  padding: 2rem 1.5rem;
  margin: -1px -1px 1rem -1px;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 50%, var(--ion-color-secondary) 100%);
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
}

.header-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.team-name {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Capacity section */
.capacity-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.capacity-bar-container {
  width: 100%;
  max-width: 300px;
}

.capacity-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-align: center;
}

.capacity-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.capacity-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.capacity-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.capacity-low {
  background: linear-gradient(90deg, var(--ion-color-success), var(--ion-color-success-shade));
}

.capacity-medium {
  background: linear-gradient(90deg, var(--ion-color-warning), var(--ion-color-warning-shade));
}

.capacity-high {
  background: linear-gradient(90deg, var(--ion-color-danger-tint), var(--ion-color-danger));
}

.capacity-full {
  background: linear-gradient(90deg, var(--ion-color-danger), var(--ion-color-danger-shade));
}

.capacity-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: white;
  font-weight: 600;
}

.current-members {
  font-size: 1.2rem;
  color: var(--ion-color-warning);
}

.separator {
  color: rgba(255, 255, 255, 0.7);
}

.max-members {
  font-size: 1.2rem;
}

.players-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.status-chip {
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.chip-icon {
  margin-right: 0.5rem;
}

/* Card styles */
.info-card,
.requests-card,
.description-card,
.members-card {
  margin: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--ion-color-light-shade);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, white 0%, var(--ion-color-light-tint) 100%);
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.title-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.card-content {
  padding: 1.5rem;
}

/* Info grid */
.info-grid {
  display: grid;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--ion-color-light-shade);
  transition: all 0.2s ease;
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
}

.game-gradient {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
}

.location-gradient {
  background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
}

.schedule-gradient {
  background: linear-gradient(135deg, var(--ion-color-tertiary), var(--ion-color-tertiary-shade));
}

.owner-gradient {
  background: linear-gradient(135deg, var(--ion-color-warning), var(--ion-color-warning-shade));
}

.info-icon {
  font-size: 1.3rem;
  transition: transform 0.2s ease;
}

.info-item:hover .info-icon {
  transform: scale(1.1);
}

.info-details {
  flex: 1;
}

.info-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 1rem;
  color: var(--ion-color-dark);
  font-weight: 600;
  margin: 0;
}

.no-schedule {
  color: var(--ion-color-medium);
  font-style: italic;
}

.schedule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.schedule-item {
  color: var(--ion-color-dark);
}

/* Requests styles */
.requests-title {
  position: relative;
}

.requests-icon {
  animation: pulse 2s ease-in-out infinite;
}

.requests-count {
  margin-left: 0.5rem;
  font-weight: 700;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--ion-color-light-shade);
  transition: all 0.2s ease;
}

.request-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.request-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.user-avatar {
  width: 60px;
  height: 60px;
}

.avatar-img {
  object-fit: cover;
  border-radius: 50%;
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
  font-size: 1.5rem;
  color: var(--ion-color-medium);
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0 0 0.5rem 0;
  color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 1.1rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.user-location,
.user-game,
.request-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.meta-icon {
  font-size: 0.8rem;
}

.request-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium-shade);
}

.request-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  --border-radius: 12px;
  width: max-content;
  height: 44px;
  display: flex;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: scale(1.1);
}

.action-icon {
  font-size: 1.2rem;
}

.approve-button:hover {
  --background: var(--ion-color-success-shade);
}

.reject-button:hover {
  --color: var(--ion-color-danger);
  --border-color: var(--ion-color-danger);
}

/* Loading state */
.loading-requests {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 32px;
  height: 32px;
}

.loading-text {
  color: var(--ion-color-medium);
  margin: 0;
}

/* Description */
.description-text {
  color: var(--ion-color-dark);
  line-height: 1.6;
  margin: 0;
  font-size: 1rem;
}

/* Members grid */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--ion-color-light-shade);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.member-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.member-avatar-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.member-avatar {
  width: 80px;
  height: 80px;
}

.owner-crown {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--ion-color-warning), var(--ion-color-warning-shade));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.crown-icon {
  color: white;
  font-size: 1rem;
}

.member-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.member-name {
  margin: 0;
  color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 1rem;
}

.role-badge {
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 12px;
  padding: 0.25rem 0.75rem;
}

/* Action section */
.action-section {
  
  padding: 1rem 1.5rem 2rem 1.5rem;
}

.action-button {
  --border-radius: 16px;
  height: 56px;
  font-weight: 600;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
}

.action-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-button:not([disabled]):hover::after {
  left: 100%;
}

.button-icon,
.button-spinner {
  margin-right: 0.5rem;
  font-size: 1.2rem;
}

.join-button {
  --background: linear-gradient(135deg, var(--ion-color-success), var(--ion-color-success-shade));
  --color: white;
}

.join-button:hover {
  --background: linear-gradient(135deg, var(--ion-color-success-shade), var(--ion-color-success-tint));
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.pending-button {
  --background: linear-gradient(135deg, var(--ion-color-warning), var(--ion-color-warning-shade));
}

.owner-button {
  --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
}

.member-button {
  --background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
}

.full-button {
  --background: var(--ion-color-medium);
}

/* Responsive design */
@media (max-width: 768px) {
  .team-header {
    padding: 1.5rem 1rem;
  }
  
  .team-name {
    font-size: 1.8rem;
  }
  
  .info-grid {
    gap: 1rem;
  }
  
  .info-item {
    padding: 0.75rem;
  }
  
  .info-icon-wrapper {
    width: 40px;
    height: 40px;
  }
  
  .members-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
  
  .member-avatar {
    width: 64px;
    height: 64px;
  }
  
  .request-item {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .request-actions {
    justify-content: center;
  }
}
</style>