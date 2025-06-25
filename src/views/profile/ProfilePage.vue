<template>
  <ion-page>
    <ion-header :translucent="true" class="header-enhanced">
      <ion-toolbar class="custom-toolbar">
        <div class="toolbar-background">
          <div class="gradient-bg"></div>
          <div class="pattern-overlay"></div>
        </div>
        
        <ion-title class="page-title animate-slide-down">
          <div class="title-content">
            <ion-icon :icon="personCircleOutline" class="title-icon"></ion-icon>
            <span>Profil</span>
          </div>
        </ion-title>
        
        <ion-button 
          slot="end"
          v-if="hasProfile && !isEditing"
          fill="clear" 
          @click="handleEditClick"
          class="edit-button animate-scale-in"
          style="animation-delay: 0.2s"
        >
          <ion-icon :icon="createOutline" class="edit-icon"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="enhanced-content">
      <!-- Animated Background -->
      <div class="content-background">
        <div class="bg-gradient"></div>
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="profileLoading" class="loading-container animate-fade-in">
        <div class="loading-content">
          <div class="loading-spinner">
            <ion-spinner class="custom-spinner"></ion-spinner>
          </div>
          <h3 class="loading-title">Ładuję profil...</h3>
          <p class="loading-subtitle">Przygotowuję twoje dane</p>
        </div>
      </div>

      <!-- Profile Form (Create/Edit) -->
      <div v-else-if="!hasProfile || isEditing" class="form-container animate-slide-up">
        <ProfileForm
          :initial-data="profile"
          :is-edit="isEditing"
          @success="handleProfileSuccess"
          @cancel="handleCancel"
        />
      </div>

      <!-- Profile Display -->
      <div v-else class="profile-container">
        <!-- Profile Header -->
        <div class="profile-header animate-slide-down">
          <div class="header-background">
            <div class="header-gradient"></div>
            <div class="header-pattern"></div>
          </div>
          
          <div class="header-content">
            <!-- Avatar Section -->
            <div class="avatar-section animate-scale-in" style="animation-delay: 0.1s">
              <div class="avatar-wrapper">
                <ion-avatar class="profile-avatar">
                  <img 
                    v-if="profile?.avatar" 
                    :src="getAvatarDisplaySrc(profile.avatar)" 
                    alt="Awatar użytkownika"
                    class="avatar-image"
                  />
                  <div v-else class="avatar-placeholder">
                    <ion-icon :icon="personOutline" class="placeholder-icon"></ion-icon>
                  </div>
                </ion-avatar>
                
                <!-- Status Ring -->
                <div class="avatar-ring animate-pulse"></div>
                
                <!-- Online Indicator -->
                <div class="online-indicator animate-bounce-in" style="animation-delay: 0.3s">
                  <ion-icon :icon="checkmarkCircleOutline" class="online-icon"></ion-icon>
                </div>
              </div>
            </div>

            <!-- User Info -->
            <div class="user-info animate-fade-in" style="animation-delay: 0.2s">
              <h1 class="user-name">{{ profile?.name }}</h1>
              <p class="user-email">{{ profile?.email }}</p>
              
              <!-- Quick Stats -->
              <div class="quick-stats animate-slide-in-right" style="animation-delay: 0.4s">
                <div class="stat-item">
                  <ion-icon :icon="peopleOutline" class="stat-icon"></ion-icon>
                  <span class="stat-value">{{ userTeams.length }}</span>
                  <span class="stat-label">{{ userTeams.length === 1 ? 'Drużyna' : 'Drużyn' }}</span>
                </div>
                
                <div class="stat-divider"></div>
                
                <div class="stat-item">
                  <ion-icon :icon="calendarOutline" class="stat-icon"></ion-icon>
                  <span class="stat-value">{{ formatJoinDate(profile?.createdAt) }}</span>
                  <span class="stat-label">Dołączył</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="cards-container">
          <!-- Basic Info Card -->
          <ion-card class="info-card animate-slide-up" style="animation-delay: 0.3s">
            <div class="card-background">
              <div class="card-gradient primary-gradient"></div>
              <div class="card-pattern"></div>
            </div>
            
            <ion-card-header class="enhanced-card-header">
              <ion-card-title class="card-title">
                <div class="title-wrapper">
                  <ion-icon :icon="informationCircleOutline" class="card-icon"></ion-icon>
                  <span>Podstawowe Informacje</span>
                </div>
              </ion-card-title>
            </ion-card-header>
            
            <ion-card-content class="enhanced-card-content">
              <div class="info-grid">
                <div class="info-item location-item animate-fade-in" style="animation-delay: 0.4s">
                  <div class="info-icon-wrapper location-gradient">
                    <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
                  </div>
                  <div class="info-details">
                    <p class="info-label">Lokacja</p>
                    <p class="info-value">{{ profile?.location }}</p>
                  </div>
                </div>
                
                <div class="info-item game-item animate-fade-in" style="animation-delay: 0.5s">
                  <div class="info-icon-wrapper game-gradient">
                    <ion-icon :icon="gameControllerOutline" class="info-icon"></ion-icon>
                  </div>
                  <div class="info-details">
                    <p class="info-label">Ulubiona Gra/System</p>
                    <p class="info-value">{{ profile?.favoriteGame }}</p>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Social Links Card -->
          <ion-card 
            v-if="hasSocialLinks" 
            class="info-card social-card animate-slide-up" 
            style="animation-delay: 0.4s"
          >
            <div class="card-background">
              <div class="card-gradient secondary-gradient"></div>
              <div class="card-pattern"></div>
            </div>
            
            <ion-card-header class="enhanced-card-header">
              <ion-card-title class="card-title">
                <div class="title-wrapper">
                  <ion-icon :icon="linkOutline" class="card-icon"></ion-icon>
                  <span>Linki do socjali</span>
                </div>
              </ion-card-title>
            </ion-card-header>
            
            <ion-card-content class="enhanced-card-content">
              <div class="social-grid">
                <div 
                  v-if="profile?.socials?.discord" 
                  class="social-item discord animate-slide-in-left" 
                  style="animation-delay: 0.5s"
                >
                  <div class="social-icon-wrapper discord-gradient">
                    <ion-icon :icon="logoDiscord" class="social-icon"></ion-icon>
                  </div>
                  <div class="social-details">
                    <p class="social-label">Discord</p>
                    <p class="social-value">{{ profile.socials.discord }}</p>
                  </div>
                </div>
                
                <div 
                  v-if="profile?.socials?.twitter" 
                  class="social-item twitter animate-slide-in-left" 
                  style="animation-delay: 0.6s"
                >
                  <div class="social-icon-wrapper twitter-gradient">
                    <ion-icon :icon="logoTwitter" class="social-icon"></ion-icon>
                  </div>
                  <div class="social-details">
                    <p class="social-label">X (Twitter)</p>
                    <p class="social-value">{{ profile.socials.twitter }}</p>
                  </div>
                </div>
                
                <div 
                  v-if="profile?.socials?.steam" 
                  class="social-item steam animate-slide-in-left" 
                  style="animation-delay: 0.7s"
                >
                  <div class="social-icon-wrapper steam-gradient">
                    <ion-icon :icon="gameControllerOutline" class="social-icon"></ion-icon>
                  </div>
                  <div class="social-details">
                    <p class="social-label">Steam</p>
                    <p class="social-value">{{ profile.socials.steam }}</p>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Teams Card -->
          <ion-card class="info-card teams-card animate-slide-up" style="animation-delay: 0.5s">
            <div class="card-background">
              <div class="card-gradient tertiary-gradient"></div>
              <div class="card-pattern"></div>
            </div>
            
            <ion-card-header class="enhanced-card-header">
              <ion-card-title class="card-title">
                <div class="title-wrapper">
                  <ion-icon :icon="peopleOutline" class="card-icon"></ion-icon>
                  <span>Moje drużyny</span>
                  <ion-badge 
                    v-if="userTeams.length > 0" 
                    :color="userTeams.length > 3 ? 'success' : 'primary'"
                    class="teams-count-badge animate-bounce-in"
                    style="animation-delay: 0.6s"
                  >
                    {{ userTeams.length }}
                  </ion-badge>
                </div>
              </ion-card-title>
            </ion-card-header>
            
            <ion-card-content class="enhanced-card-content">
              <!-- Loading Teams -->
              <div v-if="teamsLoading" class="teams-loading animate-pulse">
                <div class="loading-teams-content">
                  <ion-spinner class="teams-spinner"></ion-spinner>
                  <p class="loading-teams-text">Ładuję drużyny...</p>
                </div>
              </div>
              
              <!-- No Teams -->
              <div v-else-if="!userTeams.length" class="no-teams animate-fade-in">
                <div class="no-teams-content">
                  <ion-icon :icon="peopleCircleOutline" class="no-teams-icon"></ion-icon>
                  <h4 class="no-teams-title">Brak drużyn</h4>
                  <p class="no-teams-text">Odwiedź zakładkę z drużynami, by zapisać się do którejś</p>
                  
                  <div class="no-teams-actions">
                    <ion-button 
                      @click="navigateToTeams" 
                      fill="outline" 
                      class="action-button browse-button"
                    >
                      <ion-icon slot="start" :icon="searchOutline"></ion-icon>
                      Przeglądaj drużyny
                    </ion-button>
                  </div>
                </div>
              </div>
              
              <!-- Teams List -->
              <div v-else class="teams-list">
                <TeamCard
                  v-for="(team, index) in userTeams"
                  :key="team.id"
                  :team="team"
                  :refresh-trigger="refreshTrigger"
                  @click="openTeamDetails(team)"
                  class="team-card-item animate-slide-in-right"
                  :style="{ animationDelay: (0.6 + index * 0.1) + 's' }"
                />
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Action Section -->
        <div class="action-section animate-slide-up" style="animation-delay: 0.6s">
          <div class="action-background">
            <div class="action-gradient"></div>
          </div>
          
          <ion-button 
            expand="block" 
            color="danger" 
            @click="handleLogoutClick"
            :disabled="loading"
            class="logout-button enhanced-logout"
          >
            <template v-if="loading" #start>
              <ion-spinner class="logout-spinner"></ion-spinner>
            </template>
            <template v-else #start>
              <ion-icon :icon="logOutOutline" class="logout-icon"></ion-icon>
            </template>
            {{ loading ? 'Wylogowuję...' : 'Wyloguj' }}
            
            <!-- Button background effect -->
            <div class="button-ripple"></div>
          </ion-button>
        </div>
      </div>

      <!-- Team Details Modal -->
      <TeamDetailsModal
        :is-open="showDetailsModal"
        :team="selectedTeam"
        @close="showDetailsModal = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonAvatar,
  IonSpinner,
  IonBadge
} from '@ionic/vue'
import {
  personOutline,
  personCircleOutline,
  logOutOutline,
  createOutline,
  locationOutline,
  gameControllerOutline,
  logoDiscord,
  logoTwitter,
  informationCircleOutline,
  linkOutline,
  peopleOutline,
  peopleCircleOutline,
  checkmarkCircleOutline,
  calendarOutline,
  searchOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'
import { useTeams } from '@/composables/useTeams'
import ProfileForm from '@/components/ProfileForm.vue'
import TeamDetailsModal from '@/components/TeamDetailsModal.vue'
import TeamCard from '@/components/TeamCard.vue'
import type { Team } from '@/types'
import { getAvatarDisplaySrc, getDefaultAvatar, isUploadedAvatar } from '@/utils/avatars'

const router = useRouter()
const { user, loading, logout } = useAuth()
const { profile, loading: profileLoading, hasProfile, loadProfile, clearProfile } = useProfile()
const { getUserTeams, loading: teamsLoading } = useTeams()

const isEditing = ref(false)
const userTeams = ref<Team[]>([])
const showDetailsModal = ref(false)
const selectedTeam = ref<Team | null>(null)
const refreshTrigger = ref(0)

// Computed
const hasSocialLinks = computed(() => {
  const socials = profile.value?.socials
  return socials?.discord || socials?.twitter || socials?.steam
})

// Methods
const handleEditClick = () => {
  isEditing.value = true
  
  // Add a subtle animation to the edit button
  const editButton = document.querySelector('.edit-button')
  if (editButton) {
    editButton.classList.add('button-clicked')
    setTimeout(() => {
      editButton.classList.remove('button-clicked')
    }, 200)
  }
}

const handleLogoutClick = async () => {
  try {
    // Add loading animation
    const logoutButton = document.querySelector('.logout-button')
    if (logoutButton) {
      logoutButton.classList.add('logout-loading')
    }
    
    clearProfile()
    await logout()
    router.replace('/auth')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const handleProfileSuccess = async (savedProfile: any) => {
  console.log('Profile success handler called with:', savedProfile)
  
  // Force reload of profile from database to ensure consistency
  await nextTick()
  await loadProfile()
  
  // Set editing to false with smooth transition
  isEditing.value = false
  
  // Load teams if we now have a profile
  if (hasProfile.value) {
    await loadUserTeams()
  }
  
  console.log('Profile state after success:', { hasProfile: hasProfile.value, profile: profile.value })
}

const handleCancel = () => {
  isEditing.value = false
}

const loadUserTeams = async () => {
  if (user.value && hasProfile.value) {
    userTeams.value = await getUserTeams()
  }
}

const openTeamDetails = (team: Team) => {
  selectedTeam.value = team
  showDetailsModal.value = true
}

const navigateToTeams = () => {
  router.push('/tabs/teams')
}

const formatJoinDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    month: 'short',
    year: 'numeric'
  })
}

