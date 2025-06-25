<template>
  <ion-page>
    <!-- Enhanced Header -->
    <ion-header :translucent="true" class="page-header">
      <ion-toolbar class="main-toolbar">
        <ion-title class="page-title">Moje Drużyny</ion-title>
        <ion-button 
          fill="clear" 
          @click="showCreateModal = true"
          slot="end"
          class="create-button"
        >
          <ion-icon :icon="addOutline" class="create-icon"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-content">
      <!-- Hero Section -->
      <div class="hero-section animate-fade-in">
        <div class="hero-background">
          <div class="hero-gradient"></div>
          <div class="hero-pattern"></div>
        </div>
        
        <div class="hero-content">
          <h1 class="hero-title">Twoje drużyny</h1>
          <p class="hero-subtitle">Zarządzaj swoimi drużynami i śledź aktywność</p>
          
          <!-- User Stats -->
          <div class="stats-row animate-slide-up" style="animation-delay: 0.2s">
            <div class="stat-item">
              <span class="stat-number">{{ userTeams.length }}</span>
              <span class="stat-label">Wszystkich drużyn</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ ownedTeamsCount }}</span>
              <span class="stat-label">Drużyn właściciela</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ memberTeamsCount }}</span>
              <span class="stat-label">Drużyn członka</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Section -->
      <div class="quick-actions-section animate-slide-up" style="animation-delay: 0.3s">
        <div class="quick-actions-container">
          <h3 class="section-title">Szybkie akcje</h3>
          <div class="actions-grid">
            <ion-button 
              fill="outline" 
              @click="showCreateModal = true"
              class="action-card create-action"
            >
              <div class="action-content">
                <ion-icon :icon="addCircleOutline" class="action-icon"></ion-icon>
                <span class="action-label">Stwórz drużynę</span>
              </div>
            </ion-button>
            
            <ion-button 
              fill="outline" 
              @click="goToTeams"
              class="action-card browse-action"
            >
              <div class="action-content">
                <ion-icon :icon="searchOutline" class="action-icon"></ion-icon>
                <span class="action-label">Przeglądaj drużyny</span>
              </div>
            </ion-button>
            
            <ion-button 
              v-if="pendingRequestsCount > 0"
              fill="outline" 
              @click="showPendingRequests"
              class="action-card requests-action"
            >
              <div class="action-content">
                <ion-icon :icon="mailOutline" class="action-icon"></ion-icon>
                <span class="action-label">{{ pendingRequestsCount }} próśb</span>
                <ion-badge color="warning" class="request-badge">{{ pendingRequestsCount }}</ion-badge>
              </div>
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Search & View Options -->
      <div 
        v-if="!loading && userTeams.length > 0" 
        class="controls-section animate-slide-up" 
        style="animation-delay: 0.4s"
      >
        <div class="controls-container">
          <!-- Search Bar -->
          <div class="search-wrapper">
            <ion-searchbar
              v-model="searchQuery"
              placeholder="Szukaj w moich drużynach..."
              @ionInput="handleSearch"
              class="custom-searchbar"
              search-icon="search-outline"
              clear-icon="close-outline"
            ></ion-searchbar>
          </div>

          <!-- Filter & View Options -->
          <div class="view-options">
            <ion-segment v-model="filterBy" class="view-segment">
              <ion-segment-button value="all">
                <ion-label>Wszystkie</ion-label>
              </ion-segment-button>
              <ion-segment-button value="owned">
                <ion-label>Właściciel</ion-label>
              </ion-segment-button>
              <ion-segment-button value="member">
                <ion-label>Członek</ion-label>
              </ion-segment-button>
            </ion-segment>
            </div>
            <div class="view-options">
            <ion-segment v-model="viewMode" class="view-segment">
              <ion-segment-button value="grid">
                <ion-icon :icon="gridOutline"></ion-icon>
              </ion-segment-button>
              <ion-segment-button value="list">
                <ion-icon :icon="listOutline"></ion-icon>
              </ion-segment-button>
            </ion-segment>
          </div>

          <div class="results-info">
            <span class="results-count">Drużyn: {{ filteredTeams.length }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State with Skeletons -->
      <div v-if="loading" class="loading-section animate-fade-in">
        <div class="loading-header">
          <ion-spinner class="loading-spinner"></ion-spinner>
          <p class="loading-text">Ładuję twoje drużyny...</p>
        </div>
        <div class="skeleton-grid">
          <div 
            v-for="n in 4" 
            :key="n" 
            class="skeleton-card animate-pulse"
            :style="{ animationDelay: (n * 0.1) + 's' }"
          >
            <div class="skeleton-header">
              <div class="skeleton-title"></div>
              <div class="skeleton-badge"></div>
            </div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
            </div>
            <div class="skeleton-footer">
              <div class="skeleton-button"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Teams Grid/List -->
      <div 
        v-else-if="filteredTeams.length > 0" 
        class="teams-container animate-fade-in"
        style="animation-delay: 0.5s"
      >
        <div 
          class="teams-grid"
          :class="{
            'grid-view': viewMode === 'grid',
            'list-view': viewMode === 'list'
          }"
        >
          <div
            v-for="(team, index) in filteredTeams"
            :key="team.id"
            class="team-item animate-scale-in"
            :style="{ animationDelay: (0.1 + index * 0.05) + 's' }"
          >
            <TeamCard
              :team="team"
              :refresh-trigger="refreshTrigger"
              @click="openTeamDetails(team)"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state animate-fade-in" style="animation-delay: 0.3s">
        <div class="empty-illustration">
          <div class="empty-icon-wrapper">
            <ion-icon :icon="peopleCircleOutline" class="empty-icon"></ion-icon>
          </div>
          <div class="empty-particles">
            <div class="particle" v-for="n in 6" :key="n"></div>
          </div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">
            {{ getEmptyTitle() }}
          </h3>
          <p class="empty-message">
            {{ getEmptyMessage() }}
          </p>
          
          <div class="empty-actions">
            <ion-button 
              v-if="hasSearchOrFilter"
              fill="outline" 
              @click="clearSearchAndFilters"
              class="empty-action-button"
            >
              <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
              Wyczyść filtry
            </ion-button>
            
            <ion-button 
              @click="showCreateModal = true"
              class="empty-action-button primary"
            >
              <ion-icon slot="start" :icon="addOutline"></ion-icon>
              Stwórz drużynę
            </ion-button>
            
            <ion-button 
              fill="outline"
              @click="goToTeams"
              class="empty-action-button"
            >
              <ion-icon slot="start" :icon="searchOutline"></ion-icon>
              Przeglądaj drużyny
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error && !loading" class="error-state animate-fade-in">
        <div class="error-illustration">
          <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
        </div>
        <div class="error-content">
          <h3 class="error-title">Błąd ładowania</h3>
          <p class="error-message">{{ error }}</p>
          <ion-button @click="loadUserTeams" fill="outline" class="retry-button">
            <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
            Spróbuj ponownie
          </ion-button>
        </div>
      </div>

      <!-- Floating Action Button -->
      <ion-fab 
        v-if="!loading && !showCreateModal" 
        slot="fixed" 
        vertical="bottom" 
        horizontal="end"
        class="create-fab animate-bounce-in"
        style="animation-delay: 0.8s"
      >
        <ion-fab-button 
          @click="showCreateModal = true"
          class="fab-button"
        >
          <ion-icon :icon="addOutline" class="fab-icon"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Pull to Refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)" class="custom-refresher">
        <ion-refresher-content
          pulling-icon="chevron-down-circle-outline"
          refreshing-spinner="circular"
          refreshing-text="Odświeżanie..."
        ></ion-refresher-content>
      </ion-refresher>
    </ion-content>

    <!-- Modals -->
    <CreateTeamModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @success="handleTeamCreated"
    />

    <TeamDetailsModal
      :is-open="showDetailsModal"
      :team="selectedTeam"
      @close="showDetailsModal = false"
      @request-processed="handleRequestProcessed"
      @team-deleted="handleTeamDeleted"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonFab,
  IonFabButton,
  IonBadge,
  toastController
} from '@ionic/vue'
import { 
  peopleCircleOutline, 
  addOutline, 
  searchOutline, 
  alertCircleOutline,
  refreshOutline,
  addCircleOutline,
  mailOutline,
  gridOutline,
  listOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useTeams } from '@/composables/useTeams'
