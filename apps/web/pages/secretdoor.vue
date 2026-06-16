<template>
  <v-container class="route-shell">
    <v-card
      class="login-card"
      max-width="520"
    >
      <form @submit.prevent="submitLogin">
        <p class="eyebrow">
          {{ $t("login.eyebrow") }}
        </p>
        <h1>Secret Door</h1>
        <v-text-field
          v-model="name"
          class="mt-6"
          :disabled="loading"
          :label="$t('login.name')"
          name="name"
          required
        />
        <v-text-field
          v-model="password"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          class="mt-2"
          :disabled="loading"
          :label="$t('login.password')"
          name="password"
          required
          :type="showPassword ? 'text' : 'password'"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-alert
          v-if="errorMessage"
          class="mt-2"
          density="compact"
          type="error"
        >
          {{ errorMessage }}
        </v-alert>
        <v-card-actions class="login-actions">
          <v-btn
            color="primary"
            :loading="loading"
            type="submit"
            variant="flat"
          >
            {{ $t("login.submit") }}
          </v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from "#imports";
import { ref } from "vue";
import { useAuthStore } from "../stores/auth.js";

const auth = useAuthStore();
const router = useRouter();
const name = ref("");
const password = ref("");
const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref("");

const submitLogin = async (): Promise<void> => {
  errorMessage.value = "";
  loading.value = true;

  try {
    await auth.login({ name: name.value, password: password.value });
    await router.push("/list");
  } catch {
    errorMessage.value = "Usuário não encontrado ou senha incorreta";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.route-shell {
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 40px);
  padding-block: 32px;
}

.login-card {
  align-self: start;
  border-radius: 8px;
  padding: 24px;
  width: min(100%, 520px);
}

.eyebrow {
  color: rgb(var(--v-theme-secondary));
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}

h1 {
  color: rgb(var(--v-theme-primary));
  font-size: 2rem;
  letter-spacing: 0;
  line-height: 1.15;
  margin: 0;
}

.login-actions {
  justify-content: end;
  padding-inline: 0;
}
</style>
