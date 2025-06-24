<template>
  <ion-page>
    <!-- Enhanced Header -->
    <ion-header :translucent="true" class="page-header">
      <ion-toolbar class="main-toolbar">
        <ion-title class="page-title">Znajdź Drużynę</ion-title>
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
          <h1 class="hero-title">Znajdź swoją drużynę</h1>
          <p class="hero-subtitle">Dołącz do społeczności graczy i znajdź idealnych partnerów do gry</p>
          
          <!-- Quick Stats -->
          <div class="stats-row animate-slide-up" style="animation-delay: 0.2s">
            <div class="stat-item">
              <span class="stat-number">{{ filteredTeams.length }}</span>
              <span class="stat-label">Dostępnych drużyn</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ availableTeamsCount }}</span>
              <span class="stat-label">Z wolnymi miejscami</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Filters Section -->
      <div class="search-section animate-slide-up" style="animation-delay: 0.3s">
        <div class="search-container">
          <!-- Search Bar -->
          <div class="search-bar-wrapper">
            <ion-searchbar
              v-model="searchQuery"
              placeholder="Szukaj drużyn..."
              @ionInput="handleSearch"
              class="custom-searchbar"
              search-icon="search-outline"
              clear-icon="close-outline"
            ></ion-searchbar>
          </div>

          <!-- Filter Toggle -->
          <ion-button
            fill="outline"
            @click="toggleFilters"
            class="filter-toggle-button"
            :class="{ 'active': showFilters }"
          >
            <ion-icon :icon="funnelOutline" slot="start" class="filter-icon"></ion-icon>
            Filtry
            <ion-badge v-if="activeFiltersCount > 0" color="primary" class="filter-count">
              {{ activeFiltersCount }}
            </ion-badge>
          </ion-button>
        </div>

        <!-- Filters Panel -->
        <div 
          v-if="showFilters" 
          class="filters-panel animate-expand"
        >
          <ion-card class="filters-card">
            <ion-card-content class="filters-content">
              <div class="filters-grid">
                <!-- Game Filter -->
                <div class="filter-group">
                  <ion-label class="filter-label">
                    <ion-icon :icon="gameControllerOutline" class="filter-label-icon"></ion-icon>
                    Gra/System
                  </ion-label>
                  <ion-select 
                    v-model="filters.game" 
                    placeholder="Wszystkie gry"
                    @ionChange="updateFilters({ game: $event.detail.value })"
                    class="filter-select"
                  >
                    <ion-select-option value="">Wszystkie gry</ion-select-option>
                    <ion-select-option 
                      v-for="game in GAME_SYSTEMS" 
                      :key="game" 
                      :value="game"
                    >
                      {{ game }}
                    </ion-select-option>
                  </ion-select>
                </div>

                <!-- Location Filter -->
                <div class="filter-group">
                  <ion-label class="filter-label">
                    <ion-icon :icon="locationOutline" class="filter-label-icon"></ion-icon>
                    Lokacja
                  </ion-label>
                  <ion-select 
                    v-model="filters.location" 
                    placeholder="Wszystkie lokacje"
                    @ionChange="updateFilters({ location: $event.detail.value })"
                    class="filter-select"
                  >
                    <ion-select-option value="">Wszystkie lokacje</ion-select-option>
                    <ion-select-option 
                      v-for="location in LOCATIONS" 
                      :key="location" 
                      :value="location"
                    >
                      {{ location }}
                    </ion-select-option>
                  </ion-select>
                </div>

                <!-- Available Only Toggle -->
                <div class="filter-group toggle-group">
                  <ion-label class="filter-label">
                    <ion-icon :icon="peopleOutline" class="filter-label-icon"></ion-icon>
                    Tylko z wolnymi miejscami
                  </ion-label>
                  <ion-toggle
                    v-model="filters.showOnlyAvailable"
                    @ionChange="updateFilters({ showOnlyAvailable: $event.detail.checked })"
                    class="filter-toggle"
                  ></ion-toggle>
                </div>
              </div>

              <!-- Filter Actions -->
              <div class="filter-actions">
                <ion-button 
                  fill="clear" 
                  size="small"
                  @click="clearAllFilters"
                  :disabled="activeFiltersCount === 0"
                  class="clear-filters-button"
                >
                  <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                  Wyczyść filtry
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <!-- View Options -->
      <div v-if="!loading && filteredTeams.length > 0" class="view-options animate-fade-in" style="animation-delay: 0.4s">
        <div class="view-controls">
          <ion-segment v-model="viewMode" class="view-segment">
            <ion-segment-button value="grid">
              <ion-icon :icon="gridOutline"></ion-icon>
              <ion-label>Siatka</ion-label>
            </ion-segment-button>
            <ion-segment-button value="list">
              <ion-icon :icon="listOutline"></ion-icon>
              <ion-label>Lista</ion-label>
            </ion-segment-button>
          </ion-segment>

          <ion-select 
            v-model="sortBy"
            placeholder="Sortuj"
            @ionChange="handleSort"
            class="sort-select"
          >
            <ion-select-option value="newest">Najnowsze</ion-select-option>
            <ion-select-option value="oldest">Najstarsze</ion-select-option>
            <ion-select-option value="name">Nazwa A-Z</ion-select-option>
            <ion-select-option value="members">Najwięcej członków</ion-select-option>
            <ion-select-option value="available">Dostępne miejsca</ion-select-option>
          </ion-select>
        </div>

        <div class="results-info">
          <span class="results-count">{{ filteredTeams.length }} drużyn</span>
        </div>
      </div>

      <!-- Loading State with Skeletons -->
      <div v-if="loading" class="loading-section animate-fade-in">
        <div class="loading-header">
          <ion-spinner class="loading-spinner"></ion-spinner>
          <p class="loading-text">Ładuję drużyny...</p>
        </div>
        <div class="skeleton-grid">
          <div 
            v-for="n in 6" 
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
            v-for="(team, index) in sortedTeams"
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
            <ion-icon :icon="searchOutline" class="empty-icon"></ion-icon>
          </div>
          <div class="empty-particles">
            <div class="particle" v-for="n in 6" :key="n"></div>
          </div>
        </div>
        
        <div class="empty-content">
          <h3 class="empty-title">
            {{ hasActiveFilters ? 'Brak wyników' : 'Brak drużyn' }}
          </h3>
          <p class="empty-message">
            {{ getEmptyMessage() }}
          </p>
          
          <div class="empty-actions">
            <ion-button 
              v-if="hasActiveFilters"
              fill="outline" 
              @click="clearAllFilters"
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
          </div>
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
      @join-requested="handleJoinRequested"
      @request-processed="handleRequestProcessed"
      @team-deleted="handleTeamDeleted"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonBadge,
  toastController
} from '@ionic/vue'
import { 
  peopleOutline, 
  addOutline, 
  funnelOutline,
  gameControllerOutline,
  locationOutline,
  refreshOutline,
  gridOutline,
  listOutline,
  searchOutline
} from 'ionicons/icons'
import { useTeams } from '@/composables/useTeams'
import { useAuth } from '@/composables/useAuth'
import { GAME_SYSTEMS, LOCATIONS } from '@/data/constants'
import TeamCard from '@/components/TeamCard.vue'
import CreateTeamModal from '@/components/CreateTeamModal.vue'
import TeamDetailsModal from '@/components/TeamDetailsModal.vue'
import type { Team } from '@/types'

