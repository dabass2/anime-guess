<template>
  <v-container fill-height fluid>
    <v-row align="center" justify="center">
      <v-col cols="auto">
        <div class="home">
          <v-card width=500>
            <v-card-title>Guessing Game</v-card-title>
            <v-form>
              <v-text-field
                v-model="username"
                placeholder="Anilist Username"
              ></v-text-field>
              <v-btn @click="enterUsername()">Submit</v-btn>
            </v-form>
            <v-card v-if="gameReady">
              <v-img :src="answer.character.image.large"></v-img>
              {{answer.character.name.full}}
            </v-card>
            <v-card-actions>
              <v-row>
                <v-col>
                  <v-btn :loading="!gameReady" v-for="choice in choices" :key="choice.id" :disabled="answered" @click="userAnswered(choice.character.id)" outlined rounded color="primary">
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
          <v-progress-linear v-model="currTime" color="deep-orange accent-4"></v-progress-linear>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
var cmpList = []

var url = "https://graphql.anilist.co"

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

function getUserId(name) {
  return new Promise(function(resolve, reject) {
    var variable = {name: name}

    var options = generateOptions(userQuery, variable)
    
    fetch(url, options)
        .then(handleResponse)
        .then(data => {
            resolve(data.data.User.id)
        })
        .catch(error => {
          console.error(error)
          reject()
        })
  })
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
        let char = chars[getRand(chars)] // sometimes errors here and then propogates..
        return ({"character": char.node, "info": showInfo}) // custom object with only character & show information
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
          rtnArr.push(showData)
          if (i == ansIdx) {ans = showData}
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
    name: "Game",
    data() {
      return {
        username: '',
        answer: {},
        choices: [],
        gameReady: false,
        answered: false,
        currTime: 0,
        correct: 0,
        wrong: 0,
      }
    },
    methods: {
      enterUsername() {
        // prep username
        this.username = this.username.toLowerCase() 

        // get user id from anilist api
        getUserId(this.username)
        .then(id => {
          return getUserAnimeList(id)
        })
        .then(list => { // get user cmpltd anime list
          cmpList = list
          this.gameSetup()
        })
      },
      gameSetup() {
        this.answered = false // reset round here
        // console.log(cmpList.length)
        generateChoicesAndAnswer(cmpList)
        .then(choiceAndAns => {
          return choiceAndAns
        })
        .then(rtns => {
          this.answer = rtns.answer
          this.choices = rtns.choices
          this.gameReady = true
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
    }
}
</script>


