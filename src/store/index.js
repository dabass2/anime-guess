import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
      configDone: true,
      username: '',
      userId: null,
  },
  mutations: {
      setConfigState(state) {
          state.configDone = !state.configDone
      },
      setUsername(state, name) {
          state.username = name
      },
      setUserId(state, id) {
          state.userId = id
      }
  },
  actions: {
      toggleConfigState({commit}) {
          commit("setConfigState")
      },
      changeUsername({commit}, name) {
          commit("setUsername", name)
      },
      changeId({commit}, id) {
          commit("setUserId", id)
      }
  }
})