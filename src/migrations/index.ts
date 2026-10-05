import * as migration_20261005_145507_initial from './20261005_145507_initial';

export const migrations = [
  {
    up: migration_20261005_145507_initial.up,
    down: migration_20261005_145507_initial.down,
    name: '20261005_145507_initial'
  },
];
