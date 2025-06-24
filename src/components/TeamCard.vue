<template>
  <ion-card 
    @click="$emit('click', team)" 
    button 
    class="team-card"
    :class="{ 
      'team-card--full': isTeamFull,
      'team-card--owned': isUserOwner,
      'team-card--member': isUserMember
    }"
  >
    <!-- Animated background elements -->
    <div class="card-background">
      <div class="background-pattern"></div>
      <div class="gradient-overlay"></div>
    </div>

    <ion-card-header class="card-header">
      <div class="header-content">
        <div class="title-section">
          <ion-card-title class="team-title">{{ team.name }}</ion-card-title>
          
          <!-- Animated notification badge -->
          <div v-if="isUserOwner && pendingRequestsCount > 0" class="notification-wrapper">
            <ion-badge 
              color="warning"
              class="notification-badge animate-pulse"
            >
              <span class="notification-count">{{ pendingRequestsCount }}</span>
            </ion-badge>
          </div>
          
          <!-- delete button -->
          <ion-button
            v-if="isUserOwner"
            fill="clear"
            size="small"
            color="danger"
            @click.stop="handleQuickDelete"
            class="delete-button"
          >
            <ion-icon :icon="trashOutline" class="delete-icon"></ion-icon>
          </ion-button>
        </div>
        
        <!-- member count chip -->
        <div class="member-chip-wrapper">
          <ion-chip 
            :color="isTeamFull ? 'danger' : 'success'"
            class="member-chip"
          >
            <div class="chip-content">
              <ion-icon :icon="peopleOutline" class="people-icon"></ion-icon>
              <ion-label class="member-count">{{ team.currentMembers }}/{{ team.maxMembers }}</ion-label>
            </div>
          </ion-chip>
        </div>
      </div>
    </ion-card-header>

    <ion-card-content class="card-content">
      <!-- team info grid -->
      <div class="team-info-grid">
        <div class="info-item game-info">
          <div class="info-icon-wrapper">
            <ion-icon :icon="gameControllerOutline" class="info-icon"></ion-icon>
          </div>
          <div class="info-content">
            <span class="info-label">Gra</span>
            <span class="info-value">{{ team.game }}</span>
          </div>
        </div>
        
        <div class="info-item location-info">
          <div class="info-icon-wrapper">
            <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
          </div>
          <div class="info-content">
            <span class="info-label">Lokacja</span>
            <span class="info-value">{{ team.location }}</span>
          </div>
        </div>

        <div class="info-item schedule-info">
          <div class="info-icon-wrapper">
            <ion-icon :icon="calendarOutline" class="info-icon"></ion-icon>
          </div>
          <div class="info-content">
            <span class="info-label">Terminy</span>
            <span class="info-value">{{ formatMeetingTimes(team.meetingTimes) }}</span>
          </div>
        </div>
      </div>

      <!-- description -->
      <div v-if="team.description" class="description-section">
        <p class="team-description">
          {{ truncateDescription(team.description) }}
        </p>
      </div>

      <!-- status badges -->
      <div class="status-section">
        <div class="status-badges">
          <ion-badge 
            v-if="isUserOwner" 
            color="primary" 
            class="status-badge owner-badge"
          >
            <ion-icon :icon="ribbonOutline" class="badge-icon"></ion-icon>
            Właściciel
          </ion-badge>
          
          <ion-badge 
            v-else-if="isUserMember" 
            color="secondary" 
            class="status-badge member-badge"
          >
            <ion-icon :icon="checkmarkCircleOutline" class="badge-icon"></ion-icon>
            Członek
          </ion-badge>
          
          <ion-badge 
            v-else-if="isTeamFull" 
            color="medium" 
            class="status-badge full-badge"
          >
            <ion-icon :icon="lockClosedOutline" class="badge-icon"></ion-icon>
            Pełna
          </ion-badge>
        </div>
        
        <!-- Animated pending requests indicator -->
        <div 
          v-if="isUserOwner && pendingRequestsCount > 0" 
          class="requests-indicator"
        >
          <ion-badge color="warning" class="requests-badge animate-bounce">
            <ion-icon :icon="mailOutline" class="badge-icon"></ion-icon>
            {{ pendingRequestsCount }} {{ pendingRequestsCount > 1 ? 'próśb' : 'prośba' }}
          </ion-badge>
        </div>
      </div>
    </ion-card-content>

    <!-- Hover effect overlay -->
    <div class="hover-overlay"></div>
    
    <!-- Click ripple effect -->
    <div class="click-ripple"></div>
  </ion-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonIcon,
  IonLabel,
  IonBadge,
  IonButton
} from '@ionic/vue'
import {
  peopleOutline,
  gameControllerOutline,
  locationOutline,
  calendarOutline,
  trashOutline,
  ribbonOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  mailOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useJoinRequests } from '@/composables/useJoinRequests'
import { useTeams } from '@/composables/useTeams'
import { alertController, toastController } from '@ionic/vue'
import type { Team } from '@/types'

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
  const maxLength = 120
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength) + '...'
}