const router = useRouter()
const { 
  filteredTeams, 
  loading, 
  filters,
  loadTeams, 
  subscribeToTeams,
  updateFilters,
  clearFilters,
  getUserTeams
} = useTeams()
const { user } = useAuth()

// UI State
const showFilters = ref(false)
const showCreateModal = ref(false)
const showDetailsModal = ref(false)
const selectedTeam = ref<Team | null>(null)
const refreshTrigger = ref(0)
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('newest')

// Unsubscribe function
let unsubscribe: (() => void) | null = null

// Computed
const availableTeamsCount = computed(() => {
  return filteredTeams.value.filter(team => team.currentMembers < team.maxMembers).length
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.game) count++
  if (filters.value.location) count++
  if (filters.value.showOnlyAvailable) count++
  if (searchQuery.value.trim()) count++
  return count
})

const hasActiveFilters = computed(() => {
  return activeFiltersCount.value > 0
})

const sortedTeams = computed(() => {
  const teams = [...filteredTeams.value]
  
  // Apply search filter
  let filtered = teams
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = teams.filter(team => 
      team.name.toLowerCase().includes(query) ||
      team.game.toLowerCase().includes(query) ||
      team.location.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    )
  }
  
  // Apply sorting
  switch (sortBy.value) {
    case 'newest':
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'oldest':
      return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    case 'name':
      return filtered.sort((a, b) => a.name.localeCompare(b.name))
    case 'members':
      return filtered.sort((a, b) => b.currentMembers - a.currentMembers)
    case 'available':
      return filtered.sort((a, b) => (b.maxMembers - b.currentMembers) - (a.maxMembers - a.currentMembers))
    default:
      return filtered
  }
})

