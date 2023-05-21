<script setup lang="ts">
import { savedTabList, houseKeepTabGroupCount } from '~/logic/storage'
import { getMessage } from '~/background/i18n';
import 'bootstrap'

import { useSnackbar } from "vue3-snackbar";
const snackbar = useSnackbar();
const props = defineProps({
  tabTitle: String
})
const parsedSavedTabList = computed<any[]>(() => JSON.parse(savedTabList.value));

async function closeTab(tab: any) {
  await chrome.tabs.remove(tab.id);
  fetchCurrentTabs(tabList.value);
}
async function closeTabGroup(groupTab: any) {
  // console.log(groupTab.childTabs);
  for (const childTab of groupTab.childTabs) {
    await chrome.tabs.remove(childTab.id);
  }
  fetchCurrentTabs(tabList.value);
}

function activeTab(tabId: number) {
  chrome.tabs.update(tabId, { active: true });
}

async function toggleCollapseExpand(groupTab: any) {
  chrome.tabGroups.update(groupTab.id, {
    collapsed: !groupTab.collapsed
  });
  groupTab.collapsed = !groupTab.collapsed
}

async function editColor(tab: any) {
  tab.isUnderEditColor = !tab.isUnderEditColor;
}
function changeTabColor(tab: any, color: string) {
  tab.color = color;
  chrome.tabGroups.update(tab.id, {
    color: tab.color
  });
}

async function editTitle(tab: any) {
  tab.isUnderEditTitle = true;
  let editTitleInput = document.getElementById("tab-group-title-" + tab.id);
  if (editTitleInput) {
    await nextTick();
    editTitleInput.focus();
  }
}

function bindTitle(tab: any) {
  chrome.tabGroups.update(tab.id, {
    title: tab.title
  });
  tab.isUnderEditTitle = false;
  // emit('fetchTabs', tabList);
  fetchCurrentTabs(tabList.value);
}

async function togglePinned(tab: any) {
  await chrome.tabs.update(tab.id, {
    pinned: !tab.pinned
  });
  fetchCurrentTabs(tabList.value);
}

function saveTab(tab: any, showSnackbar: boolean = true) {
  tab.updateDate = new Date().toLocaleString();
  tab.uuid = crypto.randomUUID();
  const findedTab = parsedSavedTabList.value.find((savedTab) => savedTab.url === tab.url);
  if (findedTab) {
    Object.keys(findedTab).forEach(key => delete findedTab[key]);
    Object.assign(findedTab, tab);
  } else {
    parsedSavedTabList.value.push(tab);
  }
  savedTabList.value = JSON.stringify(parsedSavedTabList.value);
  if (showSnackbar) {
    snackbar.add({ type: 'success', text: 'saved!' });
  }
}

function saveTabGroup(tab: any, showSnackbar: boolean = true) {
  let tmpTabList: any = [];
  tmpTabList = parsedSavedTabList.value;

  tab.updateDate = new Date().toLocaleString();
  tab.uuid = crypto.randomUUID();
  tab.collapsed = true; // 開いた状態で保存すると見づらいため、閉じた状態で保存する
  // const findedTab = parsedSavedTabList.value.find((savedTab) => savedTab.isGroup && savedTab.title === tab.title);
  const findedTabs: Array<any> = [];
  parsedSavedTabList.value.forEach((savedTab) => {
    if (savedTab.isGroup && savedTab.title === tab.title) {
      findedTabs.push(savedTab);
    }
  });
  // console.log("findedTabs", findedTabs);
  let findedTabGroupsIds: Array<string> = [];
  findedTabs.forEach(tabItem => {
    findedTabGroupsIds.push(tabItem.childTabs.map((childTabItem: any) => childTabItem.id).join(''));
  });
  let targetSaveTabGroupsId = tab.childTabs.map((childTabItem: any) => childTabItem.id).join('');
  console.log(
    'check already saved tabgroups by confirm same id strings',
    findedTabGroupsIds,
    targetSaveTabGroupsId
  );
  if (findedTabGroupsIds.includes(targetSaveTabGroupsId)) {
    if (showSnackbar) {
      snackbar.add({ type: 'info', text: 'already saved!' });
    }
    return; // 保存されている子タブと同じなため保存をスキップ
  }

  if (findedTabs && findedTabs.length >= houseKeepTabGroupCount.value) {
    findedTabs.sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
    // console.log("findedTabs sorted", findedTabs);
    const targetDeleteTabs = findedTabs.slice(houseKeepTabGroupCount.value - 1);
    const targetDeleteTabsUUIDs = targetDeleteTabs.map(tabItem => tabItem.uuid);
    tmpTabList = parsedSavedTabList.value.filter(tabItem => !targetDeleteTabsUUIDs.includes(tabItem.uuid));
    tmpTabList.push(tab);
    // console.log("tmpTabList findedTabs", tmpTabList);
  } else {
    tmpTabList.push(tab);
    // console.log("tmpTabList not findedTabs", tmpTabList);
  }
  savedTabList.value = JSON.stringify(tmpTabList);
  if (showSnackbar) {
    snackbar.add({ type: 'success', text: 'saved!' });
  }
}

