import { defineStore } from 'pinia';
import { computed, inject, shallowRef } from 'vue';

import type { LearnSnapshot } from '@/domain/practice/snapshot';
import type { ExamResult, Progress } from '@/domain/progress/progress';
import { noProgress, recordExam, recordLearning, recordTest } from '@/domain/progress/progress';
import { endOfLocalDay } from '@/domain/scheduling/days';
import { scheduleWithFsrs } from '@/domain/scheduling/fsrs';
import type { Grade, ReviewTime } from '@/domain/scheduling/scheduler';
import { repositoryKey } from '@/ports';

/** A moment with the system's UTC offset, for counting local days. */
export function localTimeAt(at: number): ReviewTime {
  return { at, utcOffsetMinutes: -new Date(at).getTimezoneOffset() };
}

/** The learner's progress: loaded once, changed through pure domain functions, saved on change. */
export const useProgressStore = defineStore('progress', () => {
  const repository = inject(repositoryKey);
  const progress = shallowRef<Progress>(noProgress);
  const loaded = shallowRef(false);
  const saveFailed = shallowRef(false);
  /** The time the screens count "today" from; refreshed with every change. */
  const now = shallowRef(localTimeAt(Date.now()));
  const endOfToday = computed(() => endOfLocalDay(now.value));

  function commit(next: Progress): void {
    progress.value = next;
    now.value = localTimeAt(Date.now());
    void repository?.save(next).then((saved) => {
      saveFailed.value = !saved;
    });
  }

  async function load(): Promise<void> {
    if (repository !== undefined) {
      progress.value = await repository.load();
    }
    loaded.value = true;
  }

  function tested(id: string, grade: Grade, at: number): void {
    commit(recordTest(scheduleWithFsrs, progress.value, { id, grade, ...localTimeAt(at) }));
  }

  function learningChanged(snapshot: LearnSnapshot): void {
    commit(recordLearning(progress.value, snapshot, Date.now()));
  }

  function examFinished(result: ExamResult): void {
    commit(recordExam(progress.value, result));
  }

  function reset(): void {
    commit({ ...noProgress, updatedAt: Date.now() });
  }

  return {
    progress,
    loaded,
    saveFailed,
    now,
    endOfToday,
    load,
    tested,
    learningChanged,
    examFinished,
    reset,
    where: () => repository?.describe() ?? 'browser',
  };
});