import TeamCard from '@/components/TeamCard.vue'
import TeamDetailsModal from '@/components/TeamDetailsModal.vue'
import CreateTeamModal from '@/components/CreateTeamModal.vue'
import type { Team } from '@/types'

const router = useRouter()
const { user } = useAuth()
const { getUserTeams, loading, error } = useTeams()

// State
const userTeams = ref<Team[]>([])
const showDetailsModal = ref(false)
const showCreateModal = ref(false)
const selectedTeam = ref<Team | null>(null)
const refreshTrigger = ref(0)
const searchQuery = ref('')
const filterBy = ref<'all' | 'owned' | 'member'>('all')
const viewMode = ref<'grid' | 'list'>('grid')
const pendingRequestsCount = ref(0)

// Computed
const ownedTeamsCount = computed(() => {
  return userTeams.value.filter(team => team.ownerId === user.value?.uid).length
})

const memberTeamsCount = computed(() => {
  return userTeams.value.filter(team => 
    team.ownerId !== user.value?.uid && team.members[user.value?.uid || '']
  ).length
})

const filteredTeams = computed(() => {
  let teams = userTeams.value

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    teams = teams.filter(team => 
      team.name.toLowerCase().includes(query) ||
      team.game.toLowerCase().includes(query) ||
      team.location.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    )
  }

  // Apply role filter
  if (filterBy.value === 'owned') {
    teams = teams.filter(team => team.ownerId === user.value?.uid)
  } else if (filterBy.value === 'member') {
    teams = teams.filter(team => 
      team.ownerId !== user.value?.uid && team.members[user.value?.uid || '']
    )
  }

  // Sort by most recent
  return teams.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

const hasSearchOrFilter = computed(() => {
  return searchQuery.value.trim().length > 0 || filterBy.value !== 'all'
})

// Methods
const loadUserTeams = async () => {
  console.log('LoadUserTeams called, user:', user.value?.uid)
  if (user.value) {
    try {
      const teams = await getUserTeams(user.value.uid)
      userTeams.value = teams
      console.log('Teams loaded in MyTeamsPage:', teams)
      
      // Count pending requests for owned teams
      const totalPendingRequests = 0
      
      pendingRequestsCount.value = totalPendingRequests
    } catch (err) {
      console.error('Error in loadUserTeams:', err)
    }
  } else {
    console.log('No user found, clearing teams')
    userTeams.value = []
  }
}

const handleRefresh = async (event: any) => {
  await loadUserTeams()
  refreshTrigger.value++
  event.target.complete()
}

const handleSearch = (event: any) => {
  searchQuery.value = event.detail.value
}

const clearSearchAndFilters = () => {
  searchQuery.value = ''
  filterBy.value = 'all'
}

const openTeamDetails = (team: Team) => {
  selectedTeam.value = team
  showDetailsModal.value = true
}

const goToTeams = () => {
  router.push('/tabs/teams')
}

const showPendingRequests = () => {
  // This could open a modal showing all pending requests across teams
  console.log('Show pending requests modal')
}

const getEmptyTitle = () => {
  if (hasSearchOrFilter.value) {
    return 'Brak wyników'
  }
  return 'Brak drużyn'
}

const getEmptyMessage = () => {
  if (hasSearchOrFilter.value) {
    return 'Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtry'
  }
  return 'Nie należysz jeszcze do żadnej drużyny. Stwórz swoją pierwszą drużynę lub przeglądaj dostępne drużyny!'
}

const handleTeamCreated = async () => {
  showCreateModal.value = false
  await loadUserTeams()
  refreshTrigger.value++
}

const handleRequestProcessed = async () => {
  console.log('Request processed, refreshing data...')
  await loadUserTeams()
  refreshTrigger.value++
  console.log('Refresh trigger incremented to:', refreshTrigger.value)
}

const handleTeamDeleted = async () => {
  try {
    console.log('Team deleted event received, starting cleanup...')
    
    showDetailsModal.value = false
    selectedTeam.value = null
    
    if (user.value?.uid) {
      console.log('Reloading user teams after deletion...')
      await loadUserTeams() 
    }

    refreshTrigger.value++
    console.log('Refresh trigger incremented to:', refreshTrigger.value)
    
    const toast = await toastController.create({
      message: 'Drużyna została pomyślnie usunięta',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    })
    await toast.present()
    
    console.log('Team deletion cleanup completed successfully')
    
  } catch (error) {
    console.error('Error during team deletion cleanup:', error)
    
    const toast = await toastController.create({
      message: 'Wystąpił błąd podczas odświeżania danych',
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    })
    await toast.present()
    
    showDetailsModal.value = false
    selectedTeam.value = null
  }
}

watch(user, async (newUser, oldUser) => {
  console.log('User changed in MyTeamsPage:', { 
    old: oldUser?.uid, 
    new: newUser?.uid 
  }) 
  
  if (newUser?.uid) {
    await loadUserTeams()
  } else {
    userTeams.value = []
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  console.log('MyTeamsPage mounted, user:', user.value?.uid)
  if (user.value?.uid) {
    await loadUserTeams()
  }
})
</script>

<style scoped>
/* Use the same styles as TeamsPage but with some customizations */

/* Page Layout */
.page-header {
  background: linear-gradient(135deg, var(--ion-color-secondary) 0%, var(--ion-color-secondary-shade) 100%);
}

.main-toolbar {
  --background: transparent;
  --color: white;
  --border-color: transparent;
}

.page-title {
  font-weight: 600;
  font-size: 1.2rem;
}

.create-button {
  --color: white;
  --background-hover: rgba(255, 255, 255, 0.1);
}

.create-icon {
  font-size: 1.5rem;
  transition: transform 0.2s ease;
}

.create-button:hover .create-icon {
  transform: scale(1.1) rotate(90deg);
}

.page-content {
  --background: linear-gradient(180deg, var(--ion-color-light) 0%, var(--ion-color-light-tint) 100%);
}

/* Animation Keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
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
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Animation Classes */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
  animation-fill-mode: both;
}

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-scale-in {
  animation: scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-bounce-in {
  animation: bounceIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 2rem 1.5rem;
  margin: -1px -1px 0 -1px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--ion-color-secondary) 0%, var(--ion-color-secondary-shade) 50%, var(--ion-color-tertiary) 100%);
}

