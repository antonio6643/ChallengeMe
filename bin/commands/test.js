const chalk = require('chalk')
const boxen = require('boxen')
const readlineSync = require('readline-sync')
const moment = require('moment-timezone')
const axios = require('axios').default
const execSync = require('child_process').execSync
const firebaseEncode = require('firebase-encode')

const firebase = require('firebase').default // TODO: remove default. I put it in for autocorrect.
require('firebase/firestore')


let db = firebase.firestore()

module.exports = function(args){

	let code = args[0]

	let fbChallenges = db.collection('challenges')

	fbChallenges.doc(code).get()
		.then((doc) => {
			if(doc.exists){

				console.clear()

				let challenge = doc.data()
				
				let Email = readlineSync.questionEMail("Please enter your email: ")

				let Started = moment().tz("America/New_York").format('LLL')

				// Firing the start webhook
				if(challenge.ResultsWebhook && challenge.NotifyOnStart){
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
				}

				let scores = []

				// Check submissions
				for(let taskNumber=0; taskNumber < challenge.Tasks.length; taskNumber++){
					let taskData = challenge.Tasks[taskNumber]
					let submitted = false
					let passAll = true
					while(!submitted){
						resetDisplay(taskNumber, taskData.Prompt)
						console.log()
						try { // TODO: Move this to be wrapped only around the execSync
							readlineSync.promptCL(function(cmd, ...args){
								let successes = 0
								let totalTrials = 0
								console.log()
								for(let input in taskData.TestCases){
									let desiredOutput = taskData.TestCases[input]
									let givenOutput = execSync(cmd+" "+args.join(" ")+` "${input}"`).toString().trim()
									
									// Always show results for the first Test Case.
									if(totalTrials == 0){
										let SuccessOrFail = desiredOutput == givenOutput ? chalk.bgGreen.bold("SUCCESS") : chalk.bgRed.bold("FAILED")
										
										let message = `SAMPLE CASE - ${SuccessOrFail}`

										message += "\n\n"
										message += `Input : ${chalk.bold.yellow(input)}`
										message += "\n\n"
										message += `Output : ${desiredOutput == givenOutput ? chalk.bold.green(givenOutput) : chalk.bold.red(givenOutput)}`
										message += "\n\n"
										message += `Expected : ${chalk.bold.blue(desiredOutput)}`

										console.log(boxen(message, { padding : 1, borderStyle : 'round', borderColor : 'yellow' }))
									}

									// Calculate how many others are successes
									
									if(desiredOutput == givenOutput){
										successes++
									} else {
										if(passAll){ // Show the first failing case.
											passAll = false

											let message = chalk.bgRed.bold("TEST FAILED")

											message += "\n\n"
											message += `Input : ${chalk.bold.yellow(input)}`
											message += "\n\n"
											message += `Output : ${chalk.bold.red(givenOutput)}`
											message += "\n\n"
											message += `Expected : ${chalk.bold.blue(desiredOutput)}`

											console.log(boxen(message, { padding : 1, borderStyle : 'round', borderColor : 'red' }))

										}
									}
									totalTrials++
								}
								console.log()
								console.log(`Total Successes: ${chalk.bold.green(successes)}/${chalk.bold.yellow(totalTrials)}`)
								console.log()
								let submitThis = readlineSync.keyInYN(chalk.bold.yellow("Would you like to submit this? "))
								if(submitThis){
									scores[taskNumber] = [successes, totalTrials]
									submitted = true
								}
							})
						} catch (err) {
							
							console.log(chalk.bgRed.bold("An error occured trying to run your command."))

							console.log()
							console.log(err.message)
							console.log()


							readlineSync.keyInPause("Press any key to continue")

						}
					}
				}

				// Upload Final Scores to Firebase

				let fbScores = db.collection('scores')

				fbScores.doc(code).update({ [`takers.${firebaseEncode.encode(Email)}`] : scores.join(" | ") })
				

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