<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleDismiss">
    <ion-header>
      <ion-toolbar>
        <ion-title>Stwórz Drużynę</ion-title>
        
          <ion-button fill="clear" slot="end" @click="handleDismiss">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="handleSubmit">
        <ion-item>
          <ion-label position="stacked">Nazwa drużyny *</ion-label>
          <ion-input 
            v-model="formData.name" 
            placeholder="np. Krakowscy Łowcy Smoków"
            :disabled="loading"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Gra/System *</ion-label>
          <ion-select 
            v-model="formData.game" 
            placeholder="Wybierz grę lub system"
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
          <ion-label position="stacked">Maksymalna liczba graczy *</ion-label>
          <ion-input 
            v-model.number="formData.maxMembers" 
            type="number"
            min="2"
            max="20"
            placeholder="np. 5"
            :disabled="loading"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Preferowane terminy spotkań</ion-label>
          <ion-select 
            v-model="formData.meetingTimes" 
            placeholder="Wybierz terminy"
            multiple
            :disabled="loading"
          >
            <ion-select-option 
              v-for="time in MEETING_TIME_OPTIONS" 
              :key="time" 
              :value="time"
            >
              {{ time }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Opis drużyny</ion-label>
          <ion-textarea 
            v-model="formData.description" 
            placeholder="Opisz swoją drużynę, styl gry, czego szukacie..."
            :rows="4"
            :disabled="loading"
          ></ion-textarea>
        </ion-item>

        <div class="button-group">
          <ion-button 
            expand="block" 
            type="submit"
            :disabled="loading || !isFormValid"
          >
            <template v-if="loading" #start>
              <ion-spinner></ion-spinner>
            </template>
            {{ loading ? 'Tworzę...' : 'Stwórz drużynę' }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  toastController,
  alertController
} from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import { useTeams } from '@/composables/useTeams'
import { useProfile } from '@/composables/useProfile'
import { GAME_SYSTEMS, LOCATIONS, MEETING_TIME_OPTIONS } from '@/data/constants'

// Props
interface Props {
  isOpen: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Composables
const { createTeam, loading } = useTeams()
const { profile, loadProfile } = useProfile()

// Form data
const formData = ref({
  name: '',
  game: '',
  location: '',
  maxMembers: 5,
  meetingTimes: [] as string[],
  description: ''
})

// Computed
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 &&
         formData.value.game.length > 0 &&
         formData.value.location.length > 0 &&
         formData.value.maxMembers >= 2 &&
         formData.value.maxMembers <= 20
})

// Methods
const handleDismiss = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    game: '',
    location: '',
    maxMembers: 5,
    meetingTimes: [],
    description: ''
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  // Check if user has a username
  if (!profile.value) {
    await loadProfile()
  }
  
  if (!profile.value?.name) {
    const alert = await alertController.create({
      header: 'Uzupełnij profil',
      message: 'Musisz uzupełnić swoją nazwę użytkownika przed utworzeniem drużyny.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            handleDismiss()
          }
        }
      ]
    })
    await alert.present()
    return
  }

  try {
    await createTeam(formData.value)
    
    const toast = await toastController.create({
      message: 'Drużyna utworzona pomyślnie!',
      duration: 2000,
      color: 'success'
    })
    await toast.present()

    emit('success')
    handleDismiss()
  } catch (error) {
    const toast = await toastController.create({
      message: 'Nie udało się utworzyć drużyny',
      duration: 2000,
      color: 'danger'
    })
    await toast.present()
  }
}

// Load profile on mount
onMounted(async () => {
  await loadProfile()
})
</script>

<style scoped>
ion-item {
  margin-bottom: 0.5rem;
}

.button-group {
  margin-top: 2rem;
}
</style>