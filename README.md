# NdMail

Just a simple NodeJS email utility using `imap` and `nodemailer`.

## Installation
* Using npm `npm install ndmail --save`
* Using yarn `yarn add ndmail`


## API

* `NdMail(opts)`

Constructor for NdMail that have 2 property `imap` and `smtp`. property `imap` will be passed to `imap` library, and `smtp` will be passed to `nodemailer` library.

### Method

* `connect(callback)`

Connect method is for connecting to imap server and create smtp transport.

* `fetchMailFrom(uid, flag)`

This method is for fetching mail from imap. Email will fetched started with uid and filtered by flag.

* `sendMail(opts)`

This method is for sending mail. The options will passed to `nodemailer` transport. see at https://nodemailer.com/about/

### Event

* `imap_error`

This event will fired when imap connection is error.

* `mail`

This event will fired when mail retrieved from imap is parsed. This will event will fired when new email is received to.

* `error`

This event will fired when any error on the process.

### Example
```js
const NdMail = require('ndmail')

let ndmail = new NdMail({
  imap: {
    user: 'email@gmail.com',
    password: 'awesomepassword',
    tls: true,
    port: 993,
    host: 'imap.gmail.com',
    inbox: 'INBOX'
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: 'email@gmail.com',
      pass: 'awesomepassword'
    }
  }
})

ndmail.on('imap_error', function(err) {
  console.log(err)
})

ndmail.on('error', function(err) {
  console.log(err)
})

ndmail.on('mail', function(msg) {
  console.log(msg)
})

ndmail.connect(function() {
  ndmail.fetchMailFrom(1)

  ndmail.sendMail({
    from: 'email@gmail.com',
    to: 'any@example.com',
    subject: 'Test NdMail',
    html: '<h1>Hello this is a mail from NdMail</h1>'
  })
})
```
