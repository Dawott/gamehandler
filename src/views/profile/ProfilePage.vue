<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Profil</ion-title>
        <template #end>
          <ion-button 
            v-if="hasProfile && !isEditing"
            fill="clear" 
            @click="isEditing = true"
          >
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
        </template>
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
        @cancel="isEditing = false"
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
        <ion-card>
          <ion-card-header>
            <ion-card-title>Moje drużyny</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p v-if="!profile?.teams?.length">
             Brak drużyn. Odwiedź zakładkę z drużynami, by zapisać się do którejś
            </p>
            <div v-else>
              <p>TBD</p>
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
          <template #start>
            <ion-icon :icon="logOutOutline"></ion-icon>
          </template>
          {{ loading ? 'Wylogowuję...' : 'Wyloguj' }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  IonSpinner
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
import ProfileForm from '@/components/ProfileForm.vue'

const router = useRouter()
const { user, loading, logout } = useAuth()
const { profile, loading: profileLoading, hasProfile, loadProfile } = useProfile()

const isEditing = ref(false)

// Computed
const hasSocialLinks = computed(() => {
  const socials = profile.value?.socials
  return socials?.discord || socials?.twitter || socials?.steam
})

// Methods
const handleLogout = async () => {
  try {
    await logout()
    router.replace('/auth')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const handleProfileSuccess = () => {
  isEditing.value = false
}

// Load profile on mount
onMounted(async () => {
  if (user.value) {
    await loadProfile()
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
</style>