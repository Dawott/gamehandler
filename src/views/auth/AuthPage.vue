<template>
  <ion-page>
    <ion-header class="auth-header">
      <ion-toolbar class="custom-toolbar">
        <div class="toolbar-background">
          <div class="gradient-bg"></div>
          <div class="pattern-overlay"></div>
        </div>
        
        <ion-title class="page-title animate-slide-down">
          <div class="title-content">
            <ion-icon :icon="gameControllerOutline" class="title-icon"></ion-icon>
            <span>GameHandler</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="auth-content">
      <!-- Animated Background -->
      <div class="content-background">
        <div class="bg-gradient"></div>
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
          <div class="shape shape-4"></div>
        </div>
        <div class="particle-overlay"></div>
      </div>

      <div class="auth-container">
        <!-- App Logo Section -->
        <div class="logo-section animate-scale-in" style="animation-delay: 0.1s">
          <div class="logo-wrapper">
            <div class="logo-background">
              <div class="logo-gradient"></div>
              <div class="logo-ring animate-pulse"></div>
            </div>
            <ion-icon :icon="gameControllerOutline" class="app-logo"></ion-icon>
          </div>
          
          <div class="logo-text animate-fade-in" style="animation-delay: 0.3s">
            <h1 class="app-title">GameHandler</h1>
            <p class="app-subtitle">Znajdź swój zespół z marzeń</p>
          </div>
        </div>

        <!-- Authentication Card -->
        <div class="auth-card animate-slide-up" style="animation-delay: 0.2s">
          <div class="card-background">
            <div class="card-gradient"></div>
            <div class="card-pattern"></div>
            <div class="card-blur"></div>
          </div>

          <!-- Mode Switcher -->
          <div class="mode-switcher animate-fade-in" style="animation-delay: 0.4s">
            <ion-segment 
              :value="authMode" 
              @ionChange="handleSegmentChange"
              class="custom-segment"
            >
              <ion-segment-button 
                value="login"
                class="segment-button"
                :class="{ 'segment-active': authMode === 'login' }"
              >
                <div class="segment-content">
                  <ion-icon :icon="logInOutline" class="segment-icon"></ion-icon>
                  <ion-label class="segment-label">Login</ion-label>
                </div>
              </ion-segment-button>
              
              <ion-segment-button 
                value="register"
                class="segment-button"
                :class="{ 'segment-active': authMode === 'register' }"
              >
                <div class="segment-content">
                  <ion-icon :icon="personAddOutline" class="segment-icon"></ion-icon>
                  <ion-label class="segment-label">Zarejestruj</ion-label>
                </div>
              </ion-segment-button>
            </ion-segment>
          </div>

          <!-- Login Form -->
          <div 
            v-show="authMode === 'login'" 
            class="auth-form login-form"
            :class="{ 'form-active': authMode === 'login' }"
          >
            <div class="form-content">
              <div class="input-group animate-slide-in-left" style="animation-delay: 0.5s">
                <div class="floating-input">
                  <ion-input 
                    v-model="loginForm.email" 
                    type="email" 
                    placeholder=" "
                    :disabled="loading"
                    class="enhanced-input"
                    @ionFocus="handleInputFocus"
                    @ionBlur="handleInputBlur"
                  ></ion-input>
                  <ion-label class="floating-label">
                    <ion-icon :icon="mailOutline" class="input-icon"></ion-icon>
                    Email
                  </ion-label>
                  <div class="input-border"></div>
                </div>
              </div>

              <div class="input-group animate-slide-in-left" style="animation-delay: 0.6s">
                <div class="floating-input">
                  <ion-input 
                    v-model="loginForm.password" 
                    :type="showPassword ? 'text' : 'password'"
                    placeholder=" "
                    :disabled="loading"
                    class="enhanced-input"
                    @ionFocus="handleInputFocus"
                    @ionBlur="handleInputBlur"
                  ></ion-input>
                  <ion-label class="floating-label">
                    <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                    Hasło
                  </ion-label>
                  <ion-button 
                    fill="clear" 
                    class="password-toggle"
                    @click="togglePasswordVisibility"
                  >
                    <ion-icon 
                      :icon="showPassword ? eyeOffOutline : eyeOutline" 
                      class="toggle-icon"
                    ></ion-icon>
                  </ion-button>
                  <div class="input-border"></div>
                </div>
              </div>

              <ion-button 
                expand="block" 
                @click="handleLogin" 
                :disabled="loading || !isLoginFormValid"
                class="auth-button login-button animate-slide-in-left"
                style="animation-delay: 0.7s"
              >
                <div class="button-content">
                  <template v-if="loading">
                    <ion-spinner class="button-spinner"></ion-spinner>
                    <span>Loguję...</span>
                  </template>
                  <template v-else>
                    <ion-icon :icon="logInOutline" class="button-icon"></ion-icon>
                    <span>Zaloguj</span>
                  </template>
                </div>
                <div class="button-ripple"></div>
              </ion-button>
            </div>
          </div>

          <!-- Register Form -->
          <div 
            v-show="authMode === 'register'" 
            class="auth-form register-form"
            :class="{ 'form-active': authMode === 'register' }"
          >
            <div class="form-content">
              <div class="input-group animate-slide-in-right" style="animation-delay: 0.5s">
                <div class="floating-input">
                  <ion-input 
                    v-model="registerForm.email" 
                    type="email" 
                    placeholder=" "
                    :disabled="loading"
                    class="enhanced-input"
                    @ionFocus="handleInputFocus"
                    @ionBlur="handleInputBlur"
                  ></ion-input>
                  <ion-label class="floating-label">
                    <ion-icon :icon="mailOutline" class="input-icon"></ion-icon>
                    Email
                  </ion-label>
                  <div class="input-border"></div>
                </div>
              </div>

              <div class="input-group animate-slide-in-right" style="animation-delay: 0.6s">
                <div class="floating-input">
                  <ion-input 
                    v-model="registerForm.password" 
                    :type="showPassword ? 'text' : 'password'"
                    placeholder=" "
                    :disabled="loading"
                    class="enhanced-input"
                    @ionFocus="handleInputFocus"
                    @ionBlur="handleInputBlur"
                  ></ion-input>
                  <ion-label class="floating-label">
                    <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                    Hasło
                  </ion-label>
                  <ion-button 
                    fill="clear" 
                    class="password-toggle"
                    @click="togglePasswordVisibility"
                  >
                    <ion-icon 
                      :icon="showPassword ? eyeOffOutline : eyeOutline" 
                      class="toggle-icon"
                    ></ion-icon>
                  </ion-button>
                  <div class="input-border"></div>
                </div>
              </div>

              <div class="input-group animate-slide-in-right" style="animation-delay: 0.7s">
                <div class="floating-input">
                  <ion-input 
                    v-model="registerForm.confirmPassword" 
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder=" "
                    :disabled="loading"
                    class="enhanced-input"
                    @ionFocus="handleInputFocus"
                    @ionBlur="handleInputBlur"
                  ></ion-input>
                  <ion-label class="floating-label">
                    <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                    Potwierdź hasło
                  </ion-label>
                  <ion-button 
                    fill="clear" 
                    class="password-toggle"
                    @click="toggleConfirmPasswordVisibility"
                  >
                    <ion-icon 
                      :icon="showConfirmPassword ? eyeOffOutline : eyeOutline" 
                      class="toggle-icon"
                    ></ion-icon>
                  </ion-button>
                  <div class="input-border"></div>
                </div>
              </div>

              <!-- Password Strength Indicator -->
              <div 
                v-if="registerForm.password" 
                class="password-strength animate-fade-in"
              >
                <div class="strength-label">Siła hasła</div>
                <div class="strength-bar">
                  <div 
                    class="strength-fill" 
                    :class="passwordStrengthClass"
                    :style="{ width: passwordStrengthWidth }"
                  ></div>
                </div>
                <div class="strength-text" :class="passwordStrengthClass">
                  {{ passwordStrengthText }}
                </div>
              </div>

              <ion-button 
                expand="block" 
                @click="handleRegister" 
                :disabled="loading || !isRegisterFormValid"
                class="auth-button register-button animate-slide-in-right"
                style="animation-delay: 0.8s"
              >
                <div class="button-content">
                  <template v-if="loading">
                    <ion-spinner class="button-spinner"></ion-spinner>
                    <span>Tworzę konto...</span>
                  </template>
                  <template v-else>
                    <ion-icon :icon="personAddOutline" class="button-icon"></ion-icon>
                    <span>Utwórz konto</span>
                  </template>
                </div>
                <div class="button-ripple"></div>
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="features-section animate-fade-in" style="animation-delay: 0.9s">
          <div class="features-grid">
            <div class="feature-item animate-scale-in" style="animation-delay: 1.0s">
              <div class="feature-icon-wrapper">
                <ion-icon :icon="peopleOutline" class="feature-icon"></ion-icon>
              </div>
              <h4 class="feature-title">Znajdź drużynę</h4>
              <p class="feature-description">Dołącz do zespołów graczy w twojej okolicy</p>
            </div>
            
            <div class="feature-item animate-scale-in" style="animation-delay: 1.1s">
              <div class="feature-icon-wrapper">
                <ion-icon :icon="chatbubblesOutline" class="feature-icon"></ion-icon>
              </div>
              <h4 class="feature-title">Komunikuj się</h4>
              <p class="feature-description">Organizuj sesje i buduj relacje z graczami</p>
            </div>
            
            <div class="feature-item animate-scale-in" style="animation-delay: 1.2s">
              <div class="feature-icon-wrapper">
                <ion-icon :icon="trophyOutline" class="feature-icon"></ion-icon>
              </div>
              <h4 class="feature-title">Rozwijaj się</h4>
              <p class="feature-description">Uczestnicz w kampaniach i turniejach</p>
            </div>
          </div>
        </div>

        <!-- Error Toast -->
        <ion-toast
          :is-open="!!error"
          :message="error"
          duration="4000"
          color="danger"
          position="top"
          @didDismiss="clearError"
          class="error-toast"
        ></ion-toast>
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
  IonInput,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonLabel,
  IonSpinner,
  IonToast
} from '@ionic/vue'
import { 
  gameControllerOutline,
  logInOutline,
  personAddOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  peopleOutline,
  chatbubblesOutline,
  trophyOutline
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, loading, error, login, register } = useAuth()

