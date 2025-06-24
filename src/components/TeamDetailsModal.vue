<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ team?.name || 'Szczegóły drużyny' }}</ion-title>
        
          <ion-button fill="clear" slot="end" @click="$emit('close')">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content v-if="team" class="ion-padding">
      <!-- Team Header -->
      <div class="team-header">
        <h2>{{ team.name }}</h2>
        <ion-chip :color="isTeamFull ? 'danger' : 'success'">
          <ion-icon :icon="peopleOutline"></ion-icon>
          <ion-label>{{ team.currentMembers }}/{{ team.maxMembers }} graczy</ion-label>
        </ion-chip>
      </div>

      <!-- Team Info -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Informacje</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="info-grid">
            <div class="info-item">
              <ion-icon :icon="gameControllerOutline"></ion-icon>
              <div>
                <p class="label">Gra/System</p>
                <p class="value">{{ team.game }}</p>
              </div>
            </div>
            
            <div class="info-item">
              <ion-icon :icon="locationOutline" />
              <div>
                <p class="label">Lokacja</p>
                <p class="value">{{ team.location }}</p>
              </div>
            </div>

            <div class="info-item">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <div>
                <p class="label">Terminy spotkań</p>
                <p class="value">
                  <span v-if="!team.meetingTimes?.length">Do ustalenia</span>
                  <span v-else>
                    <span v-for="(time, index) in team.meetingTimes" :key="time">
                      {{ time }}<span v-if="index < team.meetingTimes.length - 1">, </span>
                    </span>
                  </span>
                </p>
              </div>
            </div>

            <div class="info-item">
              <ion-icon :icon="personOutline"></ion-icon>
              <div>
                <p class="label">Właściciel</p>
                <p class="value">{{ ownerName || 'Ładowanie...' }}</p>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- PENDING REQUESTS SECTION - Only visible to team owner -->
      <ion-card v-if="isUserOwner && pendingRequests.length > 0">
        <ion-card-header>
          <ion-card-title>
            Prośby o dołączenie
            <ion-badge color="warning">{{ pendingRequests.length }}</ion-badge>
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="requests-list">
            <div 
              v-for="request in pendingRequests" 
              :key="request.id"
              class="request-item"
            >
              <div class="request-info">
                <ion-avatar>
                  <img 
                    v-if="request.userAvatar" 
                    :src="getAvatarDisplaySrc(request.userAvatar)" 
                    alt="Awatar użytkownika"
                    @error="handleAvatarError($event, 'request-' + request.id)"
                  />
                  <ion-icon 
                    v-else 
                    :icon="personOutline"
                  ></ion-icon>
                </ion-avatar>
                <div class="request-details">
                  <h4>{{ request.userName }}</h4>
                  <p v-if="request.userLocation">
                    <ion-icon :icon="locationOutline"></ion-icon>
                    {{ request.userLocation }}
                  </p>
                  <p v-if="request.userGame">
                    <ion-icon :icon="gameControllerOutline"></ion-icon>
                    {{ request.userGame }}
                  </p>
                  <p class="request-date">
                    Poproszono: {{ formatDate(request.createdAt) }}
                  </p>
                </div>
              </div>
              
              <div class="request-actions">
                <ion-button 
                  size="small" 
                  color="success"
                  @click="handleApprove(request)"
                  :disabled="requestsLoading"
                >
                  <ion-icon :icon="checkmarkOutline"></ion-icon>
                  Zaakceptuj
                </ion-button>
                <ion-button 
                  size="small" 
                  color="danger" 
                  fill="outline"
                  @click="handleReject(request)"
                  :disabled="requestsLoading"
                >
                  <ion-icon :icon="closeOutline"></ion-icon>
                  Odrzuć
                </ion-button>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Loading state for requests -->
      <ion-card v-else-if="isUserOwner && requestsLoading">
        <ion-card-content>
          <div class="loading-requests">
            <ion-spinner></ion-spinner>
            <p>Ładowanie próśb...</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- No pending requests message for owners -->
      <ion-card v-else-if="isUserOwner && pendingRequests.length === 0 && !requestsLoading">
        <ion-card-header>
          <ion-card-title>Prośby o dołączenie</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p class="no-requests">Brak próśb w toku</p>
        </ion-card-content>
      </ion-card>

      <!-- Description -->
      <ion-card v-if="team.description">
        <ion-card-header>
          <ion-card-title>Opis</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ team.description }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Members -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Członkowie</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item 
              v-for="(role, userId) in team.members" 
              :key="userId"
              button
              @click="openUserProfile(userId)"
            >
             <ion-avatar slot="start">
                <img 
                  v-if="memberAvatars[userId]" 
                  :src="getAvatarDisplaySrc(memberAvatars[userId])" 
                  alt="Awatar członka drużyny"
                  @error="handleAvatarError($event, 'member-' + userId)"
                />
                <ion-icon 
                  v-else 
                  :icon="personOutline"
                ></ion-icon>
              </ion-avatar>
              <ion-label>
                <h3>{{ memberNames[userId] || 'Ładowanie...' }}</h3>
                <p>{{ role === 'owner' ? 'Właściciel' : 'Członek' }}</p>
              </ion-label>
              <ion-badge v-if="role === 'owner'" color="primary">Owner</ion-badge>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Action Button -->
      <div class="action-section">
        <ion-button 
          v-if="isUserOwner"
          expand="block"
          disabled
        >
          Jesteś właścicielem tej drużyny
        </ion-button>
        
        <ion-button 
          v-else-if="isUserMember"
          expand="block"
          color="secondary"
          disabled
        >
          Jesteś członkiem tej drużyny
        </ion-button>
        
        <ion-button 
          v-else-if="hasPendingRequest"
          expand="block"
          color="warning"
          disabled
        >
          <template #start>
            <ion-icon :icon="timeOutline"></ion-icon>
          </template>
          Oczekuje na akceptację
        </ion-button>
        
        <ion-button 
          v-else-if="isTeamFull"
          expand="block"
          disabled
        >
          Drużyna jest pełna
        </ion-button>
        
        <ion-button 
          v-else
          expand="block"
          @click="handleJoinRequest"
          :disabled="loading"
        >
          <template v-if="loading" #start>
            <ion-spinner></ion-spinner>
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
  IonList,
  IonItem,
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
  checkmarkOutline
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

