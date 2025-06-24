<template>
  <div class="profile-form">
    <ion-card>
      <ion-card-header>
        <ion-card-title>
          {{ isEdit ? 'Edytuj Profil' : 'Dokończ profil' }}
        </ion-card-title>
        <ion-card-subtitle v-if="!isEdit">
          Pozwól innym graczom się poznać!
        </ion-card-subtitle>
      </ion-card-header>

      <ion-card-content>
        <form @submit.prevent="handleSubmit">
          <!-- Avatar Section -->
          <div class="avatar-section">
            <ion-avatar>
              <img 
                v-if="formData.avatar" 
                :src="getAvatarDisplaySrc(formData.avatar)" 
                alt="Awatar użytkownika"
                @error="handleImageError"
              />
              <ion-icon 
                v-else
                :icon="personOutline" 
                size="large"
                :style="{ color: 'var(--ion-color-primary)' }"
              ></ion-icon>
            </ion-avatar>
            <ion-button 
              fill="outline" 
              size="small" 
              @click="showAvatarSelector = true"
              :disabled="loading"
            >
              Zmień awatar
            </ion-button>
          </div>

          <!-- Basic Info -->
          <div class="form-section">
            <h3>Dane</h3>
            
            <ion-item>
              <ion-label position="stacked">Nazwa użytkownika *</ion-label>
              <ion-input 
                v-model="formData.name" 
                placeholder="Pokaż swoją nazwę użytkownika"
                :disabled="loading"
                required
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Lokacja *</ion-label>
              <ion-select 
                v-model="formData.location" 
                placeholder="Wybierz lokację"
                :disabled="loading"
                required
              >
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
              <ion-label position="stacked">Ulubiona Gra/System *</ion-label>
              <ion-select 
                v-model="formData.favoriteGame" 
                placeholder="Wybierz swój ulubiony system"
                :disabled="loading"
                required
              >
                <ion-select-option 
                  v-for="game in GAME_SYSTEMS" 
                  :key="game" 
                  :value="game"
                >
                  {{ game }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <!-- Social Links -->
          <div class="form-section">
            <h3>Linki do socjali</h3>
            
            <ion-item>
              <ion-label position="stacked">
                <ion-icon :icon="logoDiscord" class="social-icon"></ion-icon>
                Discord
              </ion-label>
              <ion-input 
                v-model="formData.socials.discord" 
                placeholder="YourUsername#1234"
                :disabled="loading"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">
                <ion-icon :icon="logoTwitter" class="social-icon"></ion-icon>
                X (Twitter)
              </ion-label>
              <ion-input 
                v-model="formData.socials.twitter" 
                placeholder="@yourusername"
                :disabled="loading"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">
                <ion-icon :icon="gameControllerOutline" class="social-icon"></ion-icon>
                Steam Profil
              </ion-label>
              <ion-input 
                v-model="formData.socials.steam" 
                placeholder="URL lub ID Steam"
                :disabled="loading"
              ></ion-input>
            </ion-item>
          </div>

          <!-- Action Buttons -->
          <div class="button-section">
            <ion-button 
              type="submit" 
              expand="block" 
              :disabled="loading || !isFormValid"
            >
              <template v-if="loading" #start>
                <ion-spinner></ion-spinner>
              </template>
              {{ loading ? 'Zapisuję...' : (isEdit ? 'Uzupełnij profil' : 'Stwórz profil') }}
            </ion-button>

            <ion-button 
              v-if="isEdit" 
              expand="block" 
              fill="outline" 
              @click="$emit('cancel')"
              :disabled="loading"
            >
              Anuluj
            </ion-button>
          </div>
        </form>
      </ion-card-content>
    </ion-card>

    <AvatarSelector
  :is-open="showAvatarSelector"
  :current-avatar="formData.avatar"
  @close="showAvatarSelector = false"
  @select="handleAvatarSelect"
/>

    <!-- Error Alert -->
    <ion-alert
      :is-open="!!error"
      header="Błąd profilu"
      :message="error"
      :buttons="['OK']"
      @didDismiss="clearError"
    ></ion-alert>

    <!-- Success Toast -->
    <ion-toast
      :is-open="showSuccessToast"
      message="Profil zapisany!"
      duration="2000"
      color="success"
      @didDismiss="showSuccessToast = false"
    ></ion-toast>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonAvatar,
  IonIcon,
  IonSpinner,
  IonAlert,
  IonToast
} from '@ionic/vue'
import {
  personOutline,
  logoDiscord,
  logoTwitter,
  gameControllerOutline
} from 'ionicons/icons'
import { LOCATIONS, GAME_SYSTEMS } from '@/data/constants'
import { useProfile } from '@/composables/useProfile'
import type { UserProfile } from '@/types'
import { getAvatarDisplaySrc, getDefaultAvatar, isUploadedAvatar } from '@/utils/avatars'
import AvatarSelector from './AvatarSelector.vue'

