<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ profile?.name || 'Profil użytkownika' }}</ion-title>
        <ion-button fill="clear" slot="end" @click="$emit('close')">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Ładuję profil...</p>
      </div>

      <!-- Profile Display -->
      <div v-else-if="profile" class="profile-content">
        <!-- Profile Header -->
        <div class="profile-header">
          <ion-avatar>
            <img 
              v-if="profile.avatar" 
              :src="getAvatarDisplaySrc(profile.avatar)" 
              alt="Awatar użytkownika"
              @error="handleAvatarError"
            />
            <ion-icon 
              v-else 
              :icon="personCircleOutline" 
              size="large"
            ></ion-icon>
          </ion-avatar>
          <h2>{{ profile.name }}</h2>
          <p class="profile-email">{{ profile.email }}</p>
        </div>

        <!-- Basic Info Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Podstawowe informacje</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="info-item">
              <ion-icon :icon="locationOutline"></ion-icon>
              <div>
                <p class="label">Lokacja</p>
                <p class="value">{{ profile.location }}</p>
              </div>
            </div>
            
            <div class="info-item">
              <ion-icon :icon="gameControllerOutline"></ion-icon>
              <div>
                <p class="label">Ulubiona gra/system</p>
                <p class="value">{{ profile.favoriteGame }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Social Links Card -->
        <ion-card v-if="hasSocialLinks">
          <ion-card-header>
            <ion-card-title>Kontakt</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="profile.socials?.discord" class="social-item">
              <ion-icon :icon="logoDiscord"></ion-icon>
              <span>{{ profile.socials.discord }}</span>
            </div>
            
            <div v-if="profile.socials?.twitter" class="social-item">
              <ion-icon :icon="logoTwitter"></ion-icon>
              <span>{{ profile.socials.twitter }}</span>
            </div>
            
            <div v-if="profile.socials?.steam" class="social-item">
              <ion-icon :icon="gameControllerOutline"></ion-icon>
              <span>{{ profile.socials.steam }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Member Since -->
        <ion-card v-if="profile.createdAt">
          <ion-card-content>
            <p class="member-since">
              <ion-icon :icon="calendarOutline"></ion-icon>
              Członek od {{ formatMemberSince(profile.createdAt) }}
            </p>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Error State -->
      <div v-else class="error-state">
        <ion-icon :icon="alertCircleOutline" size="large" color="danger"></ion-icon>
        <h3>Błąd</h3>
        <p>{{ error || 'Nie udało się załadować profilu' }}</p>
        <ion-button @click="$emit('close')" fill="outline">
          Zamknij
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAvatar,
  IonSpinner
} from '@ionic/vue'
import {
  closeOutline,
  personCircleOutline,
  locationOutline,
  gameControllerOutline,
  logoDiscord,
  logoTwitter,
  calendarOutline,
  alertCircleOutline
} from 'ionicons/icons'
import { useProfile } from '@/composables/useProfile'
import { getAvatarDisplaySrc } from '@/utils/avatars'
import type { UserProfile } from '@/types'

// Props
interface Props {
  isOpen: boolean
  userId: string | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Composables
const { loadProfile } = useProfile()

// State
const profile = ref<UserProfile | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const hasSocialLinks = computed(() => {
  const socials = profile.value?.socials
  return socials?.discord || socials?.twitter || socials?.steam
})

// Methods
const loadUserProfile = async () => {
  if (!props.userId) {
    error.value = 'Brak ID użytkownika'
    return
  }

  try {
    loading.value = true
    error.value = null
    profile.value = await loadProfile(props.userId)
    
    if (!profile.value) {
      error.value = 'Profil nie został znaleziony'
    }
  } catch (err: any) {
    error.value = 'Nie udało się załadować profilu'
    console.error('Error loading user profile:', err)
  } finally {
    loading.value = false
  }
}

const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const formatMemberSince = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long'
  })
}

// Watch for userId changes
watch(() => [props.isOpen, props.userId], async ([isOpen, userId]) => {
  if (isOpen && userId) {
    await loadUserProfile()
  } else if (!isOpen) {
    // Clear state when modal closes
    profile.value = null
    error.value = null
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

.loading-container p {
  color: var(--ion-color-medium);
}

.profile-content {
  max-width: 600px;
  margin: 0 auto;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
}

.profile-header ion-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 1rem auto;
}

.profile-header h2 {
  color: var(--ion-color-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.profile-email {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin: 0;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item ion-icon {
  color: var(--ion-color-primary);
  font-size: 24px;
  min-width: 24px;
  margin-top: 0.2rem;
}

.info-item .label {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 0 0 0.25rem 0;
}

.info-item .value {
  font-size: 1rem;
  margin: 0;
}

.social-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.social-item:last-child {
  margin-bottom: 0;
}

.social-item ion-icon {
  color: var(--ion-color-primary);
  font-size: 20px;
  min-width: 20px;
}

.member-since {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin: 0;
}

.member-since ion-icon {
  font-size: 18px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  min-height: 300px;
}

.error-state h3 {
  color: var(--ion-color-danger);
  margin: 1rem 0 0.5rem 0;
}

.error-state p {
  color: var(--ion-color-medium);
  margin: 0 0 1.5rem 0;
}

ion-card {
  margin-bottom: 1rem;
}

ion-card:last-child {
  margin-bottom: 0;
}
</style>