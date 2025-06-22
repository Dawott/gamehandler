<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div class="profile-container">
        <div class="profile-header">
          <ion-avatar>
            <ion-icon :icon="personOutline" size="large"></ion-icon>
          </ion-avatar>
          <h2 v-if="user">{{ user.email }}</h2>
        </div>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Profile Setup</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Profile customization coming soon!</p>
            <p>You'll be able to set:</p>
            <ul>
              <li>Display name</li>
              <li>Location</li>
              <li>Favorite games</li>
              <li>Social links</li>
              <li>Profile picture</li>
            </ul>
          </ion-card-content>
        </ion-card>

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
          {{ loading ? 'Logging out...' : 'Logout' }}
        </ion-button>
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonAvatar
} from '@ionic/vue'
import { personOutline, logOutOutline } from 'ionicons/icons'
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
.profile-container {
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
}

.logout-button {
  margin-top: 2rem;
}

ul {
  padding-left: 1rem;
}

li {
  margin-bottom: 0.5rem;
}
</style>