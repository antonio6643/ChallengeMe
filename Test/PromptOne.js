const yargs = require('yargs')

const args = yargs
	.command("create", "Start the challenge creation steps")
	.argv;

let arg = args._[0];

console.log(arg.toUpperCase())