// Methods
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const handleSearch = (event: any) => {
  searchQuery.value = event.detail.value
}

const handleSort = (event: any) => {
  sortBy.value = event.detail.value
}

const clearAllFilters = () => {
  clearFilters()
  searchQuery.value = ''
}

const getEmptyMessage = () => {
  if (hasActiveFilters.value) {
    return 'Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtry'
  }
  return 'Bądź pierwszy i stwórz drużynę dla swojej społeczności!'
}

const handleRefresh = async (event: any) => {
  await loadTeams()
  refreshTrigger.value++
  event.target.complete()
}

const openTeamDetails = (team: Team) => {
  selectedTeam.value = team
  showDetailsModal.value = true
}

const handleTeamCreated = () => {
  showCreateModal.value = false
  refreshTrigger.value++
}

const handleJoinRequested = () => {
  showDetailsModal.value = false
  refreshTrigger.value++
}

const handleRequestProcessed = () => {
  refreshTrigger.value++
}

const handleTeamDeleted = async () => {
  try {
    showDetailsModal.value = false
    selectedTeam.value = null
    
    if (user.value?.uid) {
      await getUserTeams() 
    }

    await loadTeams()
    refreshTrigger.value++

    const toast = await toastController.create({
      message: 'Drużyna została pomyślnie usunięta',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    })
    await toast.present()
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

// Lifecycle
onMounted(async () => {
  await loadTeams()
  unsubscribe = subscribeToTeams()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
/* Page Layout */
.page-header {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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

@keyframes expand {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
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

.animate-expand {
  animation: expand 0.3s ease-out;
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
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 50%, var(--ion-color-secondary) 100%);
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
  gap: 2rem;
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
  font-size: 0.9rem;
  text-align: center;
}

/* Search Section */
.search-section {
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.search-container {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.search-bar-wrapper {
  flex: 1;
}

.custom-searchbar {
  --background: white;
  --border-radius: 12px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --color: var(--ion-color-dark);
  --placeholder-color: var(--ion-color-medium);
  --icon-color: var(--ion-color-primary);
}

.filter-toggle-button {
  --border-radius: 12px;
  --border-color: var(--ion-color-primary);
  --color: var(--ion-color-primary);
  height: 56px;
  min-width: 100px;
  position: relative;
}

.filter-toggle-button.active {
  --background: var(--ion-color-primary);
  --color: white;
}

.filter-icon {
  transition: transform 0.2s ease;
}

.filter-toggle-button.active .filter-icon {
  transform: scale(1.1);
}

.filter-count {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  font-size: 0.7rem;
}

/* Filters Panel */
.filters-panel {
  overflow: hidden;
}

.filters-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.filters-content {
  padding: 1.5rem;
}

.filters-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toggle-group {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  font-size: 0.9rem;
}

.filter-label-icon {
  color: var(--ion-color-primary);
  font-size: 1rem;
}

.filter-select {
  --padding-start: 12px;
  --padding-end: 12px;
  --border-radius: 8px;
  --background: var(--ion-color-light);
}

.filter-toggle {
  --handle-background: white;
  --background: var(--ion-color-medium);
  --background-checked: var(--ion-color-primary);
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--ion-color-light-shade);
}

.clear-filters-button {
  --color: var(--ion-color-medium);
}

.clear-filters-button:not([disabled]) {
  --color: var(--ion-color-primary);
}

/* View Options */
.view-options {
  padding: 0 1.5rem 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-segment {
  --background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sort-select {
  min-width: 140px;
  --padding-start: 12px;
  --padding-end: 12px;
  --border-radius: 8px;
  --background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-info {
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
  transition: all 0.3s ease;
}

.teams-grid.grid-view {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.teams-grid.list-view {
  grid-template-columns: 1fr;
  max-width: 800px;
  margin: 0 auto;
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
  background: linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-primary-shade));
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
  background: var(--ion-color-primary);
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
  color: var(--ion-color-primary);
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
  --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
}

/* Floating Action Button */
.create-fab {
  margin: 1rem;
}

.fab-button {
  --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
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
  }
  
  .search-container {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-toggle-button {
    width: 100%;
  }
  
  .view-options {
    flex-direction: column;
    align-items: stretch;
  }
  
  .view-controls {
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
    flex-direction: column;
    width: 100%;
  }
  
  .empty-action-button {
    width: 100%;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .skeleton-card {
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
  
  .filters-card {
    background: var(--ion-color-dark-tint);
  }
}
</style>