<template>
  <v-container fill-height fluid>
    <Login @ready="test" v-if="!ready"></Login>
    <GameView v-if="ready"></GameView>
  </v-container>
</template>

<script>
import Login from '../components/Login'
import GameView from '../components/GameView'

export default {
  name: "Game",
  data() {
    return {
      ready: false
    }
  },
  components: {
    Login,
    GameView
  },
  methods: {
    test(value) {
      this.ready = value
    }
  }
};
</script>


