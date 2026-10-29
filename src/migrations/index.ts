import * as migration_20261005_145507_initial from './20261005_145507_initial';
import * as migration_20261029_172945_add_legacy_member_fields from './20261029_172945_add_legacy_member_fields';

export const migrations = [
  {
    up: migration_20261005_145507_initial.up,
    down: migration_20261005_145507_initial.down,
    name: '20261005_145507_initial',
  },
  {
    up: migration_20261029_172945_add_legacy_member_fields.up,
    down: migration_20261029_172945_add_legacy_member_fields.down,
    name: '20261029_172945_add_legacy_member_fields'
  },
];