function saveAllTabs() {
  const targetSaveTabs = tabList.value.filter((tabItem) => !tabItem.isGroup);
  const targetSaveTabGroups = tabList.value.filter((tabItem) => tabItem.isGroup);
  for (const tab of targetSaveTabs) {
    saveTab(tab, false);
  }
  for (const tabGroup of targetSaveTabGroups) {
    saveTabGroup(tabGroup, false);
  }
  snackbar.add({ type: 'success', text: 'saved all tabs!' });
}

function saveAllTabGroups() {
  const targetSaveTabGroups = tabList.value.filter((tabItem) => tabItem.isGroup);
  for (const tabGroup of targetSaveTabGroups) {
    saveTabGroup(tabGroup, false);
  }
  snackbar.add({ type: 'success', text: 'saved all group tabs!' });
}


function saveAndCloseTabGroup(tab: any) {
  saveTabGroup(tab);
  closeTabGroup(tab);
}

function saveAndCloseTab(tab: any) {
  saveTab(tab);
  closeTab(tab);
}


const QueryInWindow = {
  windowId: chrome.windows.WINDOW_ID_CURRENT,
};
const tabList: Ref<Array<any>> = ref([]);
watch(tabList, () => { fetchCurrentTabs(tabList.value) });

async function fetchCurrentTabs(tabList: Array<any>) {
  // (async () => {
  // let tabListTmp = [];
  let tabGroups: Array<chrome.tabGroups.TabGroup> = [];
  tabGroups = await chrome.tabGroups.query(QueryInWindow);
  let tabs: Array<chrome.tabs.Tab> = [];
  tabs = await chrome.tabs.query(QueryInWindow);
  // console.log(tabs);
  // console.log("tabList before", tabList);
  tabList.splice(0, tabList.length); // 初期化
  // console.log("tabList after", tabList);
  for (const tab of tabs) {
    let tabObj: any = tab;
    // console.log(tab);
    // tabObj.isChild = tab.groupId === -1 ? false : true;
    let tabGroup = tabGroups.find((tabGroup) => tabGroup.id === tab.groupId);
    if (tabGroup) {
      // console.log("タブグループ");
      // タブグループ配下
      let tabGroupObj: any = tabGroup;
      let findedTabGroup: any = tabList.find((tabItem: any) => tabItem.id === (tabGroup && tabGroup.id));
      // let findedTabGroup: any = tabList.value.find((tabItem: any) => tabItem.id === (tabGroup && tabGroup.id));
      // let findedTabGroup: any = tabList.value.find((tabItem) => tabItem.id === (tabGroup && tabGroup.id));
      if (findedTabGroup) {
        // console.log("タブグループ追加済み");
        findedTabGroup.index = tabObj.index;
        Object.assign(findedTabGroup, tabGroup);
        // 既にタブグループを追加している場合
        let findedChildTabItem = findedTabGroup.childTabs.find((tabItem: any) => tabItem.id === tabObj.id);
        if (findedChildTabItem) {
          Object.assign(findedChildTabItem, tabObj);
          // findedChildTabItem = tabObj;
        } else {
          findedTabGroup.childTabs.push(tabObj);
        }
      } else {
        // console.log("タブグループ未追加");
        // タブグループがまだ追加されていない場合
        tabGroupObj.isGroup = true;
        tabGroupObj.index = tabObj.index;
        tabGroupObj.childTabs = [];
        tabGroupObj.childTabs.push(tabObj);
        tabList.push(tabGroupObj);
      }
    } else {
      // グループ以外
      // console.log("グループ以外");
      let findedTabItem = tabList.find((tabItem: any) => tabItem.id === tabObj.id);
      // let findedTabItem = tabList.value.find((tabItem: any) => tabItem.id === tabObj.id);
      if (findedTabItem) {
        // console.log("タブ存在する", findedTabItem);
        Object.assign(findedTabItem, tabObj);
        // findedTabItem = tabObj;
      } else {
        // console.log("タブ存在しない");
        tabList.push(tabObj);
        // tabList.value.push(tabObj);
      }
    }
  }
  // console.log(tabList.value);
  tabList = tabList.sort((t1: any, t2: any) => {
    const t1Idx: number = t1 && t1.index ? t1.index : 0;
    const t2Idx: number = t2 && t2.index ? t2.index : 0;
    return t1Idx - t2Idx;
  });
  currentTabsCount.value = (await chrome.tabs.query(QueryInWindow)).length;
}

