<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <!-- Enhanced Tab Bar with Floating Design -->
      <ion-tab-bar 
        slot="bottom" 
        class="custom-tab-bar animate-slide-up"
        :class="{ 'tab-bar-visible': isTabBarVisible }"
      >
        <!-- Background Elements -->
        <div class="tab-bar-background">
          <div class="gradient-bg"></div>
          <div class="blur-overlay"></div>
          <div class="pattern-overlay"></div>
        </div>

        <!-- Tab Buttons -->
        <ion-tab-button 
          tab="teams" 
          href="/tabs/teams"
          class="custom-tab-button animate-scale-in"
          :class="{ 'tab-active': activeTab === 'teams' }"
          @click="setActiveTab('teams')"
          style="animation-delay: 0.1s"
        >
          <div class="tab-content">
            <div class="icon-wrapper teams-icon">
              <ion-icon :icon="peopleOutline" class="tab-icon"></ion-icon>
              <div class="icon-ripple"></div>
            </div>
            <ion-label class="tab-label">Drużyny</ion-label>
          </div>
          <div class="tab-indicator"></div>
        </ion-tab-button>

        <ion-tab-button 
          tab="my-teams" 
          href="/tabs/my-teams"
          class="custom-tab-button animate-scale-in"
          :class="{ 'tab-active': activeTab === 'my-teams' }"
          @click="setActiveTab('my-teams')"
          style="animation-delay: 0.2s"
        >
          <div class="tab-content">
            <div class="icon-wrapper my-teams-icon">
              <ion-icon :icon="peopleCircleOutline" class="tab-icon"></ion-icon>
              <div class="icon-ripple"></div>
              <!-- Notification Badge -->
              <div v-if="myTeamsCount > 0" class="notification-badge animate-bounce-in">
                {{ myTeamsCount }}
              </div>
            </div>
            <ion-label class="tab-label">Moje Drużyny</ion-label>
          </div>
          <div class="tab-indicator"></div>
        </ion-tab-button>

        <ion-tab-button 
          tab="profile" 
          href="/tabs/profile"
          class="custom-tab-button animate-scale-in"
          :class="{ 'tab-active': activeTab === 'profile' }"
          @click="setActiveTab('profile')"
          style="animation-delay: 0.3s"
        >
          <div class="tab-content">
            <div class="icon-wrapper profile-icon">
              <ion-icon :icon="personOutline" class="tab-icon"></ion-icon>
              <div class="icon-ripple"></div>
              <!-- Profile Status Indicator -->
              <div v-if="hasCompleteProfile" class="status-indicator complete animate-pulse">
                <ion-icon :icon="checkmarkCircleOutline" class="status-icon"></ion-icon>
              </div>
            </div>
            <ion-label class="tab-label">Profil</ion-label>
          </div>
          <div class="tab-indicator"></div>
        </ion-tab-button>

        <!-- Floating Action Button -->
         <!--
        <div class="fab-container animate-scale-in" style="animation-delay: 0.4s">
          <ion-fab-button 
            class="create-team-fab"
            @click="showCreateModal = true"
            size="small"
          >
            <ion-icon :icon="addOutline" class="fab-icon"></ion-icon>
          </ion-fab-button>
        </div>-->
      </ion-tab-bar>
    </ion-tabs>

    <!-- Create Team Modal -->
    <CreateTeamModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @success="handleTeamCreated"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonFabButton,
  toastController
} from '@ionic/vue'
import { 
  peopleCircleOutline, 
  peopleOutline, 
  personOutline,
  addOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'
import { useTeams } from '@/composables/useTeams'
import CreateTeamModal from '@/components/CreateTeamModal.vue'

// Composables
const route = useRoute()
const { user } = useAuth()
const { profile, hasProfile, loadProfile } = useProfile()
const { getUserTeams } = useTeams()

// State
const activeTab = ref<string>('profile')
const isTabBarVisible = ref(false)
const showCreateModal = ref(false)
const myTeamsCount = ref(0)
const hasCompleteProfile = ref(false)

// Methods
const setActiveTab = (tab: string) => {
  activeTab.value = tab
  
  // Add a subtle haptic feedback animation
  const tabButton = document.querySelector(`.custom-tab-button[tab="${tab}"]`)
  if (tabButton) {
    tabButton.classList.add('tab-pressed')
    setTimeout(() => {
      tabButton.classList.remove('tab-pressed')
    }, 200)
  }
}

const updateActiveTab = () => {
  const currentPath = route.path
  if (currentPath.includes('/teams') && !currentPath.includes('/my-teams')) {
    activeTab.value = 'teams'
  } else if (currentPath.includes('/my-teams')) {
    activeTab.value = 'my-teams'
  } else if (currentPath.includes('/profile')) {
    activeTab.value = 'profile'
  }
}

const loadUserStats = async () => {
  if (!user.value) return

  try {
    // Load profile status
    await loadProfile()
    hasCompleteProfile.value = hasProfile.value

    // Load teams count
    const teams = await getUserTeams()
    myTeamsCount.value = teams.length
  } catch (error) {
    console.error('Error loading user stats:', error)
  }
}

const handleTeamCreated = async () => {
  showCreateModal.value = false
  
  // Refresh user stats
  await loadUserStats()
  
  const toast = await toastController.create({
    message: 'Drużyna utworzona pomyślnie!',
    duration: 2000,
    color: 'success',
    position: 'bottom'
  })
  await toast.present()
}

// Lifecycle
onMounted(async () => {
  // Show tab bar with entrance animation
  setTimeout(() => {
    isTabBarVisible.value = true
  }, 100)
  
  // Update active tab based on current route
  updateActiveTab()
  
  // Load user statistics
  if (user.value) {
    await loadUserStats()
  }
})

// Watch for route changes
watch(() => route.path, () => {
  updateActiveTab()
})

// Watch for user changes
watch(user, async (newUser) => {
  if (newUser) {
    await loadUserStats()
  } else {
    myTeamsCount.value = 0
    hasCompleteProfile.value = false
  }
})
</script>

<style scoped>
/* Animation keyframes */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes iconBounce {
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

/* Animation classes */
.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-bounce-in {
  animation: bounceIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Tab bar styles */
.custom-tab-bar {
  position: relative;
  height: 80px;
  background: transparent;
  border: none;
  margin: 0 1rem 1rem 1rem;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 20px 48px rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-bar-visible {
  transform: translateY(0);
  opacity: 1;
}

/* Background elements */
.tab-bar-background {
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
  background: linear-gradient(135deg, 
    var(--ion-color-light) 0%, 
    var(--ion-color-light-tint) 50%, 
    var(--ion-color-primary-tint) 100%);
}

.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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

/* Tab button styles */
.custom-tab-button {
  position: relative;
  height: 100%;
  background: transparent;
  border: none;
  flex-direction: column;
  gap: 0;
  overflow: visible;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.custom-tab-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.custom-tab-button:hover .tab-icon {
  transform: scale(1.2);
  animation: iconBounce 0.6s ease-in-out;
}

.custom-tab-button:hover .icon-ripple {
  animation: ripple 0.6s linear;
}

.tab-pressed {
  transform: scale(0.95);
}

.tab-pressed .tab-icon {
  transform: scale(1.1);
}

/* Tab content */
.tab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: relative;
  z-index: 2;
}

/* Icon wrapper */
.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.teams-icon {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
}

.my-teams-icon {
  background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
}

.profile-icon {
  background: linear-gradient(135deg, var(--ion-color-tertiary), var(--ion-color-tertiary-shade));
}

.tab-icon {
  font-size: 1.5rem;
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

/* Icon ripple effect */
.icon-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  z-index: 0;
}

/* Tab label */
.tab-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Active tab styles */
.tab-active .icon-wrapper {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tab-active .tab-label {
  color: var(--ion-color-primary);
  font-weight: 700;
}

.tab-active .tab-indicator {
  opacity: 1;
  transform: scaleX(1);
}

/* Tab indicator */
.tab-indicator {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 32px;
  height: 3px;
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-primary-shade));
  border-radius: 2px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Notification badge */
.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  background: linear-gradient(45deg, var(--ion-color-warning), var(--ion-color-warning-shade));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 3;
}

/* Status indicator */
.status-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  z-index: 3;
}

.status-indicator.complete {
  background: linear-gradient(45deg, var(--ion-color-success), var(--ion-color-success-shade));
}

.status-icon {
  font-size: 0.6rem;
  color: white;
}

/* Floating Action Button */
.fab-container {
  position: absolute;
  top: -28px;
  right: 20px;
  z-index: 10;
}

.create-team-fab {
  --background: linear-gradient(135deg, var(--ion-color-success), var(--ion-color-success-shade));
  --color: white;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 56px;
  height: 56px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-team-fab:hover {
  --background: linear-gradient(135deg, var(--ion-color-success-shade), var(--ion-color-success));
  transform: scale(1.1);
  --box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.create-team-fab:active {
  transform: scale(0.95);
}

.fab-icon {
  font-size: 1.5rem;
  transition: transform 0.2s ease;
}

.create-team-fab:hover .fab-icon {
  transform: rotate(90deg);
}

/* Responsive design */
@media (max-width: 768px) {
  .custom-tab-bar {
    margin: 0 0.5rem 0.5rem 0.5rem;
    height: 70px;
  }
  
  .icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  
  .tab-icon {
    font-size: 1.3rem;
  }
  
  .tab-label {
    font-size: 0.7rem;
  }
  
  .fab-container {
    right: 16px;
    top: -24px;
  }
  
  .create-team-fab {
    width: 48px;
    height: 48px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .gradient-bg {
    background: linear-gradient(135deg, 
      var(--ion-color-dark-tint) 0%, 
      var(--ion-color-dark) 50%, 
      var(--ion-color-primary-tint) 100%);
  }
  
  .tab-label {
    color: var(--ion-color-light);
  }
  
  .tab-active .tab-label {
    color: var(--ion-color-primary-tint);
  }
  
  .custom-tab-button:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}</style>