// Watch for user changes
watch(user, async (newUser) => {
  if (newUser) {
    console.log('User changed, loading profile for:', newUser.uid)
    await loadProfile()
  } else {
    clearProfile()
    userTeams.value = []
  }
}, { immediate: true })

// Watch for profile changes to load teams
watch(hasProfile, async (newHasProfile) => {
  console.log('hasProfile changed to:', newHasProfile)
  if (newHasProfile) {
    await loadUserTeams()
  }
})

// Load profile on mount
onMounted(async () => {
  console.log('ProfilePage mounted, user:', user.value?.uid)
  if (user.value) {
    await loadProfile()
    console.log('After loadProfile - hasProfile:', hasProfile.value, 'profile:', profile.value)
  }
})
</script>

<style scoped>
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
    transform: translateY(50px);
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
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

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
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

.animate-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-bounce-in {
  animation: bounceIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Header styles */
.header-enhanced {
  background: transparent;
}

.custom-toolbar {
  position: relative;
  background: transparent;
  --background: transparent;
  --color: white;
  overflow: hidden;
}

.toolbar-background {
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

.page-title {
  position: relative;
  z-index: 1;
  font-weight: 600;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.5rem;
}

.edit-button {
  position: relative;
  z-index: 1;
  --color: white;
  --background-hover: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.edit-button:hover {
  transform: scale(1.1);
}

.button-clicked {
  transform: scale(0.95) !important;
}

.edit-icon {
  font-size: 1.3rem;
  transition: transform 0.2s ease;
}

.edit-button:hover .edit-icon {
  transform: rotate(45deg);
}

/* Content styles */
.enhanced-content {
  --background: transparent;
  position: relative;
}

.content-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, 
    var(--ion-color-primary-tint) 0%, 
    var(--ion-color-light) 30%, 
    var(--ion-color-light-tint) 100%);
}

.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 30%;
  left: 20%;
  animation-delay: 4s;
}