const authMode = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

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

// Password strength
const passwordStrength = computed(() => {
  const password = registerForm.value.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 6) strength += 1
  if (password.length >= 8) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[0-9]/.test(password)) strength += 1
  if (/[^A-Za-z0-9]/.test(password)) strength += 1
  
  return strength
})

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 5) * 100}%`
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength < 2) return 'strength-weak'
  if (strength < 4) return 'strength-medium'
  return 'strength-strong'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength < 2) return 'Słabe'
  if (strength < 4) return 'Średnie'
  return 'Silne'
})

// Methods
const handleSegmentChange = (event: any) => {
  const newMode = event.detail.value
  
  // Add transition animation
  const authCard = document.querySelector('.auth-card')
  if (authCard) {
    authCard.classList.add('mode-switching')
    setTimeout(() => {
      authCard.classList.remove('mode-switching')
    }, 300)
  }
  
  authMode.value = newMode
  clearError()
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleInputFocus = (event: any) => {
  const inputGroup = event.target.closest('.input-group')
  if (inputGroup) {
    inputGroup.classList.add('input-focused')
  }
}

const handleInputBlur = (event: any) => {
  const inputGroup = event.target.closest('.input-group')
  if (inputGroup) {
    inputGroup.classList.remove('input-focused')
  }
}

const handleLogin = async () => {
  try {
    await login(loginForm.value.email, loginForm.value.password)
  } catch (err) {
    // Error handled by composable
  }
}

const handleRegister = async () => {
  try {
    await register(registerForm.value.email, registerForm.value.password)
  } catch (err) {
    // Error handled by composable
  }
}

const clearError = () => {
  error.value = null
}

// Watch for successful authentication
watch(user, async (newUser) => {
  if (newUser) {
    console.log('User authenticated, redirecting to profile page')
    router.replace('/tabs/profile')
  }
})
</script>

<style scoped>
/* Animation keyframes */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes particles {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

/* Animation classes */
.animate-slide-down {
  animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
  animation-fill-mode: both;
}

.animate-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.animate-pulse {
  animation: pulse 3s ease-in-out infinite;
}

/* Header styles */
.auth-header {
  background: transparent;
}

.custom-toolbar {
  position: relative;
  background: transparent;
  --background: transparent;
  --color: white;
  overflow: hidden;
}

.toolbar-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
}

.page-title {
  position: relative;
  z-index: 1;
  font-weight: 700;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.8rem;
}

/* Content styles */
.auth-content {
  --background: transparent;
  position: relative;
}

.content-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, 
    var(--ion-color-primary-tint) 0%, 
    var(--ion-color-light) 50%, 
    var(--ion-color-secondary-tint) 100%);
}

.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 8s ease-in-out infinite;
}

.shape-1 {
  width: 120px;
  height: 120px;
  top: 5%;
  left: -10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 80px;
  height: 80px;
  top: 80%;
  right: -5%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 10%;
  left: -5%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 15%;
  right: -15%;
  animation-delay: 6s;
}

.particle-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.4), transparent);
  background-size: 100px 100px, 120px 120px, 80px 80px;
  animation: particles 20s linear infinite;
}

/* Auth container */
.auth-container {
  position: relative;
  z-index: 1;
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
}

/* Logo section */
.logo-section {
  text-align: center;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.logo-background {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.logo-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.logo-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.app-logo {
  position: relative;
  z-index: 1;
  font-size: 3rem;
  color: white;
}

.logo-text {
  color: white;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

/* Auth card */
.auth-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-switching {
  transform: scale(0.98);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.card-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
}

.card-pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  transform: translate(50px, -50px);
}

.card-blur {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Mode switcher */
.mode-switcher {
  position: relative;
  z-index: 1;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.custom-segment {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.segment-button {
  --background: transparent;
  --color: rgba(255, 255, 255, 0.7);
  --color-checked: white;
  --indicator-color: transparent;
  border-radius: 12px;
  margin: 0;
  transition: all 0.3s ease;
}

.segment-button.segment-active {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.02);
}

.segment-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.segment-icon {
  font-size: 1.2rem;
}

.segment-label {
  font-weight: 600;
  font-size: 0.9rem;
}

/* Auth forms */
.auth-form {
  position: relative;
  z-index: 1;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Enhanced inputs */
.input-group {
  position: relative;
}

.floating-input {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

.input-group.input-focused .floating-input {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.4);
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.enhanced-input {
  --background: transparent;
  --color: white;
  --placeholder-color: rgba(255, 255, 255, 0.5);
  --padding-start: 3.5rem;
  --padding-end: 3rem;
  --padding-top: 1.2rem;
  --padding-bottom: 1.2rem;
  font-size: 1rem;
  font-weight: 500;
}

.floating-label {
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.3s ease;
}

.enhanced-input:not(:placeholder-shown) + .floating-label,
.input-group.input-focused .floating-label {
  top: 0.5rem;
  left: 1rem;
  transform: translateY(0);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
}

.input-icon {
  font-size: 1.1rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  --color: rgba(255, 255, 255, 0.7);
  --background-hover: rgba(255, 255, 255, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.toggle-icon {
  font-size: 1.2rem;
  transition: transform 0.2s ease;
}

.password-toggle:hover .toggle-icon {
  transform: scale(1.1);
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--ion-color-secondary), var(--ion-color-primary));
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.input-group.input-focused .input-border {
  width: 100%;
}

/* Password strength */
.password-strength {
  margin-top: 0.5rem;
}

.strength-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.strength-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-weak .strength-fill {
  background: var(--ion-color-danger);
}

.strength-medium .strength-fill {
  background: var(--ion-color-warning);
}

.strength-strong .strength-fill {
  background: var(--ion-color-success);
}

.strength-text {
  font-size: 0.8rem;
  font-weight: 600;
}

.strength-weak {
  color: var(--ion-color-danger);
}

.strength-medium {
  color: var(--ion-color-warning);
}

.strength-strong {
  color: var(--ion-color-success);
}

/* Auth buttons */
.auth-button {
  position: relative;
  --border-radius: 16px;
  height: 56px;
  font-weight: 600;
  font-size: 1rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-button {
  --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
  --color: white;
}

.register-button {
  --background: linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade));
  --color: white;
}

.auth-button:hover {
  transform: translateY(-2px);
  --box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.auth-button:active {
  transform: translateY(0);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}

.button-icon,
.button-spinner {
  font-size: 1.2rem;
}

.button-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.auth-button:hover .button-ripple {
  width: 300px;
  height: 300px;
  animation: ripple 0.6s linear;
}

/* Features section */
.features-section {
  margin-top: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.feature-item {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.feature-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--ion-color-tertiary), var(--ion-color-tertiary-shade));
  border-radius: 50%;
  margin-bottom: 1rem;
}

.feature-icon {
  font-size: 1.8rem;
  color: white;
}

.feature-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.feature-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

/* Error toast */
.error-toast {
  --background: var(--ion-color-danger);
  --color: white;
  font-weight: 600;
}

/* Responsive design */
@media (max-width: 768px) {
  .auth-container {
    padding: 1rem 0.5rem;
    gap: 1.5rem;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
  }
  
  .logo-background {
    width: 80px;
    height: 80px;
  }
  
  .app-logo {
    font-size: 2.5rem;
  }
  
  .auth-form {
    padding: 1rem;
  }
  
  .form-content {
    gap: 1rem;
  }
  
  .features-grid {
    gap: 1rem;
  }
  
  .feature-item {
    padding: 1rem;
  }
}

@media (min-width: 769px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bg-gradient {
    background: linear-gradient(180deg, 
      var(--ion-color-primary-shade) 0%, 
      var(--ion-color-dark) 50%, 
      var(--ion-color-secondary-shade) 100%);
  }
  
  .card-gradient {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .floating-input {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .input-group.input-focused .floating-input {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .feature-item {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .feature-item:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}
</style>