const currentTabsCount = ref(0);

// console.log("tabList", tabList);
fetchCurrentTabs(tabList.value);

</script>
<template>
  <div class="mx-2 my-3">
    <div class="d-flex justify-content-between">
      <div class="fs-5 fw-bold">
        <span>{{ props.tabTitle }}</span>
      </div>
      <div>
        <span class="mx-2" role="button">
          <span class="tab-menu pointer">
          </span>
        </span>
        <span class="mx-2" role="button">
          <span class="tab-menu pointer" @click="saveAllTabGroups()" :title="getMessage('saveCurrentAllTabGroups')">
            <ic:outline-photo-camera />
          </span>
        </span>
        <span class="mx-2" role="button">
          <span class="tab-menu pointer" @click="saveAllTabs()" :title="getMessage('saveCurrentAllTabs')">
            <ic:round-flip-camera-ios />
          </span>
        </span>
        <span class="mx-2">
          <span class="badge rounded-pill bg-secondary">{{ currentTabsCount + ' tabs' }}</span>
        </span>
      </div>
    </div>
  </div>
  <ul class="list-group list-scroll">
    <template
      v-for="    tab    of                                                                  tabList                                                                 ">

      <template v-if="tab.isGroup">
        <!-- タブグループの場合 -->
        <li class="list-group-custom mx-3">
          <div class="d-flex justify-content-between">

            <div class="position-relative" style="width: 400px;z-index: 2;" role="button">
              <div class="text-truncate">
                <material-symbols:tab-group-sharp class="d-inline-block size-20 align-text-bottom me-2"
                  :class="'tab-group-' + tab.color" @click="editColor(tab)" />
                <span class="group-name me-2" v-if="!tab.isUnderEditTitle" @click="editTitle(tab)">
                  <template v-if="tab.title === ''">untitled</template>
                  <template v-if="tab.title !== ''">{{ tab.title }}</template>
                </span>
                <input :class="tab.isUnderEditTitle ? '' : 'd-none'" class="me-2" type="text"
                  :id="'tab-group-title-' + tab.id" v-model="tab.title" v-on:keydown.enter="bindTitle(tab)"
                  v-on:blur="bindTitle(tab)">
                <span class="badge rounded-pill bg-secondary">{{ tab.childTabs.length + ' tabs' }}</span>
                <template v-if="tab.collapsed">
                  <span class="ms-1 me-2">
                    <ph:dots-three />
                  </span>
                  <span class="me-2" v-for="    childTabs    of    tab.childTabs   ">
                    <img class="tabs-favicon me-1" :src="`/_favicon/?pageUrl=${encodeURIComponent(childTabs.url)}`">
                  </span>
                </template>
                <template v-if="tab.isUnderEditColor">
                  <div :id="'tab-group-title-' + tab.id" class="mt-1" v-on:blur="tab.isUnderEditColor = false;">
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'grey')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-grey" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'blue')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-blue" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'red')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-red" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'yellow')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-yellow" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'green')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-green" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'pink')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-pink" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'purple')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-purple" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'cyan')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-cyan" />
                    <material-symbols:tab-group-sharp @click=" changeTabColor(tab, 'orange')"
                      class="d-inline-block rounded-circle size-20 align-text-bottom me-2 tab-group-orange" />
                  </div>
                </template>
              </div>
              <mdi:plus-thick v-if="tab.collapsed" class="state-indicator" @click=" toggleCollapseExpand(tab);" />
              <mdi:minus-thick v-if="!tab.collapsed" class="state-indicator" @click=" toggleCollapseExpand(tab);" />
            </div>

            <div class="d-flex">
              <div class="mx-2" role="button" @click=" toggleCollapseExpand(tab);">
                <span class="tab-menu pointer" v-if="tab.collapsed" :title="getMessage('expand')">
                  <material-symbols:keyboard-arrow-down-rounded />
                </span>
                <span class="tab-menu pointer" v-else :title="getMessage('collapse')">
                  <material-symbols:keyboard-arrow-up-rounded />
                </span>
              </div>
              <div class="mx-2" role="button">
                <span class="tab-menu pointer" :title="getMessage('popupSaveGroup')" @click=" saveTabGroup(tab)">
                  <material-symbols:save-as-sharp />
                </span>
              </div>
              <div class="mx-2" role="button">
                <span class="tab-menu pointer" :title="getMessage('popupSaveAndCloseGroup')"
                  @click=" saveAndCloseTabGroup(tab)">
                  <fluent-mdl2:save-and-close />
                </span>
              </div>
              <div class="mx-2" role="button" @click=" closeTabGroup(tab)" :title="getMessage('popupCloseGroup')">
                <span class="tab-menu pointer">
                  <CarbonClose />
                </span>
              </div>
            </div>
          </div>
        </li>
        <template
          v-for="                                                                           childTab                                                                            of                                                                            tab.childTabs                                                                           ">
          <!-- タブグループ以外 -->
          <li class="list-group-custom mx-3" :class="tab.collapsed ? 'd-none' : ''">
            <div class="d-flex justify-content-between">
              <div class="tab-in-group position-relative" style="width: 400px;z-index:1;" role="button"
                @click=" activeTab(childTab.id)" :title="childTab.url">
                <div class="text-truncate">
                  <img class="tabs-favicon me-1" :src="`/_favicon/?pageUrl=${encodeURIComponent(childTab.url)}`">
                  <span class="badge rounded-pill bg-primary" v-if="childTab.active">Active</span>
                  {{ childTab.title }}
                </div>
                <ic:baseline-push-pin v-if="childTab.pinned" class="state-indicator" />
              </div>
              <div class="d-flex">
                <div class="mx-2" role="button">
                  <span class="tab-menu pointer" v-if="!childTab.pinned" @click=" togglePinned(childTab)"
                    :title="getMessage('pinned')">
                    <ic:baseline-push-pin />
                  </span>
                  <span class="tab-menu pointer" v-if="childTab.pinned" @click=" togglePinned(childTab)"
                    :title="getMessage('unpinned')">
                    <ic:baseline-pin-off />
                  </span>
                </div>
                <div class="mx-2" role="button">
                  <span class="tab-menu pointer" :title="getMessage('popupSaveTab')" @click=" saveTab(childTab)">
                    <material-symbols:save-as-sharp />
                  </span>
                </div>
                <div class="mx-2" role="button">
                  <span class="tab-menu pointer" :title="getMessage('popupSaveAndCloseTab')"
                    @click=" saveAndCloseTab(childTab)">
                    <fluent-mdl2:save-and-close />
                  </span>
                </div>
                <div class="mx-2" role="button" @click=" closeTab(childTab)" :title="getMessage('popupCloseTab')">
                  <span class="tab-menu pointer">
                    <CarbonClose />
                  </span>
                </div>
              </div>
            </div>
          </li>
        </template>
      </template>

      <template v-else>
        <!-- タブグループ以外 -->
        <li class="list-group-custom mx-3">
          <div class="d-flex justify-content-between">
            <div class="position-relative" style="width: 400px;z-index:1;" role="button" @click=" activeTab(tab.id)"
              :title="tab.url">
              <div class="text-truncate">
                <img class="tabs-favicon me-1" :src="`/_favicon/?pageUrl=${encodeURIComponent(tab.url)}`">
                <span class="badge rounded-pill bg-primary" v-if="tab.active">Active</span>
                {{ tab.title }}
              </div>
              <ic:baseline-push-pin v-if="tab.pinned" class="state-indicator" />
            </div>
            <div class="d-flex">
              <div class="mx-2" role="button">
                <span class="tab-menu pointer" v-if="!tab.pinned" @click=" togglePinned(tab)"
                  :title="getMessage('pinned')">
                  <ic:baseline-push-pin />
                </span>
                <span class="tab-menu pointer" v-if="tab.pinned" @click=" togglePinned(tab)"
                  :title="getMessage('unpinned')">
                  <ic:baseline-pin-off />
                </span>
              </div>
              <div class="mx-2" role="button">
                <span class="tab-menu pointer" :title="getMessage('popupSaveTab')" @click=" saveTab(tab)">
                  <material-symbols:save-as-sharp />
                </span>
              </div>
              <div class="mx-2" role="button">
                <span class="tab-menu pointer" :title="getMessage('popupSaveAndCloseTab')" @click=" saveAndCloseTab(tab)">
                  <fluent-mdl2:save-and-close />
                </span>
              </div>
              <div class="mx-2" role="button" @click=" closeTab(tab)" :title="getMessage('popupCloseTab')">
                <span class="tab-menu pointer">
                  <CarbonClose />
                </span>
              </div>
            </div>
          </div>
        </li>
      </template>
    </template>

  </ul>
</template>
