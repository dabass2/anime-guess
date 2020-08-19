<template>
  <v-dialog v-model="dialog" width="500">
    <v-card>
      <v-card-title>Welcome to Anime Guess</v-card-title>
      <v-card-title></v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="startGame">Begin</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
        dialog: null
    }
  },
  methods: {
    startGame() {
        this.$store.dispatch('changeLoginState')
    }
  },
  beforeMount() {
    this.dialog = this.$store.state.loginDone
  }
};
</script>
