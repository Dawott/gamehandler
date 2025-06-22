<template>
  <ion-card @click="$emit('click', team)" button>
    <ion-card-header>
      <ion-card-title>{{ team.name }}</ion-card-title>
      <ion-card-subtitle>
        <ion-chip :color="isTeamFull ? 'danger' : 'success'">
          <ion-icon :icon="peopleOutline"></ion-icon>
          <ion-label>{{ team.currentMembers }}/{{ team.maxMembers }}</ion-label>
        </ion-chip>
      </ion-card-subtitle>
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
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import type { Team } from '@/types'

// Props
interface Props {
  team: Team
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  click: [team: Team]
}>()

// Composables
const { user } = useAuth()

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
</style>