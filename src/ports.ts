import type { InjectionKey, ShallowRef } from 'vue';

import type { ProgressRepository } from './platform/storage';
import type { Tutor } from './platform/tutor';

/** Where the app provides the progress repository to the store. */
export const repositoryKey: InjectionKey<ProgressRepository> = Symbol('progress repository');

/** Where the app provides the tutor, once it's known whether there is one. */
export const tutorKey: InjectionKey<Readonly<ShallowRef<Tutor | undefined>>> = Symbol('tutor');
