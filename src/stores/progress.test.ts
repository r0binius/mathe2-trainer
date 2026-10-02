import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import { logStart } from '@/domain/progress/overview';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { ReviewLogEntry } from '@/domain/progress/reviewLog';
import type { SetRecord, StoredProgress } from '@/domain/progress/storedProgress';
import { validMemory } from '@/domain/scheduling/memory.fixture';
import type { Card } from '@/domain/scheduling/scheduler';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { progressRepositoryKey } from '@/ports';

import { useProgressStore } from './progress';

const german = 'com.apple.keylayout.German';
const us = 'com.apple.keylayout.US';
const at = Date.UTC(2026, 8, 28, 10);
const locked = { kind: 'database', message: 'database is locked' } as const;

const apps: readonly AppDefinition[] = [
  {
    id: 'app',
    title: 'App',
    bundleIds: [],
    category: 'productivity',
    catalogs: { de: {}, en: {} },
    sets: [
      {
        id: 'basics',
        title: 'basics.title',
        shortcuts: [
          { title: 'basics.find', keys: [['Meta', 'f']] },
          { title: 'basics.save', keys: [['Meta', 's']] },
        ],
      },
    ],
  },
];

const basics = { appId: 'app', setId: 'basics', layout: german } as const;

const record: SetRecord = {
  ...basics,
  progress: { learned: ['app/Meta+f'], trained: [], updatedAt: at },
};

const card: Card = {
  ...validMemory({ stability: 2, difficulty: 5, lastReviewAt: 0, dueAt: 1000, reps: 1, lapses: 0 }),
  id: 'app/Meta+f',
  layout: german,
};

const stored: StoredProgress = { sets: [record], cards: [card] };

const test = {
  id: 'app/Meta+s',
  layout: german,
  at,
  utcOffsetMinutes: 120,
  failed: false,
  durationMs: 3000,
  keyCount: 2,
} as const;

function repositoryWith(overrides: Partial<ProgressRepository>): ProgressRepository {
  return {
    load: () => Promise.resolve(ok({ progress: stored, skipped: [] })),
    loadLog: () => Promise.resolve(ok([])),
    saveSet: vi.fn(() => Promise.resolve(ok(undefined))),
    recordReview: vi.fn(() => Promise.resolve(ok(undefined))),
    replace: vi.fn(() => Promise.resolve(ok(undefined))),
    reset: () => Promise.resolve(ok(undefined)),
    ...overrides,
  };
}

/** The store in an app that provides `repository`, or none. */
function storeWith(repository?: ProgressRepository) {
  const pinia = createPinia();
  const app = createApp({}).use(pinia);

  if (repository !== undefined) {
    app.provide(progressRepositoryKey, repository);
  }

  return useProgressStore(pinia);
}