.hero-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.hero-title {
  color: white;
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.5;
  margin: 0 0 2rem 0;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-number {
  color: var(--ion-color-warning);
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stat-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  text-align: center;
}

/* Quick Actions Section */
.quick-actions-section {
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.quick-actions-container {
  max-width: 600px;
  margin: 0 auto;
}

.section-title {
  color: var(--ion-color-dark);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-align: center;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.action-card {
  --border-radius: 16px;
  --border-width: 2px;
  --border-color: var(--ion-color-light-shade);
  --background: white;
  --color: var(--ion-color-dark);
  height: 80px;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  --border-color: var(--ion-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.action-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

.action-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.create-action:hover .action-icon {
  color: var(--ion-color-success);
}

.browse-action:hover .action-icon {
  color: var(--ion-color-tertiary);
}

.requests-action {
  position: relative;
}

.requests-action:hover .action-icon {
  color: var(--ion-color-warning);
}

.request-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 20px;
  height: 20px;
  font-size: 0.7rem;
}

/* Controls Section */
.controls-section {
  padding: 0 1.5rem 1rem 1.5rem;
}

.controls-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-wrapper {
  width: 100%;
}

.custom-searchbar {
  --background: white;
  --border-radius: 12px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --color: var(--ion-color-dark);
  --placeholder-color: var(--ion-color-medium);
  --icon-color: var(--ion-color-secondary);
}

.view-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.filter-segment,
.view-segment {
  --background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-segment {
  flex: 1;
  max-width: 300px;
}

.view-segment {
  min-width: 100px;
}

.results-info {
  text-align: center;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.results-count {
  font-weight: 500;
}

/* Loading Section */
.loading-section {
  padding: 2rem 1.5rem;
}

.loading-header {
  text-align: center;
  margin-bottom: 2rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  margin-bottom: 1rem;
}

.loading-text {
  color: var(--ion-color-medium);
  font-size: 1rem;
  margin: 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.skeleton-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.skeleton-title {
  background: var(--ion-color-light);
  height: 20px;
  width: 60%;
  border-radius: 4px;
}

.skeleton-badge {
  background: var(--ion-color-light);
  height: 24px;
  width: 60px;
  border-radius: 12px;
}

.skeleton-content {
  margin-bottom: 1rem;
}

.skeleton-line {
  background: var(--ion-color-light);
  height: 14px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-line.short {
  width: 70%;
}

.skeleton-footer {
  display: flex;
  justify-content: center;
}

.skeleton-button {
  background: var(--ion-color-light);
  height: 36px;
  width: 120px;
  border-radius: 18px;
}

/* Teams Container */
.teams-container {
  padding: 0 1.5rem 2rem 1.5rem;
}

.teams-grid {
  display: grid;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.teams-grid.grid-view {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.teams-grid.list-view {
  grid-template-columns: 1fr;
  max-width: 800px;
}

.team-item {
  transition: all 0.2s ease;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  min-height: 50vh;
}

.empty-illustration {
  position: relative;
  margin-bottom: 2rem;
}

.empty-icon-wrapper {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, var(--ion-color-secondary-tint), var(--ion-color-secondary-shade));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  animation: float 3s ease-in-out infinite;
}

.empty-icon {
  font-size: 3rem;
  color: white;
}

.empty-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--ion-color-secondary);
  border-radius: 50%;
  animation: float 2s ease-in-out infinite;
}

.particle:nth-child(1) { top: -80px; left: -20px; animation-delay: 0s; }
.particle:nth-child(2) { top: -60px; right: -30px; animation-delay: 0.5s; }
.particle:nth-child(3) { bottom: -70px; left: -25px; animation-delay: 1s; }
.particle:nth-child(4) { bottom: -50px; right: -20px; animation-delay: 1.5s; }
.particle:nth-child(5) { top: 0; left: -100px; animation-delay: 0.25s; }
.particle:nth-child(6) { top: 0; right: -100px; animation-delay: 0.75s; }

.empty-content {
  max-width: 400px;
}

.empty-title {
  color: var(--ion-color-secondary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.empty-message {
  color: var(--ion-color-medium);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 2rem 0;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.empty-action-button {
  --border-radius: 24px;
  height: 48px;
  min-width: 160px;
}

.empty-action-button.primary {
  --background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  min-height: 40vh;
}

.error-illustration {
  margin-bottom: 2rem;
}

.error-icon {
  font-size: 4rem;
  color: var(--ion-color-danger);
}

.error-content {
  max-width: 400px;
}

.error-title {
  color: var(--ion-color-danger);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.error-message {
  color: var(--ion-color-medium);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 2rem 0;
}

.retry-button {
  --border-radius: 24px;
  height: 48px;
  min-width: 160px;
}

/* Floating Action Button */
.create-fab {
  margin: 1rem;
}

.fab-button {
  --background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
  --color: white;
  --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 64px;
  height: 64px;
}

.fab-icon {
  font-size: 1.8rem;
  transition: transform 0.2s ease;
}

.fab-button:hover .fab-icon {
  transform: scale(1.1) rotate(90deg);
}

/* Custom Refresher */
.custom-refresher {
  --background: transparent;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.8rem;
  }
  
  .stats-row {
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .stat-item {
    min-width: 80px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .view-options {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .teams-grid.grid-view {
    grid-template-columns: 1fr;
  }
  
  .empty-icon-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .empty-icon {
    font-size: 2.5rem;
  }
  
  .empty-actions {
    width: 100%;
  }
  
  .empty-action-button {
    width: 100%;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .skeleton-card,
  .action-card {
    background: var(--ion-color-dark-tint);
  }
  
  .skeleton-title,
  .skeleton-badge,
  .skeleton-line,
  .skeleton-button {
    background: var(--ion-color-dark-shade);
  }
  
  .custom-searchbar {
    --background: var(--ion-color-dark-tint);
    --color: var(--ion-color-light);
  }
}
</style>