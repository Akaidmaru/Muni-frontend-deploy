<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import logoCompleto from '@/assets/images/Logo-completo.png'
import api from '@/services/axios'

const router = useRouter()
const route = useRoute()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const resolveRouteEmail = () => {
  const rawEmail = route.query.email
  if (Array.isArray(rawEmail)) {
    return (rawEmail[0] || '').trim()
  }
  return String(rawEmail || '').trim()
}

// Get email from route query param
const fullEmail = ref(resolveRouteEmail())
const hasValidEmail = computed(() => EMAIL_REGEX.test(fullEmail.value))

// Mask the email for display
const maskedEmail = computed(() => {
  const email = fullEmail.value
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.charAt(0)
  const masked = visible + '*'.repeat(Math.max(local.length - 1, 5))
  return `${masked}@${domain}`
})

// 6 digit code inputs
const codeDigits = ref(['', '', '', '', '', ''])
const inputRefs = ref([])

const setInputRef = (el, index) => {
  if (el) inputRefs.value[index] = el
}

const handleInput = (index, event) => {
  const value = event.target.value
  // Only allow digits
  if (!/^\d*$/.test(value)) {
    codeDigits.value[index] = ''
    return
  }
  // Take only last character if multiple chars pasted/typed
  codeDigits.value[index] = value.slice(-1)
  // Auto-advance to next input
  if (value && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handleKeydown = (index, event) => {
  if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < pastedData.length; i++) {
    codeDigits.value[i] = pastedData[i]
  }
  // Focus last filled or next empty
  const focusIndex = Math.min(pastedData.length, 5)
  inputRefs.value[focusIndex]?.focus()
}

// Timer for resend code
const TIMER_DURATION = 60 // seconds
const timeLeft = ref(TIMER_DURATION)
let timerInterval = null

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const canResend = computed(() => timeLeft.value === 0)

const startTimer = () => {
  timeLeft.value = TIMER_DURATION
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
}

onUnmounted(() => {
  clearInterval(timerInterval)
})

// View state: 'verify' | 'success' | 'change-email'
const currentView = ref('verify')

// Loading / error state
const isVerifying = ref(false)
const isSendingCode = ref(false)
const isUpdatingEmail = ref(false)
const errorMessage = ref('')

// Change email
const newEmail = ref('')

const fullCode = computed(() => codeDigits.value.join(''))
const isCodeComplete = computed(() => fullCode.value.length === 6)

const getBackendMessage = (error, fallback) => {
  const backendMessage = error?.response?.data?.message
  if (Array.isArray(backendMessage)) {
    return backendMessage.join(', ')
  }
  return backendMessage || fallback
}

const sendVerificationCode = async (email) => {
  await api.post('/auth/send-verification-code', { email })
}

const fetchVerificationStatus = async (email) => {
  const { data } = await api.post('/auth/verification-status', { email })
  return data
}

const handleVerify = async () => {
  if (!isCodeComplete.value || !hasValidEmail.value) return
  errorMessage.value = ''
  isVerifying.value = true

  try {
    await api.post('/auth/verify-code', {
      email: fullEmail.value,
      code: fullCode.value,
    })

    // Show success state
    currentView.value = 'success'
  } catch (error) {
    errorMessage.value = getBackendMessage(
      error,
      'Código incorrecto. Por favor, inténtelo de nuevo.',
    )
    // Clear inputs
    codeDigits.value = ['', '', '', '', '', '']
    inputRefs.value[0]?.focus()
  } finally {
    isVerifying.value = false
  }
}

const handleContinue = () => {
  router.push({ name: 'login' })
}

const resendCode = async () => {
  if (!canResend.value || !hasValidEmail.value || isSendingCode.value) return
  errorMessage.value = ''
  isSendingCode.value = true

  try {
    await sendVerificationCode(fullEmail.value)
    startTimer()
  } catch (error) {
    errorMessage.value = getBackendMessage(
      error,
      'Error al reenviar el código. Inténtelo de nuevo.',
    )
  } finally {
    isSendingCode.value = false
  }
}

const goBack = () => {
  if (currentView.value === 'change-email') {
    currentView.value = 'verify'
  } else {
    router.push({ name: 'register' })
  }
}

const changeEmail = () => {
  newEmail.value = ''
  errorMessage.value = ''
  currentView.value = 'change-email'
}

const backToVerification = () => {
  currentView.value = 'verify'
}

const handleUpdateEmail = async () => {
  if (!newEmail.value || isUpdatingEmail.value) return

  const nextEmail = newEmail.value.trim()
  if (!EMAIL_REGEX.test(nextEmail)) {
    errorMessage.value = 'Ingrese un correo electrónico válido.'
    return
  }

  errorMessage.value = ''
  isUpdatingEmail.value = true

  try {
    await api.post('/auth/update-verification-email', {
      oldEmail: fullEmail.value,
      newEmail: nextEmail,
    })

    fullEmail.value = nextEmail
    newEmail.value = ''
    codeDigits.value = ['', '', '', '', '', '']
    currentView.value = 'verify'
    startTimer()
    setTimeout(() => inputRefs.value[0]?.focus(), 100)
  } catch (error) {
    errorMessage.value = getBackendMessage(
      error,
      'No fue posible cambiar el correo para verificación.',
    )
  } finally {
    isUpdatingEmail.value = false
  }
}

const initializeVerification = async () => {
  if (!hasValidEmail.value) {
    errorMessage.value = 'No se encontró un correo válido para verificar.'
    return
  }

  const alreadySent = route.query.sent === '1'
  isSendingCode.value = true

  try {
    const status = await fetchVerificationStatus(fullEmail.value)
    if (status?.isVerified) {
      currentView.value = 'success'
      clearInterval(timerInterval)
      timeLeft.value = 0
      return
    }

    if (!alreadySent) {
      await sendVerificationCode(fullEmail.value)
      await router.replace({
        query: {
          ...route.query,
          sent: '1',
        },
      })
    }
  } catch (error) {
    errorMessage.value = getBackendMessage(
      error,
      'No fue posible iniciar la verificación de correo.',
    )
  } finally {
    isSendingCode.value = false
  }
}

onMounted(async () => {
  startTimer()
  // Focus first input on mount
  setTimeout(() => inputRefs.value[0]?.focus(), 100)
  await initializeVerification()
})
</script>

<template>
  <div class="verify-page">
    <!-- Header: back button + logo on same row -->
    <header class="verify-header">
      <button @click="goBack" class="back-button" aria-label="Volver atrás">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>

      <router-link to="/" class="logo-link">
        <img :src="logoCompleto" alt="Transportes Flores Vargas" class="logo-img" />
      </router-link>

      <!-- Invisible spacer to keep logo centered -->
      <div class="header-spacer"></div>
    </header>

    <!-- Card: Verification form -->
    <div v-if="currentView === 'verify'" class="verify-card">
      <!-- Envelope icon -->
      <div class="icon-wrapper">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1F4E79" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 4L12 13L2 4" />
          <path d="M2 20l6.4-6.4" />
          <path d="M22 20l-6.4-6.4" />
        </svg>
      </div>

      <h1 class="verify-title">Verifica tu identidad</h1>

      <p class="verify-description">
        Hemos enviado un código de 6 dígitos a su correo electrónico:
        <strong>{{ maskedEmail }}</strong>. Por favor, introdúzcalo a continuación.
      </p>

      <!-- Error message -->
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <!-- Code inputs -->
      <div class="code-inputs" @paste="handlePaste">
        <input v-for="(digit, index) in codeDigits" :key="index" :ref="(el) => setInputRef(el, index)" type="text"
          inputmode="numeric" maxlength="1" :value="digit" @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)" class="code-input" :class="{ 'code-input--filled': digit }"
          :disabled="isVerifying || isSendingCode" autocomplete="one-time-code" />
      </div>

      <!-- Verify button -->
      <button @click="handleVerify" :disabled="!isCodeComplete || isVerifying || isSendingCode || !hasValidEmail" class="verify-button">
        <span v-if="isVerifying" class="spinner"></span>
        <span v-else>Verificar código</span>
      </button>

      <!-- Resend info -->
      <p class="resend-info">
        ¿No recibió el código? Puede solicitar uno nuevo en
        <strong>{{ formattedTime }}</strong>
      </p>
      <button v-if="canResend" @click="resendCode" :disabled="isSendingCode || !hasValidEmail" class="resend-button">
        {{ isSendingCode ? 'Enviando...' : 'Reenviar código' }}
      </button>

      <!-- Change email -->
      <button @click="changeEmail" class="change-email-link">
        Cambiar dirección de correo electrónico
      </button>
    </div>

    <!-- Card: Success state -->
    <div v-else-if="currentView === 'success'" class="verify-card success-card">
      <!-- Checkmark icon -->
      <div class="icon-wrapper icon-wrapper--success">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 class="verify-title">Código verificado con éxito</h1>

      <p class="verify-description">
        Su identidad ha sido confirmada correctamente.<br />
        Gracias por usar nuestro servicio.
      </p>

      <p class="success-email">{{ maskedEmail }}</p>

      <button @click="handleContinue" class="verify-button">
        Continuar
      </button>
    </div>

    <!-- Card: Change email -->
    <div v-else-if="currentView === 'change-email'" class="verify-card success-card">
      <!-- Envelope icon -->
      <div class="icon-wrapper">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1F4E79" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 4L12 13L2 4" />
          <path d="M2 20l6.4-6.4" />
          <path d="M22 20l-6.4-6.4" />
        </svg>
      </div>

      <h1 class="verify-title">Cambiar dirección de correo electrónico</h1>

      <p class="verify-description">
        Introduce tu nueva dirección de correo electrónico para continuar.
      </p>

      <!-- Error message -->
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <!-- Email input -->
      <div class="email-input-wrapper">
        <input
          v-model="newEmail"
          type="email"
          placeholder="Ingresa tu email"
          class="email-input"
          @keyup.enter="handleUpdateEmail"
        />
      </div>

      <!-- Update button -->
      <button @click="handleUpdateEmail" :disabled="!newEmail || isUpdatingEmail" class="verify-button">
        {{ isUpdatingEmail ? 'Actualizando...' : 'Actualizar correo' }}
      </button>

      <!-- Back to verification -->
      <button @click="backToVerification" class="change-email-link">
        Volver a la verificación
      </button>
    </div>
  </div>
