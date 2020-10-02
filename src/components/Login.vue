<template>
  <v-dialog v-model="dialog" width="500" persistent>
    <v-card>
      <v-card-title>Welcome to Anime Guess</v-card-title>
      <v-card-text>
        <v-form>
          <v-menu v-model="siteChooser" :position-x="x" :position-y="y">
            <v-list>
              <v-list-item v-for="(site, index) in siteChoices" :key="index" @click="changeSite(site)">{{site}}</v-list-item>
            </v-list>
          </v-menu>
          <v-text-field
            v-model="username"
            prepend-icon="fas fa-angle-down"
            @click:prepend="show"
            :placeholder="fieldPlaceholder"
          >
          </v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="!userFound" @click="submitUsername" color="primary" :loading="isLoading">Submit Name</v-btn>
        <v-btn v-else @click="gameBegin" color="success">Begin</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>

    <v-alert
      v-model="error"
      transition="scale-transition"
      type="error"
      dismissible
    >
      {{errorMsg}}
    </v-alert>
  </v-dialog>
</template>

<script>
const jikanjs = require("jikanjs")

var url = "https://graphql.anilist.co"

var userQuery = `
query ($name: String) {
  User (name: $name) {
    id
  }
}
`

function generateOptions(query, variable) {
    return {method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-type": "application/json"
        },
        body: JSON.stringify({
            query: query,
            variables: variable
        })
    }
}

function handleResponse(response) {
    return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json)
    });
}

function getAnilistUserId(name) {
  return new Promise(function(resolve, reject) {
    var variable = {name: name}

    var options = generateOptions(userQuery, variable)
    
    fetch(url, options)
        .then(handleResponse)
        .then(data => {
            resolve(data.data.User.id)
        })
        .catch(error => {
          console.error(error.errors[0].status)
          reject(error.errors[0].status)
        })
  })
}

function getMALAnimelist(name, itr) {
  return new Promise(function(resolve, reject) {
    // console.log(itr)
    jikanjs.loadUser(name, 'animelist', `completed/${itr}`)
    .then((response) => {
      // console.log(response.anime)
      resolve(response.anime)
    }).catch((error) => {
      console.log(error)
      reject(error)
    })
  })
}

function getMALUserList(name) {
  return new Promise(function(resolve, reject) {
    try {
      let idList = null
      let currList = []
      let i = 1
      
      const forLoop = async () => { 
        for (;;) { // this is stupid
          idList = await getMALAnimelist(name, i)
          // console.log(idList.length)
          if (idList.length === 0) {
            break
          }

          currList = currList.concat(idList)
          i += 1
        }
        resolve(currList)
      }

      forLoop() // god I hate javascript still

    } catch(error) {
      console.error(error)
      reject(error)
    }  
    })
}

export default {
  name: "Login",
  data() {
    return {
      userFound: false,
      dialog: null,
      isLoading: false,
      fieldPlaceholder: 'Anilist Username',
      site: 'Anilist',
      siteChooser: false,
      siteChoices: ["Anilist", "MAL"],
      username: '',
      userId: null,
      error: false,
      errorMsg: "An error has occured. Please try again soon.",
      x: 0,
      y: 0
    }
  },
  methods: {
    gameBegin() {
      this.$store.dispatch('toggleConfigState')
      this.$emit('ready', true)
    },
    changeSite(site) {
      this.fieldPlaceholder = `${site} Username`
      this.site = site
    },
    submitUsername() {
      this.isLoading = true
      this.username = this.username.toLowerCase()
      this.$store.dispatch('changeUsername', this.username)

      if (this.site === "Anilist") {
        getAnilistUserId(this.username)
        .then(id => {
          this.$store.dispatch('changeId', id)
          this.userId = id
          this.userFound = true
        })
        .catch(error => {
          if (error == 404) {
            this.errorMsg = "User not found. Please check spelling and try again."
          }
          this.error = true
          this.isLoading = false
        })
      } else {
        getMALUserList(this.username)
        .then(list => {
          let malIdList = []
          list.forEach(anime => {
            malIdList.push({"mediaId": anime.mal_id})
          })
          // console.log(malIdList)
          this.$store.dispatch("changeSiteChoice", this.site)
          this.$store.dispatch("changeMalAniList", malIdList)
          this.userFound = true
        })
        .catch(error => {
          this.errorMsg = error
          this.error = true
          this.isLoading = false
        })
      }
    },
    show(e) { // lol
      e.preventDefault()
      this.siteChooser = false
      this.x = e.clientX
      this.y = e.clientY
      this.$nextTick(() => {
        this.siteChooser = true
      })
    },
  },
  created() {
    this.dialog = this.$store.state.configDone
  }
};
</script>
