import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    configDone: true,
    username: "",
    userId: null,
    malAniList: null,
    siteChoice: "Anilist"
  },
  mutations: {
    setConfigState(state) {
      state.configDone = !state.configDone;
    },
    setUsername(state, name) {
      state.username = name;
    },
    setUserId(state, id) {
      state.userId = id;
    },
    setAniList(state, arr) {
      state.malAniList = arr;
    },
    setSiteChoice(state, site) {
      state.siteChoice = site;
    }
  },
  actions: {
    toggleConfigState({ commit }) {
      commit("setConfigState");
    },
    changeUsername({ commit }, name) {
      commit("setUsername", name);
    },
    changeId({ commit }, id) {
      commit("setUserId", id);
    },
    changeMalAniList({ commit }, arr) {
      commit("setAniList", arr)
    },
    changeSiteChoice({ commit }, site) {
      commit("setSiteChoice", site)
    }
  }
});