/* Loading container */
.loading-container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.loading-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  margin-bottom: 1.5rem;
}

.custom-spinner {
  width: 48px;
  height: 48px;
  --color: var(--ion-color-primary);
}

.loading-title {
  color: var(--ion-color-primary);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.loading-subtitle {
  color: var(--ion-color-medium);
  margin: 0;
  font-size: 0.9rem;
}

/* Form and profile containers */
.form-container,
.profile-container {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

/* Enhanced Profile Header */
.profile-header {
  position: relative;
  margin: -1px -1rem 2rem -1rem;
  padding: 3rem 2rem 2rem 2rem;
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

.header-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    var(--ion-color-primary) 0%, 
    var(--ion-color-primary-shade) 50%, 
    var(--ion-color-secondary) 100%);
}

.header-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
}

.header-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

/* Avatar section */
.avatar-section {
  margin-bottom: 2rem;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  position: relative;
  z-index: 2;
}

.avatar-image {
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.placeholder-icon {
  font-size: 3rem;
  color: white;
}

.avatar-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  z-index: 1;
}

.online-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: var(--ion-color-success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  z-index: 3;
}

.online-icon {
  font-size: 1rem;
  color: white;
}

/* User info */
.user-info {
  color: white;
}

.user-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.user-email {
  font-size: 1rem;
  opacity: 0.8;
  margin: 0 0 1.5rem 0;
}

