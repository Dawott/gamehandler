<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Moje Drużyny</ion-title>
        
          <ion-button 
            fill="clear" 
            @click="showCreateModal = true"
            slot="end"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Ładuję twoje drużyny...</p>
      </div>

      <!-- User Teams List -->
      <div v-else-if="userTeams.length > 0" class="teams-list">
        <TeamCard
          v-for="team in userTeams"
          :key="team.id"
          :team="team"
          :refresh-trigger="refreshTrigger"
          @click="openTeamDetails(team)"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <ion-icon :icon="peopleCircleOutline" size="large"></ion-icon>
        <h3>Brak drużyn</h3>
        <p>Nie należysz jeszcze do żadnej drużyny. Stwórz swoją pierwszą drużynę lub przeglądaj dostępne drużyny!</p>
        
        <div class="empty-actions">
          <ion-button @click="showCreateModal = true" expand="block">
            <ion-icon slot="start" :icon="addOutline"></ion-icon>
            Stwórz drużynę
          </ion-button>
          
          <ion-button @click="goToTeams" expand="block" fill="outline">
            <ion-icon slot="start" :icon="searchOutline"></ion-icon>
            Przeglądaj drużyny
          </ion-button>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error && !loading" class="error-state">
        <ion-icon :icon="alertCircleOutline" size="large" color="danger"></ion-icon>
        <h3>Błąd ładowania</h3>
        <p>{{ error }}</p>
        <ion-button @click="loadUserTeams" expand="block" fill="outline">
          Spróbuj ponownie
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
      @request-processed="handleRequestProcessed"
      @team-deleted="handleTeamDeleted"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
  toastController
} from '@ionic/vue'
import { peopleCircleOutline, addOutline, searchOutline, alertCircleOutline } from 'ionicons/icons'
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

// Methods
const loadUserTeams = async () => {
  console.log('LoadUserTeams called, user:', user.value?.uid) // Debug log
  if (user.value) {
    try {
      const teams = await getUserTeams(user.value.uid)
      userTeams.value = teams
      console.log('Teams loaded in MyTeamsPage:', teams) // Debug log
    } catch (err) {
      console.error('Error in loadUserTeams:', err)
    }
  } else {
    console.log('No user found, clearing teams') // Debug log
    userTeams.value = []
  }
}

const handleRefresh = async (event: any) => {
  await loadUserTeams()
  refreshTrigger.value++
  event.target.complete()
}

const openTeamDetails = (team: Team) => {
  selectedTeam.value = team
  showDetailsModal.value = true
}

const goToTeams = () => {
  router.push('/tabs/teams')
}

const handleTeamCreated = async () => {
  showCreateModal.value = false
  // Reload user teams to show the newly created team
  await loadUserTeams()
  refreshTrigger.value++
}

const handleRequestProcessed = async () => {
  console.log('Request processed, refreshing data...')
  // Refresh team data to update member counts
  await loadUserTeams()
  refreshTrigger.value++
  console.log('Refresh trigger incremented to:', refreshTrigger.value)
}

const handleTeamDeleted = async () => {
  try {
    console.log('Team deleted event received, starting cleanup...')
    
    // 1. Close any open modals immediately
    showDetailsModal.value = false
    selectedTeam.value = null
 
    
    // 3. Refresh team data from database
    if (user.value?.uid) {
      console.log('Reloading user teams after deletion...')
      await loadUserTeams() 
    }

    // 5. Trigger component refresh for child components
    refreshTrigger.value++
    console.log('Refresh trigger incremented to:', refreshTrigger.value)
    
    // 6. Optional: Show success message to user
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
    
    // Show error message to user
    const toast = await toastController.create({
      message: 'Wystąpił błąd podczas odświeżania danych',
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    })
    await toast.present()
    
    // Still close modal even if refresh fails
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
  console.log('MyTeamsPage mounted, user:', user.value?.uid) // Debug log
  if (user.value?.uid) {
    await loadUserTeams()
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 1rem;
}

.teams-list {
  padding: 1rem;
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
  max-width: 300px;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 280px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  height: 60vh;
}

.error-state ion-icon {
  margin-bottom: 1rem;
}

.error-state h3 {
  color: var(--ion-color-danger);
  margin-bottom: 0.5rem;
}

.error-state p {
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
}
</style>