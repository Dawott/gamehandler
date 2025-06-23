<template>
  <ion-card @click="$emit('click', team)" button>
    <ion-card-header>
      <div class="card-header-content">
        <div class="title-section">
      <ion-card-title>{{ team.name }}</ion-card-title>
      <ion-badge 
            v-if="isUserOwner && pendingRequestsCount > 0" 
            color="warning"
            class="notification-badge"
          >
            {{ pendingRequestsCount }}
          </ion-badge>
          <ion-button
  v-if="isUserOwner"
  fill="clear"
  size="small"
  color="danger"
  @click.stop="handleQuickDelete"
  class="delete-button"
>
  <ion-icon :icon="trashOutline"></ion-icon>
</ion-button>
        </div>
      <ion-card-subtitle>
        <ion-chip :color="isTeamFull ? 'danger' : 'success'">
          <ion-icon :icon="peopleOutline"></ion-icon>
          <ion-label>{{ team.currentMembers }}/{{ team.maxMembers }}</ion-label>
        </ion-chip>
      </ion-card-subtitle>
      </div>
    </ion-card-header>

    <ion-card-content>
      <div class="team-info">
        <div class="info-item">
          <ion-icon :icon="gameControllerOutline"></ion-icon>
          <span>{{ team.game }}</span>
        </div>
        
        <div class="info-item">
          <ion-icon :icon="locationOutline"></ion-icon>
          <span>{{ team.location }}</span>
        </div>

        <div class="info-item">
          <ion-icon :icon="calendarOutline"></ion-icon>
          <span>{{ formatMeetingTimes(team.meetingTimes) }}</span>
        </div>
      </div>

      <p v-if="team.description" class="team-description">
        {{ truncateDescription(team.description) }}
      </p>

      <div class="team-status">
        <ion-badge v-if="isUserOwner" color="primary">Właściciel</ion-badge>
        <ion-badge v-else-if="isUserMember" color="secondary">Członek</ion-badge>
        <ion-badge v-else-if="isTeamFull" color="medium">Pełna</ion-badge>
        <ion-badge 
          v-if="isUserOwner && pendingRequestsCount > 0" 
          color="warning"
        >
          {{ pendingRequestsCount }} {{ pendingRequestsCount > 1 ? 'Próśb o dołączenie' : 'Prośba o dołączenie' }}
        </ion-badge>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonIcon,
  IonLabel,
  IonBadge
} from '@ionic/vue'
import {
  peopleOutline,
  gameControllerOutline,
  locationOutline,
  calendarOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useJoinRequests } from '@/composables/useJoinRequests'
import type { Team } from '@/types'
import { trashOutline } from 'ionicons/icons'
import { useTeams } from '@/composables/useTeams'
import { alertController, toastController } from '@ionic/vue'

// Props
interface Props {
  team: Team
  showNotifications?: boolean
  refreshTrigger?: number
}

const props = withDefaults(defineProps<Props>(), {
  showNotifications: true,
  refreshTrigger: 0
})

// Emits
defineEmits<{
  click: [team: Team]
}>()

// Composables
const { user } = useAuth()
const { getPendingRequestsCount } = useJoinRequests()
const { deleteTeam } = useTeams()

const pendingRequestsCount = ref(0)

// Computed
const isTeamFull = computed(() => {
  return props.team.currentMembers >= props.team.maxMembers
})

const isUserOwner = computed(() => {
  return user.value && props.team.ownerId === user.value.uid
})

const isUserMember = computed(() => {
  return user.value && props.team.members[user.value.uid] !== undefined
})

// Methods
const formatMeetingTimes = (times: string[]) => {
  if (!times || times.length === 0) return 'Do ustalenia'
  if (times.length === 1) return times[0]
  return `${times[0]} +${times.length - 1}`
}

const truncateDescription = (description: string) => {
  const maxLength = 100
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength) + '...'
}

const loadPendingRequestsCount = async () => {
  if (!props.showNotifications || !isUserOwner.value) {
    pendingRequestsCount.value = 0
    return
  }
  
  try {
    console.log('Loading pending requests count for team:', props.team.id)
    const count = await getPendingRequestsCount(props.team.id)
    pendingRequestsCount.value = count
    console.log('Pending requests count loaded:', count)
  } catch (error) {
    console.error('Error loading pending requests count:', error)
    pendingRequestsCount.value = 0
  }
}

const handleQuickDelete = async () => {
  const alert = await alertController.create({
    header: 'Usuń drużynę',
    message: `Czy na pewno chcesz usunąć drużynę "${props.team.name}"?`,
    buttons: [
      {
        text: 'Anuluj',
        role: 'cancel'
      },
      {
        text: 'Usuń',
        role: 'destructive',
        handler: async () => {
          try {
            await deleteTeam(props.team.id)
            
            const toast = await toastController.create({
              message: 'Drużyna została usunięta',
              duration: 2000,
              color: 'success'
            })
            await toast.present()
          } catch (error: any) {
            const toast = await toastController.create({
              message: error.message || 'Nie udało się usunąć drużyny',
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

// Watch for team changes
watch(() => props.team, async () => {
  if (isUserOwner.value) {
    await loadPendingRequestsCount()
  }
}, { immediate: true })

// Load pending requests count on mount
watch(() => props.refreshTrigger, async () => {
  console.log('Refresh trigger changed, reloading pending requests')
  if (isUserOwner.value) {
    await loadPendingRequestsCount()
  }
})

// Expose method to refresh count (useful when requests are processed)
defineExpose({
  refreshNotifications: loadPendingRequestsCount
})
</script>

<style scoped>
ion-card {
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

ion-card:hover {
  transform: translateY(-2px);
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.info-item ion-icon {
  color: var(--ion-color-primary);
  min-width: 20px;
}

.team-description {
  color: var(--ion-color-medium);
  margin: 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.team-status {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

ion-chip {
  margin: 0;
}

.delete-button {
  margin-left: auto;
}

.card-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>