/* Quick stats */
.quick-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem 2rem;
  margin: 0 auto;
  max-width: 300px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--ion-color-warning);
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  align-self: center;
}

/* Cards container */
.cards-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Enhanced cards */
.info-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--ion-color-light-shade);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.card-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
}

.primary-gradient {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
}

.secondary-gradient {
  background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
}

.tertiary-gradient {
  background: linear-gradient(135deg, var(--ion-color-tertiary), var(--ion-color-tertiary-shade));
}

.card-pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  transform: translate(20px, -20px);
}

.enhanced-card-header {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.card-title {
  margin: 0;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.teams-count-badge {
  margin-left: auto;
  font-weight: 700;
}

.enhanced-card-content {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
}

/* Info grid */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid var(--ion-color-light-shade);
  transition: all 0.3s ease;
}

.info-item:hover {
  transform: translateX(8px);
  background: rgba(255, 255, 255, 1);
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

.location-gradient {
  background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
}

.game-gradient {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
}

.info-icon {
  font-size: 1.3rem;
  transition: transform 0.2s ease;
}

.info-item:hover .info-icon {
  transform: scale(1.2);
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

/* Social grid */
.social-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.social-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid var(--ion-color-light-shade);
  transition: all 0.3s ease;
}

.social-item:hover {
  transform: translateX(8px);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.social-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: white;
}

.discord-gradient {
  background: linear-gradient(135deg, #5865F2, #4752C4);
}

.twitter-gradient {
  background: linear-gradient(135deg, #1DA1F2, #0d8bd9);
}

.steam-gradient {
  background: linear-gradient(135deg, #1b2838, #2a475e);
}

.social-icon {
  font-size: 1.3rem;
}

.social-details {
  flex: 1;
}

.social-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.25rem 0;
}

.social-value {
  font-size: 1rem;
  color: var(--ion-color-dark);
  font-weight: 600;
  margin: 0;
}

/* Teams section */
.teams-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading-teams-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.teams-spinner {
  width: 32px;
  height: 32px;
}

.loading-teams-text {
  color: var(--ion-color-medium);
  margin: 0;
}

.no-teams {
  padding: 2rem;
  text-align: center;
}

.no-teams-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-teams-icon {
  font-size: 4rem;
  color: var(--ion-color-medium);
}

.no-teams-title {
  color: var(--ion-color-primary);
  margin: 0;
  font-weight: 600;
}

.no-teams-text {
  color: var(--ion-color-medium);
  margin: 0;
  max-width: 300px;
}

.no-teams-actions {
  margin-top: 1rem;
}

.browse-button {
  --border-radius: 16px;
  font-weight: 600;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-card-item {
  transition: all 0.3s ease;
}

/* Action section */
.action-section {
  position: relative;
  padding: 2rem;
  margin: 0 -1rem -1rem -1rem;
  overflow: hidden;
}

.action-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.action-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, var(--ion-color-light) 100%);
}

/* Enhanced logout button */
.enhanced-logout {
  position: relative;
  z-index: 1;
  --border-radius: 16px;
  height: 56px;
  font-weight: 600;
  font-size: 1rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.enhanced-logout:hover {
  transform: translateY(-2px);
  --box-shadow: 0 8px 16px rgba(244, 67, 54, 0.3);
}

.enhanced-logout:active {
  transform: translateY(0);
}

.logout-loading {
  --background: var(--ion-color-medium) !important;
  pointer-events: none;
}

.logout-icon,
.logout-spinner {
  font-size: 1.2rem;
  transition: transform 0.2s ease;
}

.enhanced-logout:hover .logout-icon {
  transform: scale(1.1);
}

.button-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.enhanced-logout:hover .button-ripple {
  width: 300px;
  height: 300px;
  animation: ripple 0.6s linear;
}

/* Responsive design */
@media (max-width: 768px) {
  .profile-container {
    padding: 0.5rem;
  }
  
  .profile-header {
    padding: 2rem 1rem;
  }
  
  .user-name {
    font-size: 1.8rem;
  }
  
  .profile-avatar {
    width: 100px;
    height: 100px;
  }
  
  .quick-stats {
    gap: 1rem;
    padding: 0.75rem 1rem;
  }
  
  .cards-container {
    gap: 1rem;
  }
  
  .info-item,
  .social-item {
    padding: 0.75rem;
  }
  
  .info-icon-wrapper,
  .social-icon-wrapper {
    width: 40px;
    height: 40px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bg-gradient {
    background: linear-gradient(180deg, 
      var(--ion-color-primary-tint) 0%, 
      var(--ion-color-dark) 30%, 
      var(--ion-color-dark-tint) 100%);
  }
  
  .loading-content {
    background: rgba(0, 0, 0, 0.8);
    color: var(--ion-color-light);
  }
  
  .enhanced-card-header {
    background: rgba(0, 0, 0, 0.6);
  }
  
  .enhanced-card-content {
    background: rgba(0, 0, 0, 0.4);
  }
  
  .info-item,
  .social-item {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .info-item:hover,
  .social-item:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .info-value,
  .social-value {
    color: var(--ion-color-light);
  }
  
  .no-teams-title {
    color: var(--ion-color-primary-tint);
  }
}
</style>