const loadPendingRequestsCount = async () => {
  if (!props.showNotifications || !isUserOwner.value) {
    pendingRequestsCount.value = 0
    return
  }
  
  try {
    const count = await getPendingRequestsCount(props.team.id)
    pendingRequestsCount.value = count
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

// Watch for changes
watch(() => props.team, async () => {
  if (isUserOwner.value) {
    await loadPendingRequestsCount()
  }
}, { immediate: true })

watch(() => props.refreshTrigger, async () => {
  if (isUserOwner.value) {
    await loadPendingRequestsCount()
  }
})

// Entrance animation on mount
onMounted(() => {
  // Add entrance animation class
  const cardElement = document.querySelector('.team-card')
  if (cardElement) {
    cardElement.classList.add('animate-entrance')
  }
})
</script>

<style scoped>
/* Base card styles */
.team-card {
  position: relative;
  margin: 1rem 0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, var(--ion-color-light) 0%, var(--ion-color-light-tint) 100%);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--ion-color-light-shade);
  transform: translateY(0);
}

/* Entrance animation */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-entrance {
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover effects */
.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.team-card:hover .hover-overlay {
  opacity: 1;
}

.team-card:hover .info-icon {
  transform: scale(1.1);
  color: var(--ion-color-primary-contrast);
}

.team-card:hover .people-icon {
  animation: bounce 0.6s ease-in-out;
}

/* Active/Press state */
.team-card:active {
  transform: translateY(-2px);
  transition: all 0.1s ease;
}

/* Card variants */
.team-card--owned {
  border: 2px solid var(--ion-color-primary-tint);
  background: linear-gradient(135deg, var(--ion-color-primary-tint) 0%, var(--ion-color-light) 100%);
}

.team-card--member {
  border: 2px solid var(--ion-color-secondary-tint);
  background: linear-gradient(135deg, var(--ion-color-secondary-tint) 0%, var(--ion-color-light) 100%);
}

.team-card--full {
  border: 2px solid var(--ion-color-medium);
  background: linear-gradient(135deg, var(--ion-color-medium-tint) 0%, var(--ion-color-light) 100%);
  opacity: 0.8;
}

/* Background elements */
.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.background-pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle at 50% 50%, var(--ion-color-primary-tint) 0%, transparent 70%);
  opacity: 0.1;
  transform: translate(20px, -20px);
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 0%, var(--ion-color-primary-tint) 100%);
  opacity: 0.02;
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--ion-color-primary-tint) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

/* Header styles */
.card-header {
  position: relative;
  z-index: 2;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title-section {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.team-title {
  flex: 1;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin: 0;
  line-height: 1.3;
}

/* Notification badge animations */
.notification-wrapper {
  position: relative;
}

.notification-badge {
  border-radius: 12px;
  font-weight: 600;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-count {
  font-size: 0.75rem;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Delete button */
.delete-button {
  --padding-start: 8px;
  --padding-end: 8px;
  height: 32px;
  width: 32px;
  margin: 0;
}

.delete-icon {
  transition: all 0.2s ease;
}

.delete-button:hover .delete-icon {
  transform: scale(1.2);
  color: var(--ion-color-danger);
}

/* Member chip */
.member-chip-wrapper {
  align-self: flex-start;
}

.member-chip {
  margin: 0;
  font-weight: 600;
  border-radius: 20px;
  padding: 0.5rem 1rem;
}

.chip-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.people-icon {
  font-size: 1rem;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

/* Content styles */
.card-content {
  position: relative;
  z-index: 2;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

/* Team info grid */
.team-info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(4px);
}

.info-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--ion-color-primary);
  color: white;
  transition: all 0.3s ease;
}

.info-icon {
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.95rem;
  color: var(--ion-color-dark);
  font-weight: 600;
}

/* Description */
.description-section {
  margin-bottom: 1.5rem;
}

.team-description {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  border-left: 4px solid var(--ion-color-primary);
}

/* Status section */
.status-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.status-badge:hover {
  transform: scale(1.05);
}

.badge-icon {
  font-size: 0.9rem;
}

.owner-badge {
  background: linear-gradient(45deg, var(--ion-color-primary), var(--ion-color-primary-shade));
  color: white;
}

.member-badge {
  background: linear-gradient(45deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
  color: white;
}

.full-badge {
  background: linear-gradient(45deg, var(--ion-color-medium), var(--ion-color-medium-shade));
  color: white;
}

/* Requests indicator */
.requests-indicator {
  align-self: flex-start;
}

.requests-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border-radius: 16px;
  background: linear-gradient(45deg, var(--ion-color-warning), var(--ion-color-warning-shade));
  color: white;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce {
  animation: bounceIn 0.6s ease-out;
}

/* Responsive design */
@media (max-width: 768px) {
  .card-header {
    padding: 1.25rem 1.25rem 0.75rem 1.25rem;
  }
  
  .card-content {
    padding: 0 1.25rem 1.25rem 1.25rem;
  }
  
  .team-title {
    font-size: 1.2rem;
  }
  
  .info-item {
    padding: 0.5rem;
  }
  
  .info-icon-wrapper {
    width: 36px;
    height: 36px;
  }
  
  .info-icon {
    font-size: 1.1rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .team-card {
    background: linear-gradient(135deg, var(--ion-color-dark-tint) 0%, var(--ion-color-dark) 100%);
    border-color: var(--ion-color-dark-shade);
  }
  
  .info-item {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .info-item:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .team-description {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .team-title {
    color: var(--ion-color-light);
  }
  
  .info-value {
    color: var(--ion-color-light);
  }
}
</style>