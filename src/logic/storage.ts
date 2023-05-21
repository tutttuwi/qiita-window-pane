import { useStorageLocal } from '~/composables/useStorageLocal';

export const storageDemo = useStorageLocal('webext-demo', 'Storage Demo');
export const savedTabList = useStorageLocal('savedTabList', '[]', {
  listenToStorageChanges: true,
});
console.log('----- savedTabList -----', savedTabList);

export const houseKeepTabGroupCount = useStorageLocal('houseKeepTabGroupCount', 2, {
  listenToStorageChanges: true,
});

export const isAutoSaveTabGroup = useStorageLocal('isAutoSaveTabGroup', true, {
  listenToStorageChanges: true,
});

export const autoSaveTabGroupPerMinites = useStorageLocal('autoSaveTabGroupPerMinites', 60, {
  listenToStorageChanges: true,
});

export const showNotificationWhenAutoSaveTabGroup = useStorageLocal(
  'showNotificationWhenAutoSaveTabGroup',
  true,
  {
    listenToStorageChanges: true,
  }
);

export const sortSetting = useStorageLocal(
  'sortSetting',
  { updateDate: 'desc', title: 'asc', group: 'asc' },
  {
    listenToStorageChanges: true,
  }
);

/**
 * ストレージクラス<br/>
 * データ保存用クラス、chromeストレージAPIをラップ、キー情報管理
 */
export class Storage {
  constructor() {
    // NOP
  }

  /**
   * ストレージ保存.
   * @param {string} key
   * @param {any} value
   */
  async setItem(key: string, value: any) {
    chrome.storage.local.set({ [key]: value }).then(() => {
      console.log(`Set key: ${key} - value: ${value}`);
    });
  }

  /**
   * ストレージ情報取得.
   * @param {string} key
   * @returns - 返却データ
   */
  async getItem(key: string) {
    const item = await chrome.storage.local.get([key]).then((result) => {
      console.log(`Get key: ${key} - value: ${result[key]}`);
      return result[key];
    });
    return item;
  }

  /**
   * ストレージ情報全削除.
   */
  clearAllItem() {
    chrome.storage.local.clear(() => {
      console.log(`Clear All Items`);
    });
  }
}
