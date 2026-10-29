import * as migration_20261005_145507_initial from './20261005_145507_initial';
import * as migration_20261029_172945_add_legacy_member_fields from './20261029_172945_add_legacy_member_fields';
import * as migration_20261029_182623_midtrans_payment_fields from './20261029_182623_midtrans_payment_fields';
import * as migration_20261029_190320_pages_collection from './20261029_190320_pages_collection';
import * as migration_20261029_190400_seed_terms_and_help from './20261029_190400_seed_terms_and_help';

export const migrations = [
  {
    up: migration_20261005_145507_initial.up,
    down: migration_20261005_145507_initial.down,
    name: '20261005_145507_initial',
  },
  {
    up: migration_20261029_172945_add_legacy_member_fields.up,
    down: migration_20261029_172945_add_legacy_member_fields.down,
    name: '20261029_172945_add_legacy_member_fields',
  },
  {
    up: migration_20261029_182623_midtrans_payment_fields.up,
    down: migration_20261029_182623_midtrans_payment_fields.down,
    name: '20261029_182623_midtrans_payment_fields',
  },
  {
    up: migration_20261029_190320_pages_collection.up,
    down: migration_20261029_190320_pages_collection.down,
    name: '20261029_190320_pages_collection',
  },
  {
    up: migration_20261029_190400_seed_terms_and_help.up,
    down: migration_20261029_190400_seed_terms_and_help.down,
    name: '20261029_190400_seed_terms_and_help',
  },
];
