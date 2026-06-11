<template>
  <v-main>
    <v-container class="page-shell">
      <section class="intro">
        <p class="eyebrow">
          {{ $t("home.eyebrow") }}
        </p>
        <h1>{{ $t("home.title") }}</h1>
        <p class="subtitle">
          {{ $t("home.subtitle") }}
        </p>
      </section>
    </v-container>
  </v-main>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.intro {
  max-width: 680px;
}

.eyebrow {
  margin: 0 0 12px;
  color: rgb(var(--v-theme-secondary));
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: rgb(var(--v-theme-primary));
  font-size: 3rem;
  line-height: 1.05;
  letter-spacing: 0;
}

.subtitle {
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.125rem;
  line-height: 1.6;
}

@media (max-width: 640px) {
  h1 {
    font-size: 2.25rem;
  }

  .subtitle {
    font-size: 1rem;
  }
}
</style>
