<template>
  <v-container fill-height fluid>
    <Login></Login>
    <GameView></GameView>
  </v-container>
</template>

<script>
import Login from '../components/Login'
import GameView from '../components/GameView'

export default {
  name: "Game",
  data() {
    return {
      dialog: true
    }
  },
  components: {
    Login,
    GameView
  }
};
</script>


