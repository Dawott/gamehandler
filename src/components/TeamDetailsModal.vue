<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ team?.name || 'Szczegóły drużyny' }}</ion-title>
        <template #end>
          <ion-button fill="clear" @click="$emit('close')">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </template>
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
            <ion-item v-for="(role, userId) in team.members" :key="userId">
                <template #start>
              <ion-avatar>
                <ion-icon :icon="personOutline"></ion-icon>
              </ion-avatar>
              </template>
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
  toastController
} from '@ionic/vue'
import {
  closeOutline,
  peopleOutline,
  gameControllerOutline,
  locationOutline,
  calendarOutline,
  personOutline,
  timeOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useTeams } from '@/composables/useTeams'
import { useProfile } from '@/composables/useProfile'
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
  'join-requested': []
}>()

// Composables
const { user } = useAuth()
const { requestJoinTeam, checkPendingRequest, loading } = useTeams()
const { loadProfile } = useProfile()

// State
const ownerName = ref<string>('')
const memberNames = ref<Record<string, string>>({})
const hasPendingRequest = ref(false)

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
    } catch (err) {
      memberNames.value[userId] = 'Nieznany'
    }
  }
}

const checkRequestStatus = async () => {
  if (!props.team || !user.value) return
  
  hasPendingRequest.value = await checkPendingRequest(props.team.id)
}

const handleJoinRequest = async () => {
  if (!props.team) return

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

// Watch for team changes
watch(() => props.team, async (newTeam) => {
  if (newTeam) {
    await Promise.all([
      loadMemberNames(),
      checkRequestStatus()
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
</style>