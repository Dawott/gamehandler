<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Moje Drużyny</ion-title>
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
          @click="openTeamDetails(team)"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <ion-icon :icon="peopleCircleOutline" size="large"></ion-icon>
        <h3>Brak drużyn</h3>
        <p>Nie należysz jeszcze do żadnej drużyny. Przeglądaj dostępne drużyny i dołącz do swojej pierwszej!</p>
        <ion-button @click="goToTeams">
          Przeglądaj drużyny
        </ion-button>
      </div>

      <!-- Refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    </ion-content>

    <!-- Team Details Modal -->
    <TeamDetailsModal
      :is-open="showDetailsModal"
      :team="selectedTeam"
      @close="showDetailsModal = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  IonRefresherContent
} from '@ionic/vue'
import { peopleCircleOutline } from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useTeams } from '@/composables/useTeams'
import TeamCard from '@/components/TeamCard.vue'
import TeamDetailsModal from '@/components/TeamDetailsModal.vue'
import type { Team } from '@/types'

const router = useRouter()
const { user } = useAuth()
const { getUserTeams, loading } = useTeams()

// State
const userTeams = ref<Team[]>([])
const showDetailsModal = ref(false)
const selectedTeam = ref<Team | null>(null)

// Methods
const loadUserTeams = async () => {
  if (user.value) {
    userTeams.value = await getUserTeams()
  }
}

const handleRefresh = async (event: any) => {
  await loadUserTeams()
  event.target.complete()
}

const openTeamDetails = (team: Team) => {
  selectedTeam.value = team
  showDetailsModal.value = true
}

const goToTeams = () => {
  router.push('/tabs/teams')
}

// Lifecycle
onMounted(async () => {
  await loadUserTeams()
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
</style>