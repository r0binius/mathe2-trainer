<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import CircleProgress from '@/components/CircleProgress.vue';
import { topicItems } from '@/domain/content/lookup';
import type { Topic } from '@/domain/content/types';
import { dueItems, tallyOf } from '@/domain/progress/summary';
import { toExam, toLookup, toOverview, toReview, toSettings, toTopic } from '@/routes';
import { useProgressStore } from '@/stores/progress';

const { topics } = defineProps<{
  /** Every topic, listed in the sidebar. */
  topics: readonly Topic[];
}>();

const store = useProgressStore();
const route = useRoute();
const menuOpen = shallowRef(false);
/** Counts restarts of a screen, so the same route can start over with a fresh session. */
const restarts = shallowRef(0);

const due = computed(
  () => dueItems(topics.flatMap(topicItems), store.progress, store.endOfToday).length,
);

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  },
);
</script>

<template>
  <div class="app" :class="{ 'menu-open': menuOpen }">
    <header class="topbar">
      <button
        class="menu-button"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="sidebar"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? 'Schließen' : 'Menü' }}
      </button>
      <RouterLink class="brand" :to="toOverview()">Mathe 2</RouterLink>
      <RouterLink v-if="due > 0" class="due-link" :to="toReview()">{{ due }} fällig</RouterLink>
    </header>

    <nav id="sidebar" class="sidebar" aria-label="Navigation">
      <RouterLink class="brand wide" :to="toOverview()"
        >Mathe 2<span class="sub">Prüfungstrainer</span></RouterLink
      >
      <div class="group">
        <RouterLink class="link" :to="toOverview()">Übersicht</RouterLink>
        <RouterLink class="link" :to="toReview()">
          Wiederholen <span v-if="due > 0" class="badge">{{ due }}</span>
        </RouterLink>
        <RouterLink class="link" :to="toLookup()">Nachschlagen</RouterLink>
        <RouterLink class="link" :to="toExam()">Prüfung</RouterLink>
      </div>
      <p class="caption heading">Kapitel</p>
      <div class="group">
        <RouterLink v-for="topic in topics" :key="topic.id" class="link" :to="toTopic(topic.id)">
          <CircleProgress
            :value="tallyOf(topicItems(topic), store.progress).learned"
            :max="topicItems(topic).length"
            :size="14"
          />
          <span class="name">{{ topic.title }}</span>
        </RouterLink>
      </div>
      <div class="group last">
        <RouterLink class="link" :to="toSettings()">Einstellungen</RouterLink>
      </div>
    </nav>

    <main class="detail">
      <div class="content">
        <p v-if="!store.loaded" class="loading">Fortschritt wird geladen …</p>
        <RouterView v-else v-slot="{ Component }">
          <component
            :is="Component"
            :key="`${route.fullPath}#${restarts}`"
            @restart="restarts += 1"
          />
        </RouterView>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100%;
}

.topbar {
  display: none;
}

/* The sidebar: flat, in the window's color, with a hairline towards the detail. */
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100vh;
  height: 100dvh;
  padding: 16px 8px;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  background-color: var(--color-window);
}

.brand {
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;

  &.wide {
    display: flex;
    flex-direction: column;
    padding: 0 8px 12px;
  }
}

.sub {
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 1px;

  &.last {
    margin-top: auto;
    padding-top: 12px;
  }
}

.heading {
  margin: 14px 8px 4px;
}

.link {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 4px 8px;
  border-radius: var(--radius-control);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background-color: var(--color-fill);
  }

  &.router-link-exact-active {
    background-color: var(--color-fill-hover);
    color: var(--color-text);
    font-weight: 500;
  }
}

.name {
  min-width: 0;
  line-height: 1.25;
}

.badge,
.due-link {
  color: var(--color-due);
  font-family: var(--font-mono);
  font-size: 12px;
}

.badge {
  margin-left: auto;
}

.detail {
  min-width: 0;
  background-color: var(--color-content);
}

.content {
  max-width: 820px;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 28px 28px 40px;
}

.loading {
  color: var(--color-text-secondary);
}

/* On a narrow screen the sidebar becomes a menu below a bar on top. */
@media (max-width: 760px) {
  .app {
    display: block;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: calc(8px + env(safe-area-inset-top, 0px)) 14px 8px;
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-window);
  }

  .menu-button {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background-color: var(--color-raised);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  .due-link {
    margin-left: auto;
    padding: 10px 0 10px 10px;
    cursor: pointer;
  }

  /* An open menu lies over the page, below the bar, and scrolls on its own. */
  .sidebar {
    position: fixed;
    inset: calc(57px + env(safe-area-inset-top, 0px)) 0 0;
    z-index: 2;
    display: none;
    height: auto;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    overscroll-behavior: contain;
    border-right: none;
  }

  .menu-open .sidebar {
    display: flex;
  }

  .brand.wide {
    display: none;
  }

  .link {
    min-height: 44px;
    font-size: 15px;
  }

  .content {
    min-height: 80vh;
    padding: 18px 16px 32px;
  }
}
</style>
