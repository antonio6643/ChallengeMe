# ChallengeMe

## Installing
To install, type
```console
npm install -g
```

# Admin
The admin panel is the place where you can create Challenges and check the results submitted from people taking your Challenge. This panel requires authentication to access. To open the panel, use the following command:
```console
$ challengeme admin
```

When you successfully log in or sign up, you will be given the option to either create a challenge or view the results of a challenge. **NOTE:** You must be the creator of the challenge to view the results.

### Creating a Challenge
To create a challenge, simply type
```console
$ challengeme create
```

The program will guide you through a set of questions. After answering the questions, the program will give you a code. Give this code to whoever you want to take the challenge.

# Test
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

**Demo Video:** https://youtu.be/Wsz3IEqJsu4

**Example Discord Webhook Screenshot:** ![Webhook](https://i.imgur.com/LyNOL3T.png)

## TODO
- Proper timer
- Email System
- Account recovery/multiple logins
  - Currently using Firebase Auth, so it should be easy.