const openUserProfile = (userId: string) => {
  selectedUserId.value = userId
  showUserProfile.value = true
}

const closeUserProfile = () => {
  showUserProfile.value = false
  selectedUserId.value = null
}

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

// Methods
const loadMemberNames = async () => {
  if (!props.team) return

  // Load owner name
  try {
    const ownerProfile = await loadProfile(props.team.ownerId)
    ownerName.value = ownerProfile?.name || 'Nieznany'
  } catch (err) {
    ownerName.value = 'Nieznany'
  }

  // Load member names
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

  // Check if user has a username
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
    console.log('Loading pending requests...')
    const requests = await getPendingRequests(props.team.id)
    pendingRequests.value = requests
   
    // Now works with optional userAvatar
    console.log('Loaded pending requests:', requests.map(r => ({
      user: r.userName,
      avatar: isUploadedAvatar(r.userAvatar) ? 'Załadowany awatar' : (r.userAvatar || 'Brak awatara')
    })))
   
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

            // Reload requests and emit update
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
    message: `Czy na pewno chcesz odrzucić prośbę od ${request.userName} o dołączenie do drużyny?`,
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

            // Reload requests
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
  console.warn(`Avatar failed to load for ${context}`)
  
  // Hide broken image
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  
  // Optional: Update data with fallback
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
.team-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.team-header h2 {
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.info-item ion-icon {
  color: var(--ion-color-primary);
  font-size: 24px;
  min-width: 24px;
  margin-top: 0.2rem;
}

.info-item .label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 0 0 0.25rem 0;
}

.info-item .value {
  font-size: 1rem;
  margin: 0;
}

ion-list {
  background: transparent;
}

ion-item {
  --background: transparent;
}

.action-section {
  margin-top: 2rem;
  padding-bottom: 1rem;
}

ion-card {
  margin-bottom: 1rem;
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
  padding: 1rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
  background: var(--ion-color-light-tint);
}

.request-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.request-details h4 {
  margin: 0 0 0.5rem 0;
  color: var(--ion-color-primary);
}

.request-details p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.request-details .request-date {
  font-size: 0.8rem;
}

.request-actions {
  display: flex;
  gap: 0.5rem;
}

.request-date {
  font-size: 0.8rem !important;
}

.loading-requests {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  gap: 0.5rem;
}

.no-requests {
  text-align: center;
  color: var(--ion-color-medium);
  font-style: italic;
}

ion-badge {
  margin-left: 0.5rem;
}

ion-item {
  --background: transparent;
  margin-bottom: 0.5rem;
}

ion-avatar {
  width: 48px;
  height: 48px;
}

.request-info ion-avatar {
  width: 60px;
  height: 60px;
}
</style>