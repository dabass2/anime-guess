import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
      loginDone: true,
  },
  mutations: {
      setLoginState(state) {
          state.loginDone = !state.loginDone
      }
  },
  actions: {
      changeLoginState({commit}) {
          commit("setLoginState")
      }
  }
})