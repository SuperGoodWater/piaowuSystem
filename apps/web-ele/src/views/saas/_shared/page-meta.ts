export interface SaaSFilterField {
  defaultValue?: boolean | number | string | string[];
  field?: string;
  inputType?:
    | 'date'
    | 'daterange'
    | 'password'
    | 'select'
    | 'switch'
    | 'text'
    | 'textarea';
  label: string;
  options?: readonly { label: string; value: boolean | number | string }[];
  placeholder: string;
  required?: boolean;
  rows?: number;
}

export interface SaaSColumnItem {
  key: string;
  label: string;
}

export interface SaaSFieldItem {
  defaultValue?: boolean | number | string | string[];
  field?: string;
  inputType?:
    | 'date'
    | 'daterange'
    | 'password'
    | 'select'
    | 'switch'
    | 'text'
    | 'textarea';
  label: string;
  note: string;
  options?: readonly { label: string; value: boolean | number | string }[];
  rows?: number;
  required?: boolean;
}

export interface SaaSStatusTransitionItem {
  current: string;
  note: string;
  target: string;
  trigger: string;
}

export interface SaaSInteractionSpec {
  label: string;
  description?: string;
  documentNotes?: readonly string[];
  fields?: readonly SaaSFieldItem[];
  goal?: string;
  permissionPoints?: readonly string[];
  processSteps?: readonly string[];
  statusTransitions?: readonly SaaSStatusTransitionItem[];
}

export interface SaaSActionItem extends SaaSInteractionSpec {
  type?: '' | 'danger' | 'info' | 'primary' | 'success' | 'warning';
}

export interface SaaSSupportAction extends SaaSInteractionSpec {
  route?: string;
  type: 'drawer' | 'hidden-route';
}

export interface SaaSPageMeta {
  actions: readonly SaaSActionItem[];
  columns: readonly SaaSColumnItem[];
  description: string;
  documentNotes?: readonly string[];
  exceptions?: readonly string[];
  fields?: readonly SaaSFieldItem[];
  filters: readonly SaaSFilterField[];
  pageGoal: string;
  pendingItems?: readonly string[];
  permissionPoints?: readonly string[];
  processSteps?: readonly string[];
  rowActions: readonly SaaSActionItem[];
  sampleData: readonly Record<string, string>[];
  statusTransitions?: readonly SaaSStatusTransitionItem[];
  supportActions?: readonly SaaSSupportAction[];
}
