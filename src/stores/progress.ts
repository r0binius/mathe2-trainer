import { defineStore } from 'pinia';
import { inject, shallowRef } from 'vue';

import { gradeRecall } from '@/domain/practice/grading';
import type { LearnSnapshot } from '@/domain/practice/snapshot';
import { progressChanged, reconcileProgress } from '@/domain/progress/reconcile';
import type { LoggedReview } from '@/domain/progress/repository';
import { recordLearning } from '@/domain/progress/setProgress';
import type { SetKey, StoredProgress } from '@/domain/progress/storedProgress';
import { cardOf, setProgressOf, withCard, withSetRecord } from '@/domain/progress/storedProgress';
import { scheduleWithFsrs } from '@/domain/scheduling/fsrs';
import { reviewCard } from '@/domain/scheduling/scheduler';
import type { Loadable } from '@/domain/shared/loadable';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';
import type { StorageError } from '@/domain/shared/storage';
import type { AppDefinition } from '@/domain/shortcuts/types';

import { missingProgressRepository, progressRepositoryKey } from './repositories';

/** A test that counts for reviews, as the session reports it, plus when and on which layout. */
export type TestResult = Omit<LoggedReview, 'grade'>;

const notLoaded: StorageError = { kind: 'notLoaded', message: 'progress is not loaded yet' };

/**
 * Learning progress and review cards on every layout. Loading reconciles them with the app data;
 * a change is computed by the domain, saved, and only then shown.
 */
export const useProgressStore = defineStore('progress', () => {
  const repository = inject(progressRepositoryKey, missingProgressRepository);
  const progress = shallowRef<Loadable<StoredProgress>>({ status: 'loading' });

  /** Applies a saved change to the progress shown. */
  function show(change: (stored: StoredProgress) => StoredProgress): void {
    if (progress.value.status === 'loaded') {
      progress.value = { status: 'loaded', value: change(progress.value.value) };
    }
  }

  async function load(apps: readonly AppDefinition[]): Promise<void> {
    const loaded = await repository.load();

    if (loaded.kind === 'err') {
      progress.value = { status: 'failed', error: loaded.error };
      return;
    }

    loaded.value.skipped.forEach(({ path, expected }) => {
      console.warn(`Skipped stored progress at ${path}: expected ${expected}`);
    });

    const stored = loaded.value.progress;
    const reconciled = reconcileProgress(stored, apps);

    // Shown even if writing it back fails: it only lacks what the data no longer has, and the
    // next start reconciles again.
    progress.value = { status: 'loaded', value: reconciled };

    if (progressChanged(stored, reconciled)) {
      const written = await repository.replace(reconciled);

      if (written.kind === 'err') {
        console.warn(`Could not write back reconciled progress: ${written.error.message}`);
      }
    }
  }

  async function saveLearning(
    key: SetKey,
    snapshot: LearnSnapshot,
    at: number,
  ): Promise<Result<void, StorageError>> {
    if (progress.value.status !== 'loaded') {
      return err(notLoaded);
    }

    const current = setProgressOf(progress.value.value, key);
    const record = { ...key, progress: recordLearning(current, snapshot, at) };
    const saved = await repository.saveSet(record);

    if (saved.kind === 'ok') {
      show((stored) => withSetRecord(stored, record));
    }

    return saved;
  }

  async function recordReview(test: TestResult): Promise<Result<void, StorageError>> {
    if (progress.value.status !== 'loaded') {
      return err(notLoaded);
    }

    const review = { ...test, grade: gradeRecall(test) };
    const card = reviewCard(scheduleWithFsrs, cardOf(progress.value.value, test), review);
    const saved = await repository.recordReview(review, card);

    if (saved.kind === 'ok' && card !== undefined) {
      show((stored) => withCard(stored, card));
    }

    return saved;
  }

  async function reset(): Promise<Result<void, StorageError>> {
    const deleted = await repository.reset();

    if (deleted.kind === 'ok') {
      progress.value = { status: 'loaded', value: { sets: [], cards: [] } };
    }

    return deleted.kind === 'ok' ? ok(undefined) : deleted;
  }

  return { progress, load, saveLearning, recordReview, reset };
});