defineOptions({
  name: 'ProfileForm'
})

// Props
interface Props {
  initialData?: UserProfile | null
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: null,
  isEdit: false
})

// Emits
const emit = defineEmits<{
  success: [profile: UserProfile]
  cancel: []
}>()

// Composables
const { saveProfile, loading, error } = useProfile()

// Form data
const formData = ref({
  name: '',
  location: '',
  favoriteGame: '',
  avatar: '',
  socials: {
    discord: '',
    twitter: '',
    steam: ''
  }
})

// UI state
const showSuccessToast = ref(false)
const showAvatarSelector = ref(false)

// Computed
const isFormValid = computed(() => {
  const isValid = formData.value.name.trim().length > 0 &&
         formData.value.location.length > 0 &&
         formData.value.favoriteGame.length > 0
  
  console.log('Form validation:', {
    name: formData.value.name.trim().length > 0,
    location: formData.value.location.length > 0,
    favoriteGame: formData.value.favoriteGame.length > 0,
    isValid
  })
  
  return isValid
})

// Methods
const clearError = () => {
  error.value = null
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    console.log('Form is not valid:', formData.value)
    return
  }

  try {
    const savedProfile = await saveProfile(formData.value)
    showSuccessToast.value = true
    
    // Wait a bit for the toast to show
    emit('success', savedProfile)
  } catch (err) {
    console.error('Błąd zapisu profilu:', err)
  }
}

const handleAvatarButtonClick = () => {
  console.log('🔄 Avatar button clicked!')
  console.log('🔍 Current showAvatarSelector:', showAvatarSelector.value)
  
  showAvatarSelector.value = true
  
  console.log('✅ Set showAvatarSelector to:', showAvatarSelector.value)

}

const handleAvatarSelectorClose = () => {
  console.log('🚪 Avatar selector closing')
  showAvatarSelector.value = false
}

const handleImageError = (event: Event) => {
  console.warn('Avatar image failed to load, falling back to default')
  // Fallback to default avatar if image fails to load
  formData.value.avatar = getDefaultAvatar()
  
  // Optional: Hide the broken image
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const handleAvatarSelect = (avatarPath: string) => {
  console.log('Avatar selected:', avatarPath.substring(0, 50) + '...')
  formData.value.avatar = avatarPath
  showAvatarSelector.value = false
}

// Initialize form with existing data
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.value = {
      name: newData.name || '',
      location: newData.location || '',
      favoriteGame: newData.favoriteGame || '',
      avatar: newData.avatar || getDefaultAvatar(),
      socials: {
        discord: newData.socials?.discord || '',
        twitter: newData.socials?.twitter || '',
        steam: newData.socials?.steam || ''
      }
    }
  }
}, { immediate: true })
</script>

<style scoped>
.profile-form {
  max-width: 600px;
  margin: 0 auto;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.avatar-section ion-avatar {
  width: 80px;
  height: 80px;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.social-icon {
  margin-right: 0.5rem;
}

.button-section {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

ion-item {
  margin-bottom: 0.5rem;
}

ion-select, ion-input {
  width: 100%;
}
</style>