</template>

<style scoped>
.verify-page {
  min-height: 100vh;
  background-color: #F2F3F5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1rem 2rem 1rem;
}

/* ── Header row ─────────────────────────────── */
.verify-header {
  width: calc(100% + 2rem);
  margin-left: -1rem;
  margin-right: -1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  margin-bottom: 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ── Back button ────────────────────────────── */
.back-button {
  background: none;
  border: none;
  color: #1C1C1C;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.back-button:hover {
  background-color: rgba(0, 0, 0, 0.06);
  transform: translateX(-2px);
}

.back-icon {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1C1C1C;
  line-height: 1;
  user-select: none;
}

/* Invisible spacer to balance the back button and keep logo centered */
.header-spacer {
  width: 40px;
  flex-shrink: 0;
}

/* ── Logo ───────────────────────────────────── */
.logo-link {
  display: flex;
  justify-content: center;
}

.logo-img {
  height: 4rem;
  width: auto;
  object-fit: contain;
  transition: opacity 0.2s;
}

.logo-img:hover {
  opacity: 0.8;
}

/* ── Card ───────────────────────────────────── */
.verify-card {
  background: #ffffff;
  border: 1.5px solid #d1d5db;
  border-radius: 1rem;
  padding: 2.5rem 3rem;
  max-width: 580px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* ── Icon ───────────────────────────────────── */
.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #E6F0FA;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

/* ── Title ──────────────────────────────────── */
.verify-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0F0F0F;
  margin: 0 0 0.75rem 0;
}

/* ── Description ────────────────────────────── */
.verify-description {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  color: #5A5A5A;
  line-height: 1.6;
  margin: 0 0 1.75rem 0;
  max-width: 420px;
}

.verify-description strong {
  color: #1C1C1C;
}

/* ── Error message ──────────────────────────── */
.error-message {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: #dc2626;
  margin: -0.5rem 0 1rem 0;
  padding: 0.5rem 1rem;
  background: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
}

/* ── Code inputs ────────────────────────────── */
.code-inputs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.code-input {
  width: 52px;
  height: 60px;
  text-align: center;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #0F0F0F;
  border: 1.5px solid #d1d5db;
  border-radius: 0.625rem;
  background: #ffffff;
  outline: none;
  transition: all 0.2s ease;
  caret-color: #1F4E79;
}

.code-input:focus {
  border-color: #1F4E79;
  box-shadow: 0 0 0 3px rgba(31, 78, 121, 0.15);
}

.code-input--filled {
  border-color: #1F4E79;
  background: #f8fbff;
}

.code-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Verify button ──────────────────────────── */
.verify-button {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #1F4E79;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 2.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.verify-button:hover:not(:disabled) {
  background-color: #3F7FB8;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.verify-button:active:not(:disabled) {
  transform: scale(0.97);
}

.verify-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Spinner ────────────────────────────────── */
.spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Resend info ────────────────────────────── */
.resend-info {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: #5A5A5A;
  margin: 0 0 0.5rem 0;
}

.resend-info strong {
  color: #0F0F0F;
  font-weight: 700;
}

.resend-button {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1F4E79;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  margin-bottom: 0.75rem;
  text-decoration: underline;
}

.resend-button:hover {
  color: #3F7FB8;
  background: rgba(31, 78, 121, 0.06);
}

/* ── Change email ──────────────────────────── */
.change-email-link {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: #1F4E79;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.25rem;
  transition: color 0.2s ease;
  margin-top: 0.25rem;
}

.change-email-link:hover {
  color: #3F7FB8;
}

/* ── Success state ──────────────────────────── */
.success-card {
  animation: fadeInUp 0.4s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-wrapper--success {
  background: #dcfce7;
}

.success-email {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1C1C1C;
  margin: 0 0 1.75rem 0;
}

/* ── Change email input ─────────────────────── */
.email-input-wrapper {
  width: 100%;
  max-width: 360px;
  margin-bottom: 1.5rem;
}

.email-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  color: #0F0F0F;
  border: 1.5px solid #d1d5db;
  border-radius: 0.5rem;
  background: #ffffff;
  outline: none;
  transition: all 0.2s ease;
}

.email-input::placeholder {
  color: #9ca3af;
}

.email-input:focus {
  border-color: #1F4E79;
  box-shadow: 0 0 0 3px rgba(31, 78, 121, 0.15);
}

/* ── Responsive ─────────────────────────────── */
@media (max-width: 640px) {
  .verify-card {
    padding: 2rem 1.5rem;
  }

  .code-inputs {
    gap: 0.5rem;
  }

  .code-input {
    width: 44px;
    height: 52px;
    font-size: 1.25rem;
  }

  .verify-title {
    font-size: 1.25rem;
  }

  .verify-description {
    font-size: 0.85rem;
  }
}
</style>
