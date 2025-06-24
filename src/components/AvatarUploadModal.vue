<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Prześlij własny awatar</ion-title>
        <ion-button fill="clear" slot="end" @click="$emit('close')">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Upload Section -->
      <div class="upload-section">
        <div class="upload-area" @click="triggerFileInput" @drop="handleDrop" @dragover="handleDragOver">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            style="display: none"
          />
          
          <div v-if="!previewImage" class="upload-placeholder">
            <ion-icon :icon="cloudUploadOutline" size="large"></ion-icon>
            <h3>Prześlij obraz</h3>
            <p>Kliknij lub przeciągnij obraz tutaj</p>
            <p class="upload-note">JPG, PNG, GIF - max 2MB</p>
          </div>

          <div v-else class="upload-preview">
            <ion-avatar class="preview-avatar">
              <img :src="previewImage" alt="Podgląd awatara" />
            </ion-avatar>
            <ion-button fill="outline" size="small" @click="clearPreview">
              <ion-icon :icon="trashOutline"></ion-icon>
              Usuń
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <ion-item v-if="error" color="danger">
        <ion-icon :icon="alertCircleOutline" slot="start"></ion-icon>
        <ion-label>{{ error }}</ion-label>
      </ion-item>

      <!-- Image Adjustment Controls -->
      <div v-if="previewImage && !error" class="adjustment-section">
        <h4>Dostosuj obraz</h4>
        
        <ion-item>
          <ion-label>Jakość kompresji</ion-label>
          <ion-range
            v-model="compressionQuality"
            :min="0.1"
            :max="1"
            :step="0.1"
            :pin="true"
            @ionInput="updatePreview"
          >
            <ion-label slot="start">Min</ion-label>
            <ion-label slot="end">Max</ion-label>
          </ion-range>
        </ion-item>

        <ion-item>
          <ion-label>Rozmiar</ion-label>
          <ion-select v-model="targetSize" @ionChange="updatePreview">
            <ion-select-option value="128">128x128px</ion-select-option>
            <ion-select-option value="256">256x256px</ion-select-option>
            <ion-select-option value="512">512x512px</ion-select-option>
          </ion-select>
        </ion-item>

        <div class="size-info">
          <p>Przewidywany rozmiar: {{ formatFileSize(estimatedSize) }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <ion-button 
          expand="block" 
          @click="uploadAvatar"
          :disabled="!previewImage || !!error || uploading"
        >
          <template v-if="uploading" #start>
            <ion-spinner></ion-spinner>
          </template>
          {{ uploading ? 'Przesyłanie...' : 'Ustaw jako awatar' }}
        </ion-button>
        
        <ion-button 
          expand="block" 
          fill="outline" 
          @click="$emit('close')"
          :disabled="uploading"
        >
          Anuluj
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonAvatar,
  IonItem,
  IonLabel,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  toastController
} from '@ionic/vue'
import {
  closeOutline,
  cloudUploadOutline,
  trashOutline,
  alertCircleOutline
} from 'ionicons/icons'

// Props
interface Props {
  isOpen: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  upload: [avatarData: string]
}>()

// Refs
const fileInput = ref<HTMLInputElement>()

// State
const previewImage = ref<string>('')
const originalFile = ref<File | null>(null)
const error = ref<string>('')
const uploading = ref(false)
const compressionQuality = ref(0.8)
const targetSize = ref(256)
const estimatedSize = ref(0)

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Methods
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const processFile = async (file: File) => {
  error.value = ''
  
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    error.value = 'Nieobsługiwany format pliku. Użyj JPG, PNG, GIF lub WebP.'
    return
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    error.value = 'Plik jest za duży. Maksymalny rozmiar to 2MB.'
    return
  }
  
  originalFile.value = file
  await createPreview(file)
}

const createPreview = async (file: File) => {
  return new Promise<void>((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Set canvas size to target size
        canvas.width = targetSize.value
        canvas.height = targetSize.value
        
        // Calculate crop dimensions to maintain aspect ratio
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2
        
        // Draw cropped and resized image
        ctx.drawImage(img, x, y, size, size, 0, 0, targetSize.value, targetSize.value)
        
        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', compressionQuality.value)
        previewImage.value = base64
        estimatedSize.value = Math.round(base64.length * 0.75) // Approximate base64 size
        
        resolve()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

const updatePreview = async () => {
  if (originalFile.value) {
    await createPreview(originalFile.value)
  }
}

const clearPreview = () => {
  previewImage.value = ''
  originalFile.value = null
  error.value = ''
  estimatedSize.value = 0
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadAvatar = async () => {
  if (!previewImage.value) return
  
  try {
    uploading.value = true
    
    // Simulate upload delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Emit the base64 image data
    emit('upload', previewImage.value)
    
    const toast = await toastController.create({
      message: 'Awatar został przesłany pomyślnie!',
      duration: 2000,
      color: 'success'
    })
    await toast.present()
    
    emit('close')
    clearPreview()
    
  } catch (err) {
    error.value = 'Błąd podczas przesyłania awatara'
    
    const toast = await toastController.create({
      message: 'Nie udało się przesłać awatara',
      duration: 2000,
      color: 'danger'
    })
    await toast.present()
  } finally {
    uploading.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.upload-section {
  margin-bottom: 1.5rem;
}

.upload-area {
  border: 2px dashed var(--ion-color-medium);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--ion-color-primary);
  background-color: var(--ion-color-light);
}

.upload-placeholder ion-icon {
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.upload-placeholder h3 {
  color: var(--ion-color-primary);
  margin-bottom: 0.5rem;
}

.upload-placeholder p {
  color: var(--ion-color-medium);
  margin: 0.25rem 0;
}

.upload-note {
  font-size: 0.8rem !important;
  font-style: italic;
}

.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.preview-avatar {
  width: 120px;
  height: 120px;
}

.adjustment-section {
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.adjustment-section h4 {
  margin: 0 0 1rem 0;
  color: var(--ion-color-primary);
}

.size-info {
  margin-top: 1rem;
  text-align: center;
}

.size-info p {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin: 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

ion-item {
  --background: transparent;
  margin-bottom: 0.5rem;
}

ion-range {
  padding: 0 1rem;
}
</style>