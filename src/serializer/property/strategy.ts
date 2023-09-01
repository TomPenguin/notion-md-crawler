import { defaults } from "./defaults.js";
import { Serializers } from "./types.js";

export const strategy: Serializers = {
  checkbox: defaults.checkbox,
  created_by: defaults.createdBy,
  created_time: defaults.createdTime,
  date: defaults.date,
  email: defaults.email,
  files: defaults.files,
  formula: () => false,
  last_edited_by: () => false,
  last_edited_time: () => false,
  multi_select: () => false,
  number: () => false,
  people: () => false,
  phone_number: () => false,
  relation: () => false,
  rich_text: () => false,
  rollup: () => false,
  select: () => false,
  status: () => false,
  title: defaults.title,
  unique_id: () => false,
  url: () => false,
  verification: () => false,
};
