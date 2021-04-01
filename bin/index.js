#!/usr/bin/env node
const chalk = require('chalk')
const boxen = require('boxen')
const yargs = require('yargs')
const readlineSync = require('readline-sync')

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

if(command == 'admin'){

	require("./commands/admin")(args._.slice(1))

} else if(command == "test"){

	require("./commands/test")(args._.slice(1))

}