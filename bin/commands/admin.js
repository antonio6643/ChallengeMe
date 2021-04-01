const chalk = require('chalk')
const boxen = require('boxen')
const readlineSync = require('readline-sync')
const firebaseEncode = require('firebase-encode')

const firebase = require('firebase').default // TODO: remove default. I put it in for autocorrect.
require('firebase/firestore')

let db = firebase.firestore()

function ShowAdminPanel(user){

	console.clear()

	let options = [
		"Create",
		"View Results"
	]

	let choice = readlineSync.keyInSelect(options, "Select what you want to do: ")

	if(choice == 0){ // Create a knu task

		require("../modules/create")(user) // Split into a module since the code was incredibly long

	} else if(choice == 1){ // View Results

		let code = readlineSync.question("Please enter your Challenge code: ")

		let fbScores = db.collection('scores')

		if(code){
			fbScores.doc(code).get()
				.then((doc) => {
					if(doc.exists){
						let takers = doc.data().takers
						for(let takerEmail in takers){
							let scores = takers[takerEmail]
							console.log(chalk.bold.blue(firebaseEncode.decode(takerEmail)))

							let taskScores = scores.split(" | ")
							for(let s=0; s < taskScores.length; s++){
								console.log(`  Task #${s}: ${chalk.bold.yellow(taskScores[s].replace(",", "/"))}`)
							}
						}
					} else {
						console.log(`No scores found for code ${code}. Did you paste the code right?`)
					}
				})
				.catch((err) => {
					console.log(err)
				})
		} else {
			console.log("No code specified")
		}

	}

}

module.exports = async function(){
	
	console.log("Sign-In Required")

	let LogIn = readlineSync.keyInSelect(['Log In', 'Sign Up'], "Would you like to Log In or Sign Up?")


	// Authenticate the User
	if(LogIn == 0){ // Existing User

		let email = readlineSync.questionEMail("Please enter your email: ")
		let password = readlineSync.question("Password: ", { hideEchoBack : true })

		firebase.auth().signInWithEmailAndPassword(email, password)
			.then((userCredential) => {

				let user = userCredential.user

				console.log(chalk.bold.green("Sign-In Successful"))
				
				ShowAdminPanel(user)
			})
			.catch((err) => {
				if(err.code == "auth/user-not-found"){ // They haven't signed up
					console.log("Could not find account. Please sign up.")
				} else {
					console.log("An unexpected error occured. Please report the following.")
					console.error(err)
				}
			})

	} else if(LogIn == 1){ // Sign Up

		let email = readlineSync.questionEMail("Please enter your email: ")
		let password = readlineSync.questionNewPassword("Please enter a password: ", {
			min : 8,
			max : 24,
			confirmMessage : "Reenter your password: "
		})

		firebase.auth().createUserWithEmailAndPassword(email, password)
			.then((userCredential) => {

				let user = userCredential.user

				console.log(chalk.bold.green("Sign-Up Successful"))

				ShowAdminPanel(user)
			})
			.catch((err) => {
				console.log("An unexpected error occured. Please report the following.")
				console.log(err)
			})

	}

	// Show the Admin Controls

}