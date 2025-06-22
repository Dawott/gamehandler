<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Znajdź Drużynę</ion-title>
        <template #end>
          <ion-button 
            fill="clear" 
            @click="handleLogout"
            :disabled="loading"
          >
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </template>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div class="welcome-section">
        <h2>Witaj w GameHandler!</h2>
        <p v-if="user">Cześć, {{ user.email }}!</p>
        <p>Teams functionality coming soon...</p>
        
        <ion-card>
          <ion-card-header>
            <ion-card-title>Następne kroki</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>1. Ustaw swój profil</p>
            <p>2. Przejrzyj dostępne drużyny</p>
            <p>3. Utwórz swoją drużynę</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/vue'
import { logOutOutline } from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, loading, logout } = useAuth()

const handleLogout = async () => {
  try {
    await logout()
    router.replace('/auth')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.welcome-section {
  text-align: center;
  margin-top: 2rem;
}

.welcome-section h2 {
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

ion-card {
  margin-top: 2rem;
}
</style>