describe('load', () => {
  it('loads the progress, and writes nothing back when it matches the data', async () => {
    const repository = repositoryWith({});
    const store = storeWith(repository);

    expect(store.progress).toStrictEqual({ status: 'loading' });
    await store.load(apps);
    expect(store.progress).toStrictEqual({ status: 'loaded', value: stored });
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('writes back what reconciling with the data removed', async () => {
    const gone = { ...card, id: 'app/Meta+x' } as const;
    const progress = { ...stored, cards: [gone] };
    const repository = repositoryWith({
      load: () => Promise.resolve(ok({ progress, skipped: [] })),
    });
    const store = storeWith(repository);

    await store.load(apps);
    expect(store.progress).toStrictEqual({
      status: 'loaded',
      value: { sets: [record], cards: [] },
    });
    expect(repository.replace).toHaveBeenCalledWith({ sets: [record], cards: [] });
  });

  it('warns about stored items that were skipped', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const skipped = [{ path: 'cards[0]', expected: 'valid card memory (difficulty)' }];
    const store = storeWith(
      repositoryWith({ load: () => Promise.resolve(ok({ progress: stored, skipped })) }),
    );

    await store.load(apps);
    expect(warn).toHaveBeenCalledWith(
      'Skipped stored progress at cards[0]: expected valid card memory (difficulty)',
    );
    warn.mockRestore();
  });

  it('shows that loading failed', async () => {
    const store = storeWith(repositoryWith({ load: () => Promise.resolve(err(locked)) }));

    await store.load(apps);
    expect(store.progress).toStrictEqual({ status: 'failed', error: locked });
  });
});

describe('saveLearning', () => {
  const snapshot = {
    shortcuts: ['app/Meta+f', 'app/Meta+s'],
    learned: ['app/Meta+s'],
    trained: [],
    complete: false,
  } as const;
  const saved = {
    ...basics,
    progress: { learned: ['app/Meta+s'], trained: [], updatedAt: at + 1 },
  };

  it('saves the session into the set record, then shows it', async () => {
    const repository = repositoryWith({});
    const store = storeWith(repository);

    await store.load(apps);
    await expect(store.saveLearning(basics, snapshot, at + 1)).resolves.toStrictEqual(
      ok(undefined),
    );
    expect(repository.saveSet).toHaveBeenCalledWith(saved);
    expect(store.progress).toStrictEqual({ status: 'loaded', value: { ...stored, sets: [saved] } });
  });

  it('keeps the progress when saving failed', async () => {
    const store = storeWith(repositoryWith({ saveSet: () => Promise.resolve(err(locked)) }));

    await store.load(apps);
    await expect(store.saveLearning(basics, snapshot, at + 1)).resolves.toStrictEqual(err(locked));
    expect(store.progress).toStrictEqual({ status: 'loaded', value: stored });
  });

  it('refuses before the progress is loaded, so it cannot overwrite what it has not seen', async () => {
    const repository = repositoryWith({});
    const store = storeWith(repository);

    await expect(store.saveLearning(basics, snapshot, at + 1)).resolves.toStrictEqual(
      err({ kind: 'notLoaded', message: 'progress is not loaded yet' }),
    );
    expect(repository.saveSet).not.toHaveBeenCalled();
  });
});

describe('recordReview', () => {
  it('grades the test, logs it with the card it produced, then shows the card', async () => {
    const repository = repositoryWith({});
    const store = storeWith(repository);

    await store.load(apps);
    await store.recordReview(test);

    const [review, created] = vi.mocked(repository.recordReview).mock.calls[0] ?? [];

    expect(review).toStrictEqual({ ...test, grade: 'good' });
    expect(created).toMatchObject({ id: 'app/Meta+s', layout: german, lastReviewAt: at, reps: 1 });
    expect(store.progress).toStrictEqual({
      status: 'loaded',
      value: { ...stored, cards: [card, created] },
    });
  });

  it('logs a failed first test without a card', async () => {
    const repository = repositoryWith({});
    const store = storeWith(repository);

    await store.load(apps);
    await store.recordReview({ ...test, failed: true });
    expect(repository.recordReview).toHaveBeenCalledWith(
      { ...test, failed: true, grade: 'again' },
      undefined,
    );
    expect(store.progress).toStrictEqual({ status: 'loaded', value: stored });
  });
});

describe('loadLog', () => {
  const now = { at, utcOffsetMinutes: 120 };
  const log: readonly ReviewLogEntry[] = [
    { at: at - 1000, utcOffsetMinutes: 120, grade: 'good', failed: false, durationMs: 3000 },
  ];

  it('loads the review log of a layout from a year back', async () => {
    const loadLog = vi.fn(() => Promise.resolve(ok(log)));
    const store = storeWith(repositoryWith({ loadLog }));

    expect(store.log).toStrictEqual({ status: 'loading' });
    await store.loadLog(german, now);
    expect(loadLog).toHaveBeenCalledWith(german, logStart(now));
    expect(store.log).toStrictEqual({ status: 'loaded', value: { layout: german, entries: log } });
  });

  it('shows that loading the log failed', async () => {
    const store = storeWith(repositoryWith({ loadLog: () => Promise.resolve(err(locked)) }));

    await store.loadLog(german, now);
    expect(store.log).toStrictEqual({ status: 'failed', error: locked });
  });

  it('drops a log that arrives after another layout was asked for', async () => {
    const slowly = new Promise<Result<readonly ReviewLogEntry[], PlatformError>>((resolve) => {
      setTimeout(() => {
        resolve(ok(log));
      }, 10);
    });
    const loadLog = vi
      .fn<ProgressRepository['loadLog']>()
      .mockReturnValueOnce(slowly)
      .mockResolvedValueOnce(ok([]));
    const store = storeWith(repositoryWith({ loadLog }));

    const germanLoaded = store.loadLog(german, now);
    await store.loadLog(us, now);
    await germanLoaded;
    expect(store.log).toStrictEqual({ status: 'loaded', value: { layout: us, entries: [] } });
  });

  it('adds a recorded test to the log of its layout, as it was graded', async () => {
    const store = storeWith(repositoryWith({ loadLog: () => Promise.resolve(ok(log)) }));

    await store.load(apps);
    await store.loadLog(german, now);
    await store.recordReview(test);
    expect(store.log).toStrictEqual({
      status: 'loaded',
      value: {
        layout: german,
        entries: [
          ...log,
          {
            at,
            utcOffsetMinutes: 120,
            grade: 'good',
            failed: false,
            durationMs: 3000,
            keyCount: 2,
          },
        ],
      },
    });
  });

  it("grades a test relative to the learner's times in the log of its layout", async () => {
    // A typical time of 1 s makes the 3 s test hard; the fixed limits would call it good.
    const fast = Array.from({ length: 20 }, (_, index) => ({
      at: at - 1000 - index,
      utcOffsetMinutes: 120,
      grade: 'easy' as const,
      failed: false,
      durationMs: 1000,
      keyCount: 2,
    }));
    const repository = repositoryWith({ loadLog: () => Promise.resolve(ok(fast)) });
    const store = storeWith(repository);

    await store.load(apps);
    await store.loadLog(german, now);
    await store.recordReview(test);

    expect(repository.recordReview).toHaveBeenCalledWith(
      { ...test, grade: 'hard' },
      expect.anything(),
    );
  });

  it('grades with the fixed limits while the log is not loaded', async () => {
    const repository = repositoryWith({});
    const store = storeWith(repository);

    await store.load(apps);
    await store.recordReview(test);

    expect(repository.recordReview).toHaveBeenCalledWith(
      { ...test, grade: 'good' },
      expect.anything(),
    );
  });

  it('leaves the log alone when the test was on another layout, or not saved', async () => {
    const store = storeWith(
      repositoryWith({
        loadLog: () => Promise.resolve(ok(log)),
        recordReview: vi
          .fn<ProgressRepository['recordReview']>()
          .mockResolvedValueOnce(ok(undefined))
          .mockResolvedValueOnce(err(locked)),
      }),
    );

    await store.load(apps);
    await store.loadLog(german, now);
    await store.recordReview({ ...test, layout: us });
    await store.recordReview(test);
    expect(store.log).toStrictEqual({ status: 'loaded', value: { layout: german, entries: log } });
  });

  it('empties the log on a reset', async () => {
    const store = storeWith(repositoryWith({ loadLog: () => Promise.resolve(ok(log)) }));

    await store.load(apps);
    await store.loadLog(german, now);
    await store.reset();
    expect(store.log).toStrictEqual({ status: 'loaded', value: { layout: german, entries: [] } });
  });
});

describe('a missing repository', () => {
  it('shows as storage that is not available, instead of a crash', async () => {
    const store = storeWith();

    await store.load(apps);
    expect(store.progress).toStrictEqual({
      status: 'failed',
      error: { kind: 'storage', message: 'no repository was provided to the app' },
    });
  });
});

describe('reset', () => {
  it('shows no progress once it is deleted', async () => {
    const store = storeWith(repositoryWith({}));

    await store.load(apps);
    await expect(store.reset()).resolves.toStrictEqual(ok(undefined));
    expect(store.progress).toStrictEqual({ status: 'loaded', value: { sets: [], cards: [] } });
  });

  it('counts each reset, so a running practice session can tell its progress is gone', async () => {
    const store = storeWith(repositoryWith({}));

    await store.load(apps);
    expect(store.resets).toBe(0);
    await store.reset();
    expect(store.resets).toBe(1);
  });

  it('does not count a reset that failed', async () => {
    const store = storeWith(repositoryWith({ reset: () => Promise.resolve(err(locked)) }));

    await store.load(apps);
    await store.reset();
    expect(store.resets).toBe(0);
  });
});
