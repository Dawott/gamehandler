<template>
  <div class="photo-gallery">
    <!-- Gallery Header -->
    <div class="gallery-header">
      <h3 class="gallery-title">
        <ion-icon :icon="imagesOutline" class="title-icon"></ion-icon>
        Galeria Drużyny
      </h3>
      
      <ion-button 
        v-if="canAddPhotos"
        size="small"
        @click="showPhotoOptions"
        class="add-photo-button"
      >
        <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
        Dodaj zdjęcie
      </ion-button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <ion-spinner></ion-spinner>
      <p>Ładuję zdjęcia...</p>
    </div>

    <!-- Photo Grid -->
    <div v-else-if="photos.length > 0" class="photos-grid">
      <div 
        v-for="(photo, index) in photos" 
        :key="photo.id"
        class="photo-item animate-scale-in"
        :style="{ animationDelay: (index * 0.1) + 's' }"
        @click="openPhotoViewer(photo)"
      >
        <img 
          :src="photo.thumbnailUrl || photo.url" 
          :alt="photo.caption"
          class="photo-thumbnail"
        />
        
        <div class="photo-overlay">
          <div class="photo-info">
            <p class="photo-caption">{{ photo.caption }}</p>
            <p class="photo-author">{{ photo.authorName }}</p>
          </div>
          
          <ion-button 
            v-if="canDeletePhoto(photo)"
            size="small"
            fill="clear"
            color="danger"
            @click.stop="deletePhoto(photo)"
            class="delete-button"
          >
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <ion-icon :icon="imagesOutline" class="empty-icon"></ion-icon>
      <h4>Brak zdjęć</h4>
      <p>Dodaj pierwsze zdjęcie drużyny!</p>
    </div>

    <!-- Photo Viewer Modal -->
    <ion-modal 
      :is-open="showViewer" 
      @didDismiss="closePhotoViewer"
      class="photo-viewer-modal"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ selectedPhoto?.caption || 'Zdjęcie' }}</ion-title>
          <ion-button fill="clear" slot="end" @click="closePhotoViewer">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="viewer-content">
        <img 
          v-if="selectedPhoto"
          :src="selectedPhoto.url" 
          :alt="selectedPhoto.caption"
          class="full-photo"
        />
        
        <div class="photo-details">
          <p class="photo-author">
            <ion-icon :icon="personOutline"></ion-icon>
            {{ selectedPhoto?.authorName }}
          </p>
          <p class="photo-date">
            <ion-icon :icon="calendarOutline"></ion-icon>
            {{ formatDate(selectedPhoto?.createdAt) }}
          </p>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  actionSheetController,
  alertController,
  loadingController,
  toastController
} from '@ionic/vue'
import {
  imagesOutline,
  cameraOutline,
  closeOutline,
  trashOutline,
  personOutline,
  calendarOutline,
  imageOutline
} from 'ionicons/icons'
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera'
import { ref as dbRef, push, set, get, remove, update } from 'firebase/database'
import { database } from '@/firebase/config'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'

interface TeamPhoto {
  id: string
  teamId: string
  authorId: string
  authorName: string
  url: string
  thumbnailUrl?: string
  caption: string
  createdAt: string
}

// Props
interface Props {
  teamId: string
  isOwner: boolean
  isMember: boolean
}

const props = defineProps<Props>()

// Composables
const { user } = useAuth()
const { profile } = useProfile()

// State
const photos = ref<TeamPhoto[]>([])
const loading = ref(false)
const showViewer = ref(false)
const selectedPhoto = ref<TeamPhoto | null>(null)

// Computed
const canAddPhotos = computed(() => props.isMember || props.isOwner)

// Methods
const loadPhotos = async () => {
  loading.value = true
  try {
    const photosRef = dbRef(database, `teamPhotos/${props.teamId}`)
    const snapshot = await get(photosRef)
    
    if (snapshot.exists()) {
      const photosData = snapshot.val()
      photos.value = Object.entries(photosData)
        .map(([id, data]: [string, any]) => ({ ...data, id }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      photos.value = []
    }
  } catch (error) {
    console.error('Error loading photos:', error)
  } finally {
    loading.value = false
  }
}

const showPhotoOptions = async () => {
  const actionSheet = await actionSheetController.create({
    header: 'Dodaj zdjęcie',
    buttons: [
      {
        text: 'Zrób zdjęcie',
        icon: cameraOutline,
        handler: () => takePhoto(CameraSource.Camera)
      },
      {
        text: 'Wybierz z galerii',
        icon: imageOutline,
        handler: () => takePhoto(CameraSource.Photos)
      },
      {
        text: 'Anuluj',
        role: 'cancel'
      }
    ]
  })
  await actionSheet.present()
}

const takePhoto = async (source: CameraSource) => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: source
    })

    if (!image.base64String) return

    // Show caption dialog
    const alert = await alertController.create({
      header: 'Dodaj opis',
      inputs: [
        {
          name: 'caption',
          type: 'text',
          placeholder: 'Opis zdjęcia (opcjonalnie)'
        }
      ],
      buttons: [
        {
          text: 'Anuluj',
          role: 'cancel'
        },
        {
          text: 'Dodaj',
          handler: async (data) => {
            await uploadPhoto(image.base64String!, data.caption || '')
          }
        }
      ]
    })
    await alert.present()
  } catch (error) {
    console.error('Camera error:', error)
    const toast = await toastController.create({
      message: 'Nie udało się zrobić zdjęcia',
      duration: 2000,
      color: 'danger'
    })
    await toast.present()
  }
}

