<template>
  <v-row align="center" justify="center">
    <v-col cols="auto">
      <v-card width=500>
        <v-card v-if="gameReady">
          <v-img contain height="600" :src="answer.character.image.large"></v-img>
          {{answer.character.name.full}}
        </v-card>
        <v-progress-linear v-model="currTime" color="blue accent-3"></v-progress-linear>
        <v-card-actions>
          <v-row>
            <v-col>
              <v-btn :loading="!gameReady" v-for="choice in choices" :key="choice.id" :disabled="answered && choice.btnDsbl"
                      @click="userAnswered(choice.character.id)" rounded :color="(answered) ? choice.btnColor : color">
                <div v-if="choice.info.title.english" v-text="choice.info.title.english"></div>
                <div v-if="!choice.info.title.english" v-text="choice.info.title.romaji"></div>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
      <v-card>
        {{correct}}
        {{wrong}}
        <v-btn :disabled="!answered" icon @click="gameSetup()"><v-icon>fas fa-arrow-right</v-icon></v-btn>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
var cmpList = []

var url = "https://graphql.anilist.co"

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

function getRand(arr) {
  return Math.floor(Math.random() * arr.length)
}

function getUserAnimeList(id) {
  return new Promise(function(resolve, reject) {
    var variable = {userID: id}

    var options = generateOptions(listQuery, variable)

    fetch(url, options)
        .then(handleResponse)
        .then(data => {
            // this is where it'll return all user info
            // including completed, watching, dropped, and planned lists
            // this just returns the completed list
            resolve(data.data.MediaListCollection.lists[0].entries)
        })
        .catch(error => {
          console.error(error)
          reject()
        })
  })
}

function getRawShowInfo(id) {
  return new Promise(function(resolve, reject) {
    var variable = {id: id}

    var options = generateOptions(charQuery, variable)

    fetch(url, options)
      .then(handleResponse)
      .then(data => {
        let showInfo = {
          "title": data.data.Media.title,
          "cover": data.data.Media.coverImage
        }
        let chars = data.data.Media.characters.edges
        let char = chars[getRand(chars)]
        if (!char) {return null} //sometimes api returns duds so mark as null and deal with later
        return ({"character": char.node, "info": showInfo, "btnDsbl": true, "btnColor": "primary"}) // also store info for buttons
      })
      .then(rtn => {
        resolve(rtn)
      })
      .catch(error => {
        console.error(error)
        reject()
      })
  })
}

function generateChoicesAndAnswer(animeArr) {  // make other value for variable choice amount
  return new Promise(function(resolve, reject) {
    try {
      var choice = null
      var showData = null
      var ans = null
      var rtnArr = []
      var ansIdx = getRand([0,1,2,3])

      // I gotta comment this so I don't forget this monster

      // async forLoop function
      const forLoop = async () => {
        // code execution does not continue until the for loop is done
        for (let i = 0; i < 4; i++) { // replace 4 with however many choices
          // this await is necessary, it keeps execution inside the loop until done
          choice = getRand(animeArr)
          showData = await getRawShowInfo(animeArr[choice].mediaId)
          if (!showData) { // the aforemention deal with later
            i -= 1    // literally just do the loop again lole
            continue
          }
          rtnArr.push(showData)
          if (i == ansIdx) {
            showData["btnDsbl"] = false
            showData["btnColor"] = "success"
            ans = showData
          }
        }
        // this code is NOT run until the for loop ends
        animeArr.splice(choice, 1)
        
        // returns objects with choices and the answer
        resolve({"choices": rtnArr, "answer": ans})
      }
      forLoop() // god I hate javascript
    } catch (error) {
      console.error(error)
      reject()
    }
  })
}

export default {
  name: "GameView",
  data() {
    return {
      answer: {},
      choices: [],
      gameReady: false,
      answered: false,
      color: "primary",
      currTime: 0,
      correct: 0,
      wrong: 0,
    }
  },
  methods: {
    enterUsername() {
      getUserAnimeList(this.$store.state.userId)
      .then(list => { // get user cmpltd anime list
        cmpList = list
        this.gameSetup()
      })
    },
    gameSetup() {
      // console.log(cmpList.length)
      // this.choices = []
      generateChoicesAndAnswer(cmpList)
      .then(choiceAndAns => {
        return choiceAndAns
      })
      .then(rtns => {
        this.answer = rtns.answer
        this.choices = rtns.choices
        this.gameReady = true
        this.answered = false // reset round here
        this.startCounter()
      })
    },
    userAnswered(id) {
      this.answered = true
      if (id == this.answer.character.id) {
        this.correct += 1
        // console.log("Right")
      } else {
        this.wrong += 1
        // console.log("Wrong")
      }
    },
    startCounter() {
      this.currTime = 0
      const clock = setInterval(() => {
        if (this.currTime > 100) {
          clearInterval(clock)
          this.userAnswered(-1)
        } else if (this.answered) {
          clearInterval(clock)
        } else {
          this.currTime += 10
        }
      }, 1000)
    }
  },
  created() {
    this.enterUsername()
  }
}
</script>

<style>
.v-btn__content { width: 100%; white-space: normal; }
</style>