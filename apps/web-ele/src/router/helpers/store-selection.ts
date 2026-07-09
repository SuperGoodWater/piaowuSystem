interface SelectedStore {
  id: string;
  name: string;
  type: string;
}

const SELECTED_STORE_KEY = 'vben:selected-store';
const STORE_SELECT_PATH = '/store-select';

function clearSelectedStore() {
  sessionStorage.removeItem(SELECTED_STORE_KEY);
}

function getSelectedStore(): null | SelectedStore {
  const value = sessionStorage.getItem(SELECTED_STORE_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as SelectedStore;
  } catch {
    clearSelectedStore();
    return null;
  }
}

function setSelectedStore(store: SelectedStore) {
  sessionStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(store));
}

export {
  clearSelectedStore,
  getSelectedStore,
  setSelectedStore,
  STORE_SELECT_PATH,
};
