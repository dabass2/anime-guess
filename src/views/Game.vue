<template>
  <div class="home">
    <v-card width=500>
      <v-card-title>Hello me</v-card-title>
      <v-form>
        <v-text-field
          ref="guestUsername"
          v-model="username"
          placeholder="notfunstuff"
        ></v-text-field>
        <v-btn @click="getUsername()">Submit</v-btn>
      </v-form>
      <v-card v-if="hasChoices">
        <v-img :src="answer.character.image.medium"></v-img>
        {{answer.character.name.full}}
      </v-card>
      <v-card-actions>
        <!-- <v-btn :disabled="answered" @click="answered = !answered">hello</v-btn>
        <v-btn :disabled="answered" @click="answered = !answered">goode</v-btn>
        <v-btn :disabled="answered" @click="answered = !answered">wowow</v-btn>
        <v-btn :disabled="answered" @click="answered = !answered">fffff</v-btn> -->
        <v-card max-width="80" v-for="choice in choices" :key="choice.id" :disabled="answered" @click="test(choice.character.id)" elevation=".9" ripple>
          {{choice.info.title.english}}
        </v-card>
        <!-- <v-btn icon @click="answered = false"><v-icon>fas fa-arrow-left</v-icon></v-btn> -->
        <v-btn :disabled="!answered && notStart" icon @click="getInfo()"><v-icon>fas fa-arrow-right</v-icon></v-btn>
      </v-card-actions>
    </v-card>
    <v-card>
      {{correctCount}}
      {{wrongCount}}
    </v-card>
  </div>
</template>

<script>
var userQuery = `
query ($name: String) {
  User (name: $name) {
    id
  }
}
`

var listQuery = `
query ($userID: Int) {
  MediaListCollection (userId: $userID, type: ANIME) {
    user {
      name
    }
    lists {
      name
      entries {
        mediaId
      }
    }
  }
}
`

var charQuery = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      large
      extraLarge
      medium
      color
    }
    characters(page: 1) {
      edges { # Array of character edges
        node {
         	id
          name {
            first
            last
            full
            native
          }
          image {
            large
            medium
          }
        }
      }
    }
  }
}
`

function handleResponse(response) {
    return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json)
    });
}

function getRand(arr) {
  return Math.floor(Math.random() * arr.length)
}

function handleError(error) {
    console.error(error)
}

export default {
  name: "Game",
  data() {
    return {
      username: '',
      usrID: null,
      animeList: [],
      choices: [],
      answer: [],
      hasChoices: false,
      answered: false,
      correct: false,
      notStart: true,
      correctCount: 0,
      wrongCount: 0,
    };
  },
  methods: {
    getInfo() {
      this.choices = []
      this.answered = false
      var variables = {
        userID: this.usrID
      }
      var url = "https://graphql.anilist.co",
          options = {
              method: "POST",
              headers: {
                  "Accept": "application/json",
                  "Content-type": "application/json"
              },
              body: JSON.stringify({
              query: listQuery,
              variables: variables
              })
      };
      fetch(url, options)
        .then(handleResponse)
        .then(data => {
          this.animeList = data.data.MediaListCollection.lists[0].entries
          
          function getChoices(arr) {
            var choice = null

            var answer = getRand(arr)
            var temp = [answer]
            
            for (let i = 0; i < 3; i++) {
              choice = getRand(arr)
              while (temp.includes(choice)) {
                choice = getRand(arr)
              }
              temp.push(choice)
            }
            return temp
          }

          // console.log(this.animeList[0].mediaId)
          let tempChoices = getChoices(this.animeList) // 0th element is always the answer
          console.log(tempChoices)
          // let f = this.animeList[tempChoices[0]].mediaId
          let idx = getRand([0, 1, 2, 3])
          for (let i = 0; i < tempChoices.length; i++) {
            let id = this.animeList[tempChoices[i]].mediaId
            let tmp = {}
            var variables = {
              id: id,
            };
            var url = "https://graphql.anilist.co",
                options = {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify({
                    query: charQuery,
                    variables: variables
                    })
            };
            fetch(url, options)
              .then(handleResponse)
              .then((data) => {
                // console.log(data.data.Media)
                let showInfo = {
                  "title": data.data.Media.title,
                  "cover": data.data.Media.coverImage
                }
                let chars = data.data.Media.characters.edges
                // console.log(chars)
                let char = chars[getRand(chars)]
                // console.log(char.node)
                tmp = {"character": char.node, "info": showInfo}
                this.choices.push(tmp)
                if (i == idx) {
                  this.answer = tmp
                }
              })
            .catch(handleError)
          }
        })
        .catch(handleError)
        console.log(this.choices)
        if (this.choices) {
          this.hasChoices = true
        }
    },
    getUsername() {
      this.username = this.username.toLowerCase()
      var variables = {
        name: this.username,
      };
      var url = "https://graphql.anilist.co",
          options = {
              method: "POST",
              headers: {
                  "Accept": "application/json",
                  "Content-type": "application/json"
              },
              body: JSON.stringify({
              query: userQuery,
              variables: variables
              })
      };
      fetch(url, options)
        .then(handleResponse)
        .then((data) => {
          this.usrID = data.data.User.id
          console.log(this.usrID)
        })
        .catch(handleError)
        this.notStart = false
    },
    test(id) {
      this.answered = true
      console.log(id)
      if (id == this.answer.character.id) {
        console.log('right')
        this.correctCount += 1
      } else {
        this.wrongCount += 1
      }
    }
  }
};
</script>


