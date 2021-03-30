#!/usr/bin/env node
const chalk = require('chalk')
const boxen = require('boxen')
const yargs = require('yargs')
const readlineSync = require('readline-sync')
const moment = require('moment-timezone')
const axios = require('axios').default
const execSync = require('child_process').execSync

const firebase = require('firebase').default // TODO: remove default. I put it in for autocorrect.
require('firebase/firestore')

firebase.initializeApp({
	apiKey : "AIzaSyC0pNg20qFlLVgxwG-fWJFQ-BEt0Yj-tKk",
	authDomain : "challengeme-9e492.firebaseapp.com",
	projectId : "challengeme-9e492"
})

let db = firebase.firestore()

const titleBoxOptions = {
	padding : 1,
	margin : 1,
	borderStyle : 'round',
	borderColor : 'yellow',
}

const titleBox = boxen( chalk.white.bold("ChallengeMe CLI"), titleBoxOptions )

console.log(titleBox)

const args = yargs
	.command("create", "Start the challenge creation steps")
	.argv;

let command = args._[0]; // TODO: Double-check if this is the correct way to do commands

if(command == 'create'){

	let ChallengeJSON = {
		Name : "",
		
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
		console.log("Below you will be asked to provide some test inputs and outputs. To stop providing samples, type #STOP as an input.")

		let numTestCases = 0 // Since we can't get the length of a dictionary
		while(true){
			let input = readlineSync.question(`Sample Input #${numTestCases}: `)
			if(input.trim() == "#STOP"){
				break
			}
			let output = readlineSync.question(`Sample Output #${numTestCases}: `)
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
	
	fbChallenges.add(ChallengeJSON)
		.then((res) => {
			console.log(`Your Challenge Code is: ${chalk.bold.red(res.id)}`)
			console.log()
			console.log("To have someone take your challenge, simply give them the above code and have them use it.")
		})
		.catch((err) => {
			console.log("Failed to save to firestore. Please report the error below.")
			console.error(err)
		})

} else if(command == "test"){

	let code = args._[1]

	let fbChallenges = db.collection('challenges')

	fbChallenges.doc(code).get()
		.then((doc) => {
			if(doc.exists){

				console.clear()

				let challenge = doc.data()
				
				let Email = readlineSync.questionEMail("Please enter your email: ")

				let Started = moment().tz("America/New_York").format('LLL')

				// Firing the start webhook
				if(challenge.ResultsWebhook){
					let startData = {
						content : "User started trial.",
						embeds : [
							{
								title : "Challenge Started",
								fields : [
									{
										name : "Email",
										value : Email,
										inline : false
									},
									{
										name : "Started Timestamp",
										value : Started
									}
								],
								color : 0xfcba03
							}
						]
					}
					axios.post(challenge.ResultsWebhook, startData)
						.then((res) => {
							// success.
						})
						.catch((err) => {
							// ultimately not a big deal if it fails.
						})
				}

				function resetDisplay(taskNumber, Prompt){
					console.clear()
					console.log()
					console.log(chalk.bold.green(`Task #${taskNumber}: `), Prompt)
					console.log()
					console.log("To test your program, type the console command to run it below. It will be tested against sample cases until it fails.")
					console.log("If you're ready to submit, type "+chalk.bold.yellow("SUBMIT"))
				}

				let scores = []

				// Check submissions
				for(let taskNumber=0; taskNumber < challenge.Tasks.length; taskNumber++){
					let taskData = challenge.Tasks[taskNumber]
					let submitted = false
					while(!submitted){
						resetDisplay(taskNumber, taskData.Prompt)
						readlineSync.promptCL(function(cmd, ...args){
							let successes = 0
							let totalTrials = 0
							for(let input in taskData.TestCases){
								let desiredOutput = taskData.TestCases[input]
								let givenOutput = execSync(cmd+" "+args.join(" ")+` "${input}"`).toString().trim()
								console.log(givenOutput)
								if(desiredOutput == givenOutput){
									console.log(`${input} -> ${chalk.bgGreen.bold("SUCCESS")}`)
									successes++
								} else {
									passAll = false
									console.log(`${input} -> ${givenOutput} ${chalk.bgRed.bold("FAILED!")} | Expected: ${desiredOutput}`)
								}
								totalTrials++
							}
							console.log(`Total Successes: ${chalk.bold.green(successes)}/${chalk.bold.yellow(totalTrials)}`)
							let submitThis = readlineSync.keyInYN("Would you like to submit this? ")
							if(submitThis){
								scores[taskNumber] = [successes, totalTrials]
								submitted = true
							}
						})
					}
				}

				// Submit Final Scores to the webhook

				let scoreHookData = {
					content : "Trial Submitted",
					embeds : [
						{
							title : "User Submitted Trial",
							description : `Submitted at ${moment().tz("America/New_York").format('LLL')}`,
							fields : [
								{
									name : "Email",
									value : Email,
									inline : false
								},
							],
							color : 0x00de00
						}
					]
				}

				for(let s=0; s < scores.length; s++){
					let score = scores[s]
					scoreHookData.embeds[0].fields.push({
						name : `Task #${s}`,
						value : `${score[0]}/${score[1]}`,
						inline : true
					})
					console.log(`Score for Task #${s} : ${score[0]}/${score[1]}`)
				}

				axios.post(challenge.ResultsWebhook, scoreHookData)
					.then((res) => {
						console.log("Scores sent successfully! You may close this window.")
					})
					.catch((err) => {
						console.log("Error sending scores. Please report this.")
						console.error(err)
					})

			} else {
				console.log("Challenge not found.")
			}
		})
		.catch((err) => {
			console.log("An error occured. Please report the information below.")
			console.error(err)
		})

}