<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>GameHandler</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div class="auth-container">
        <div class="logo-section">
          <ion-icon :icon="gameControllerOutline" size="large" color="primary"></ion-icon>
          <h1>GameHandler</h1>
          <p>Znajdź swój zespół z marzeń</p>
        </div>

        <!-- Login/Register Segment -->
        <ion-segment :value="authMode" @ionChange="handleSegmentChange">
          <ion-segment-button value="login">
            <ion-label>Login</ion-label>
          </ion-segment-button>
          <ion-segment-button value="register">
            <ion-label>Zarejestruj</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Login Form -->
        <div v-show="authMode === 'login'" class="auth-form">
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input 
              v-model="loginForm.email" 
              type="email" 
              placeholder="Podaj Email"
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Hasło</ion-label>
            <ion-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="Podaj Hasło"
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <ion-button 
            expand="block" 
            @click="handleLogin" 
            :disabled="loading || !isLoginFormValid"
            class="auth-button"
          ><template #start>
            <ion-spinner v-if="loading"></ion-spinner>
            </template>
            {{ loading ? 'Loguję...' : 'Zaloguj' }}
          </ion-button>
        </div>

        <!-- Register Form -->
        <div v-show="authMode === 'register'" class="auth-form">
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input 
              v-model="registerForm.email" 
              type="email" 
              placeholder="Podaj email"
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Hasło</ion-label>
            <ion-input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="Podaj hasło"
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Potwierdź hasło</ion-label>
            <ion-input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="Potwierdź swoje hasło"
              :disabled="loading"
            ></ion-input>
          </ion-item>

          <ion-button 
            expand="block" 
            @click="handleRegister" 
            :disabled="loading || !isRegisterFormValid"
            class="auth-button"
          >
          <template #start>
            <ion-spinner v-if="loading"></ion-spinner>
            </template>
            {{ loading ? 'Tworzę konto...' : 'Utwórz konto' }}
          </ion-button>
        </div>

        <!-- Error Alert -->
        <ion-alert
          :is-open="!!error"
          :header="'Błąd Uwierzytelnienia'"
          :message="error"
          :buttons="['OK']"
          @didDismiss="error = null"
        ></ion-alert>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonSpinner,
  IonAlert
} from '@ionic/vue'
import { gameControllerOutline } from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'

const router = useRouter()
const { user, loading, error, login, register } = useAuth()
const { loadProfile } = useProfile()

const authMode = ref<'login' | 'register'>('login')

// Form data
const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  email: '',
  password: '',
  confirmPassword: ''
})

// Form validation
const isLoginFormValid = computed(() => {
  return loginForm.value.email.includes('@') && loginForm.value.password.length >= 6
})

const isRegisterFormValid = computed(() => {
  return (
    registerForm.value.email.includes('@') &&
    registerForm.value.password.length >= 6 &&
    registerForm.value.password === registerForm.value.confirmPassword
  )
})

// Handle segment change
const handleSegmentChange = (event: any) => {
  authMode.value = event.detail.value
  // Clear error when switching modes
  if (error.value) {
    error.value = null
  }
}

// Auth handlers
const handleLogin = async () => {
  await login(loginForm.value.email, loginForm.value.password)
}

const handleRegister = async () => {
  await register(registerForm.value.email, registerForm.value.password)
}

// Watch for successful authentication
watch(user, async (newUser) => {
  if (newUser) {
    await loadProfile()
    router.replace('/tabs/profile')
  }
})
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem 0;
}

.logo-section {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-section h1 {
  margin: 1rem 0 0.5rem 0;
  color: var(--ion-color-primary);
}

.logo-section p {
  color: var(--ion-color-medium);
  margin-bottom: 2rem;
}

.auth-form {
  margin-top: 1rem;
}

.auth-button {
  margin-top: 1rem;
}

ion-segment {
  margin-bottom: 1rem;
}

ion-item {
  margin-bottom: 0.5rem;
}
</style>