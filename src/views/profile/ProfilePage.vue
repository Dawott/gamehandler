<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Profil</ion-title>
        <ion-button slot="end"
          v-if="hasProfile && !isEditing"
          fill="clear" 
          @click="isEditing = true"
        >
          <ion-icon :icon="createOutline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Loading State -->
      <div v-if="profileLoading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Ładuję profil...</p>
      </div>

      <!-- Profile Form (Create/Edit) -->
      <ProfileForm
        v-else-if="!hasProfile || isEditing"
        :initial-data="profile"
        :is-edit="isEditing"
        @success="handleProfileSuccess"
        @cancel="handleCancel"
      />

      <!-- Profile Display -->
      <div v-else class="profile-display">
        <div class="profile-header">
          <ion-avatar>
            <ion-icon :icon="personOutline" size="large"></ion-icon>
          </ion-avatar>
          <h2>{{ profile?.name }}</h2>
          <p>{{ profile?.email }}</p>
        </div>

        <!-- Basic Info Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Podstawowe Informacje</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="info-item">
              <ion-icon :icon="locationOutline"></ion-icon>
              <span>{{ profile?.location }}</span>
            </div>
            <div class="info-item">
              <ion-icon :icon="gameControllerOutline"></ion-icon>
              <span>{{ profile?.favoriteGame }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Social Links Card -->
        <ion-card v-if="hasSocialLinks">
          <ion-card-header>
            <ion-card-title>Linki do socjali</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="profile?.socials?.discord" class="social-item">
              <ion-icon :icon="logoDiscord"></ion-icon>
              <span>{{ profile.socials.discord }}</span>
            </div>
            <div v-if="profile?.socials?.twitter" class="social-item">
              <ion-icon :icon="logoTwitter"></ion-icon>
              <span>{{ profile.socials.twitter }}</span>
            </div>
            <div v-if="profile?.socials?.steam" class="social-item">
              <ion-icon :icon="gameControllerOutline"></ion-icon>
              <span>{{ profile.socials.steam }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Teams Card -->
         <!--
        <ion-card>
          <ion-card-header>
            <ion-card-title>Moje drużyny</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="teamsLoading" class="teams-loading">
              <ion-spinner></ion-spinner>
              <p>Ładuję drużyny...</p>
            </div>
            <p v-else-if="!userTeams.length">
             Brak drużyn. Odwiedź zakładkę z drużynami, by zapisać się do którejś
            </p>
            <div v-else class="teams-list">
              <ion-item 
                v-for="team in userTeams" 
                :key="team.id"
                button
                @click="openTeamDetails(team)"
              >
                <ion-label>
                  <h3>{{ team.name }}</h3>
                  <p>
                    <ion-icon :icon="gameControllerOutline"></ion-icon>
                    {{ team.game }}
                  </p>
                </ion-label>
                <ion-badge 
                  slot="end" 
                  :color="team.ownerId === user?.uid ? 'primary' : 'secondary'"
                >
                  {{ team.ownerId === user?.uid ? 'Właściciel' : 'Członek' }}
                </ion-badge>
              </ion-item>
            </div>
          </ion-card-content>
        </ion-card>-->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Moje drużyny</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="teamsLoading" class="teams-loading">
              <ion-spinner></ion-spinner>
              <p>Ładuję drużyny...</p>
            </div>
            <p v-else-if="!userTeams.length">
             Brak drużyn. Odwiedź zakładkę z drużynami, by zapisać się do którejś
            </p>
            <div v-else class="teams-list">
              <TeamCard
                v-for="team in userTeams"
                :key="team.id"
                :team="team"
                :refresh-trigger="refreshTrigger"
                @click="openTeamDetails(team)"
              />
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Logout Button -->
        <ion-button 
          expand="block" 
          color="danger" 
          @click="handleLogout"
          :disabled="loading"
          class="logout-button"
        >
          <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
          {{ loading ? 'Wylogowuję...' : 'Wyloguj' }}
        </ion-button>
      </div>
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
  IonItem,
  IonLabel,
  IonBadge
} from '@ionic/vue'
import {
  personOutline,
  logOutOutline,
  createOutline,
  locationOutline,
  gameControllerOutline,
  logoDiscord,
  logoTwitter
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'
import { useTeams } from '@/composables/useTeams'
import ProfileForm from '@/components/ProfileForm.vue'
import TeamDetailsModal from '@/components/TeamDetailsModal.vue'
import type { Team } from '@/types'

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
const handleLogout = async () => {
  try {
    clearProfile() // Clear profile state before logout
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
  
  // Set editing to false
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
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 1rem;
}

.profile-display {
  max-width: 600px;
  margin: 0 auto;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-header ion-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem auto;
}

.profile-header h2 {
  color: var(--ion-color-primary);
  margin-bottom: 0.5rem;
}

.profile-header p {
  color: var(--ion-color-medium);
  margin: 0;
}

.info-item, .social-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.info-item ion-icon, .social-item ion-icon {
  color: var(--ion-color-primary);
  min-width: 20px;
}

.logout-button {
  margin-top: 2rem;
}

ion-card {
  margin-bottom: 1rem;
}

.teams-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  gap: 0.5rem;
}

.teams-loading p {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.teams-list ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
}

.teams-list ion-label p {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.teams-list ion-icon {
  font-size: 14px;
}
</style>