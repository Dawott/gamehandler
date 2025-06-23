<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Wybierz awatar</ion-title>
        <ion-button fill="clear" slot="end" @click="$emit('close')">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Upload Option -->
      <div class="upload-option">
        <ion-button 
          expand="block" 
          fill="outline" 
          @click="openUploadModal"
        >
          <ion-icon slot="start" :icon="cloudUploadOutline"></ion-icon>
          Prześlij własny awatar
        </ion-button>
      </div>

      <div class="divider">
        <span>lub wybierz z dostępnych</span>
      </div>

      <div class="avatar-grid">
        <div 
          v-for="avatar in availableAvatars" 
          :key="avatar.id"
          class="avatar-option"
          :class="{ selected: selectedAvatar === avatar.path }"
          @click="selectAvatar(avatar.path)"
        >
          <ion-avatar>
            <img :src="avatar.path" :alt="avatar.name" />
          </ion-avatar>
          <p>{{ avatar.name }}</p>
          <ion-icon 
            v-if="selectedAvatar === avatar.path"
            :icon="checkmarkCircleOutline"
            class="selected-icon"
            color="primary"
          ></ion-icon>
        </div>
      </div>

      <div class="action-buttons">
        <ion-button 
          expand="block" 
          @click="confirmSelection"
          :disabled="!selectedAvatar"
        >
          Wybierz awatar
        </ion-button>
        
        <ion-button 
          expand="block" 
          fill="outline" 
          @click="$emit('close')"
        >
          Anuluj
        </ion-button>
      </div>
    </ion-content>

    <!-- Upload Modal -->
    <AvatarUploadModal
      :is-open="showUploadModal"
      @close="showUploadModal = false"
      @upload="handleUploadedAvatar"
    />
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonAvatar
} from '@ionic/vue'
import { closeOutline, checkmarkCircleOutline, cloudUploadOutline } from 'ionicons/icons'
import { AVAILABLE_AVATARS, getDefaultAvatar } from '../utils/avatars'
import AvatarUploadModal from './AvatarUploadModal.vue'

// Props
interface Props {
  isOpen: boolean
  currentAvatar?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  select: [avatar: string]
}>()

// State
const selectedAvatar = ref<string>('')
const showUploadModal = ref(false)

// Available avatars from utility
const availableAvatars = AVAILABLE_AVATARS

// Methods
const selectAvatar = (avatarPath: string) => {
  selectedAvatar.value = avatarPath
}

const confirmSelection = () => {
  if (selectedAvatar.value) {
    emit('select', selectedAvatar.value)
    emit('close')
  }
}

const openUploadModal = () => {
  showUploadModal.value = true
}

const handleUploadedAvatar = (avatarData: string) => {
  selectedAvatar.value = avatarData
  showUploadModal.value = false
  // Automatically confirm the uploaded avatar
  emit('select', avatarData)
  emit('close')
}

// Initialize with current avatar
onMounted(() => {
  selectedAvatar.value = props.currentAvatar || getDefaultAvatar()
})
</script>

<style scoped>
.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.avatar-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid transparent;
}

.avatar-option:hover {
  background-color: var(--ion-color-light);
}

.avatar-option.selected {
  border-color: var(--ion-color-primary);
  background-color: var(--ion-color-primary-tint);
}

.avatar-option ion-avatar {
  width: 60px;
  height: 60px;
  margin-bottom: 0.5rem;
}

.avatar-option p {
  margin: 0;
  font-size: 0.8rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.selected-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1.2rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-option {
  margin-bottom: 1rem;
}

.divider {
  text-align: center;
  margin: 1rem 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--ion-color-medium);
  z-index: 1;
}

.divider span {
  background: var(--ion-background-color);
  padding: 0 1rem;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}
</style>