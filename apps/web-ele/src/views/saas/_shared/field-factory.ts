import type { SaaSFieldItem, SaaSFilterField } from './page-meta';

type FieldValue = boolean | number | string | string[];
type FieldOption = { label: string; value: boolean | number | string };

interface BaseFieldInput {
  defaultValue?: FieldValue;
  field: string;
  label: string;
  required?: boolean;
}

interface BaseActionFieldInput extends BaseFieldInput {
  note: string;
}

interface BaseFilterInput extends BaseFieldInput {
  placeholder?: string;
}

export function createTextField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'text',
  };
}

export function createPasswordField(
  input: BaseActionFieldInput,
): SaaSFieldItem {
  return {
    ...input,
    inputType: 'password',
  };
}

export function createTextareaField(
  input: BaseActionFieldInput & {
    rows?: number;
  },
): SaaSFieldItem {
  return {
    ...input,
    inputType: 'textarea',
  };
}

export function createSelectField(
  input: BaseActionFieldInput & {
    options: readonly FieldOption[];
  },
): SaaSFieldItem {
  return {
    ...input,
    inputType: 'select',
  };
}

export function createDateRangeField(
  input: BaseActionFieldInput,
): SaaSFieldItem {
  return {
    ...input,
    inputType: 'daterange',
  };
}

export function createTextFilter(input: BaseFilterInput): SaaSFilterField {
  return {
    ...input,
    inputType: 'text',
    placeholder: input.placeholder ?? `请输入${input.label}`,
  };
}

export function createSelectFilter(
  input: BaseFilterInput & {
    options: readonly FieldOption[];
  },
): SaaSFilterField {
  return {
    ...input,
    inputType: 'select',
    placeholder: input.placeholder ?? `请选择${input.label}`,
  };
}