const uploadPhoto = async (base64Data: string, caption: string) => {
  const loading = await loadingController.create({
    message: 'Przesyłanie zdjęcia...'
  })
  await loading.present()

  try {
    // In production, upload to Firebase Storage and get URL
    // For now, we'll store base64 (not recommended for production)
    const photoData = `data:image/jpeg;base64,${base64Data}`
    
    // Create photo record
    const photosRef = dbRef(database, `teamPhotos/${props.teamId}`)
    const newPhotoRef = push(photosRef)
    
    const photo: TeamPhoto = {
      id: newPhotoRef.key!,
      teamId: props.teamId,
      authorId: user.value!.uid,
      authorName: profile.value?.name || 'Nieznany',
      url: photoData,
      thumbnailUrl: photoData, // In production, create actual thumbnail
      caption: caption,
      createdAt: new Date().toISOString()
    }

    await set(newPhotoRef, photo)
    
    // Update team's last activity
    await update(dbRef(database, `teams/${props.teamId}`), {
      lastPhotoAt: new Date().toISOString(),
      photoCount: photos.value.length + 1
    })

    photos.value.unshift(photo)

    const toast = await toastController.create({
      message: 'Zdjęcie dodane!',
      duration: 2000,
      color: 'success'
    })
    await toast.present()
  } catch (error) {
    console.error('Upload error:', error)
    const toast = await toastController.create({
      message: 'Nie udało się przesłać zdjęcia',
      duration: 2000,
      color: 'danger'
    })
    await toast.present()
  } finally {
    await loading.dismiss()
  }
}

const openPhotoViewer = (photo: TeamPhoto) => {
  selectedPhoto.value = photo
  showViewer.value = true
}

const closePhotoViewer = () => {
  showViewer.value = false
  selectedPhoto.value = null
}

const canDeletePhoto = (photo: TeamPhoto) => {
  return photo.authorId === user.value?.uid || props.isOwner
}

const deletePhoto = async (photo: TeamPhoto) => {
  const alert = await alertController.create({
    header: 'Usuń zdjęcie',
    message: 'Czy na pewno chcesz usunąć to zdjęcie?',
    buttons: [
      {
        text: 'Anuluj',
        role: 'cancel'
      },
      {
        text: 'Usuń',
        role: 'destructive',
        handler: async () => {
          try {
            await remove(dbRef(database, `teamPhotos/${props.teamId}/${photo.id}`))
            photos.value = photos.value.filter(p => p.id !== photo.id)
            
            // Update photo count
            await update(dbRef(database, `teams/${props.teamId}`), {
              photoCount: photos.value.length
            })

            const toast = await toastController.create({
              message: 'Zdjęcie usunięte',
              duration: 2000,
              color: 'success'
            })
            await toast.present()
          } catch (error) {
            console.error('Delete error:', error)
          }
        }
      }
    ]
  })
  await alert.present()
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadPhotos()
})
</script>

<style scoped>
/* Gallery Header */
.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.gallery-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--ion-color-primary);
  font-size: 1.2rem;
}

.title-icon {
  font-size: 1.4rem;
}

.add-photo-button {
  --border-radius: 12px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.loading-state p {
  color: var(--ion-color-medium);
  margin: 0;
}

/* Photos Grid */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.photo-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.photo-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  padding: 1rem 0.75rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  flex: 1;
  min-width: 0;
}

.photo-caption {
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-author {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  margin: 0;
}

.delete-button {
  --color: white;
  --background-hover: rgba(244, 67, 54, 0.2);
  margin: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  color: var(--ion-color-light-shade);
  margin-bottom: 1rem;
}

.empty-state h4 {
  color: var(--ion-color-primary);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--ion-color-medium);
  margin: 0;
}

/* Photo Viewer Modal */
.photo-viewer-modal {
  --background: black;
}

.viewer-content {
  --background: black;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.full-photo {
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
}

.photo-details {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
}

.photo-details p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  margin: 0;
  font-size: 0.9rem;
}

.photo-details ion-icon {
  font-size: 1rem;
}

/* Animation */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

/* Responsive */
@media (max-width: 768px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }
  
  .photo-overlay {
    opacity: 1;
    padding: 0.5rem;
  }
  
  .photo-caption {
    font-size: 0.8rem;
  }
  
  .photo-author {
    font-size: 0.7rem;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .photo-item {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
}
</style>