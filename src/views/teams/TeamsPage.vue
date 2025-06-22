<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Znajdź Drużynę</ion-title>
        <template #end>
          <ion-button 
            fill="clear" 
            @click="showCreateModal = true"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </template>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Filters -->
      <div class="filters-section">
        <ion-segment scrollable>
          <ion-segment-button @click="showFilters = !showFilters">
            <ion-icon :icon="filterOutline"></ion-icon>
            <ion-label>Filtry</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-card v-if="showFilters">
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Gra/System</ion-label>
              <ion-select 
                v-model="filters.game" 
                placeholder="Wszystkie"
                @ionChange="updateFilters({ game: $event.detail.value })"
              >
                <ion-select-option value="">Wszystkie</ion-select-option>
                <ion-select-option 
                  v-for="game in GAME_SYSTEMS" 
                  :key="game" 
                  :value="game"
                >
                  {{ game }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Lokacja</ion-label>
              <ion-select 
                v-model="filters.location" 
                placeholder="Wszystkie"
                @ionChange="updateFilters({ location: $event.detail.value })"
              >
                <ion-select-option value="">Wszystkie</ion-select-option>
                <ion-select-option 
                  v-for="location in LOCATIONS" 
                  :key="location" 
                  :value="location"
                >
                  {{ location }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-checkbox 
                v-model="filters.showOnlyAvailable"
                @ionChange="updateFilters({ showOnlyAvailable: $event.detail.checked })"
              >
                <ion-label>Tylko z wolnymi miejscami</ion-label>
              </ion-checkbox>
            </ion-item>

            <ion-button 
              expand="block" 
              fill="clear" 
              @click="clearFilters"
            >
              Wyczyść filtry
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Ładuję drużyny...</p>
      </div>

      <!-- Teams List -->
      <div v-else-if="filteredTeams.length > 0" class="teams-list">
        <TeamCard
          v-for="team in filteredTeams"
          :key="team.id"
          :team="team"
          @click="openTeamDetails(team)"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <ion-icon :icon="peopleOutline" size="large"></ion-icon>
        <h3>Brak drużyn</h3>
        <p>{{ filters.game || filters.location || filters.showOnlyAvailable ? 'Nie znaleziono drużyn spełniających kryteria' : 'Bądź pierwszy i stwórz drużynę!' }}</p>
        <ion-button @click="showCreateModal = true">
          Stwórz drużynę
        </ion-button>
      </div>

      <!-- Refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    </ion-content>

    <!-- Create Team Modal -->
    <CreateTeamModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @success="handleTeamCreated"
    />

    <!-- Team Details Modal -->
    <TeamDetailsModal
      :is-open="showDetailsModal"
      :team="selectedTeam"
      @close="showDetailsModal = false"
      @join-requested="handleJoinRequested"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent
} from '@ionic/vue'
import { 
  peopleOutline, 
  addOutline, 
  filterOutline 
} from 'ionicons/icons'
import { useTeams } from '@/composables/useTeams'
import { GAME_SYSTEMS, LOCATIONS } from '@/data/constants'
import TeamCard from '../../components/TeamCard.vue'
import CreateTeamModal from '../../components/CreateTeamModal.vue'
import TeamDetailsModal from '../../components/TeamDetailsModal.vue'
import type { Team } from '@/types'

const router = useRouter()
const { 
  filteredTeams, 
  loading, 
  filters,
  loadTeams, 
  subscribeToTeams,
  updateFilters,
  clearFilters
} = useTeams()

// UI State
const showFilters = ref(false)
const showCreateModal = ref(false)
const showDetailsModal = ref(false)
const selectedTeam = ref<Team | null>(null)

// Unsubscribe function
let unsubscribe: (() => void) | null = null

// Methods
const handleRefresh = async (event: any) => {
  await loadTeams()
  event.target.complete()
}

const openTeamDetails = (team: Team) => {
  selectedTeam.value = team
  showDetailsModal.value = true
}

const handleTeamCreated = () => {
  showCreateModal.value = false
  // Teams will auto-update due to subscription
}

const handleJoinRequested = () => {
  // Could show a toast here
  showDetailsModal.value = false
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
.filters-section {
  padding: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 1rem;
}

.teams-list {
  padding: 0 1rem 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  height: 60vh;
}

.empty-state ion-icon {
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--ion-color-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
}

ion-checkbox {
  width: 100%;
}
</style>