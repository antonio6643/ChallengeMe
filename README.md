# ChallengeMe

## Installing
To install, type
```console
npm install -g
```

## Creating a Challenge
To create a challenge, simply type
```console
$ challengeme create
```

The program will guide you through a set of questions. After answering the questions, the program will give you a code. Give this code to whoever you want to take the challenge.

## Executing a Challenge
To participate in a challenge, type
```console
$ challengeme test [CODE]
```

If the code is valid, you will have to enter your email to participate. After entering your email, you will be shown the prompt and given instructions on how to test your program.

**NOTE:** The program will execute each input as a single string argument when running your program. For example, if you type
```console
node test.js
```
as the command to run your code, the program will use
```console
node test.js INPUT_HERE
```
to test it.

## TODO
- Instruction video
- Proper timer
- Security on Firebase
  - Authentication system?
- More places to send results(other than discord)