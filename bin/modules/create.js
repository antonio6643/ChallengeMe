const chalk = require('chalk')
const readlineSync = require('readline-sync')

const firebase = require('firebase').default // TODO: remove default. I put it in for autocorrect.
require('firebase/firestore')

let db = firebase.firestore()

module.exports = function(user){
	let ChallengeJSON = {
		Name : "",

		Creator : user.uid,
		
		Time : 0,

		Tasks : [],

		NotifyOnStart : false,

		ResultsWebhook : "", // Discord Webhook
	}

	ChallengeJSON.Name = readlineSync.question("Enter a name for this challenge: ")

	ChallengeJSON.Time = Math.abs(readlineSync.questionInt("How many minutes should the user get? "))

	let numTasks = Math.abs(readlineSync.questionInt("How many tasks are there? "))
	numTasks = Math.max(Math.min(numTasks, 5), 1)

	console.log(chalk.bold.yellow("────────────────────────────────────────"))

	for(let n=0; n < numTasks; n++){
		let nthTaskData = {
			Prompt : "",
			TestCases : {}
		}
		nthTaskData.Prompt = readlineSync.question(chalk.bold.green(`Task #${chalk.bold.yellow(n)} Prompt: `))
		console.log()
		console.log(`Below you will be asked to provide some test inputs and outputs. To stop providing samples, type ${chalk.bold.yellow("#STOP")} as an input.`)

		let numTestCases = 0 // Since we can't get the length of a dictionary
		while(true){
			let input = readlineSync.question(chalk.bold.yellow(`Sample Input #${numTestCases}: `))
			if(input.trim() == "#STOP"){
				break
			}
			let output = readlineSync.question(chalk.bold.blue(`Sample Output #${numTestCases}: `))
			nthTaskData.TestCases[input] = output
			numTestCases++
		}

		ChallengeJSON.Tasks.push(nthTaskData)

		console.log(chalk.bold.yellow("────────────────────────────────────────"))
	}

	ChallengeJSON.NotifyOnStart = readlineSync.keyInYN("Do you want to be notified when the user starts? (Y/N)")

	ChallengeJSON.ResultsWebhook = readlineSync.question("Please paste a Discord webhook to send results to: ", {
		limit : /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
		limitMessage : "Invalid link specified."
	})

	console.log()
	console.log(chalk.bold.blue("────────────────────────────────────────"))
		
	let fbChallenges = db.collection('challenges')
	let fbScores = db.collection('scores')

	fbChallenges.add(ChallengeJSON)
		.then((res) => {

			fbScores.doc(res.id).set({ takers : {}, Creator : user.uid })

			console.log(`Your Challenge Code is: ${chalk.bold.red(res.id)}`)
			console.log()
			console.log("To have someone take your challenge, simply give them the above code and have them use it.")
		})
		.catch((err) => {
			console.log("Failed to save to firestore. Please report the error below.")
			console.error(err)
		})

}