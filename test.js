'use strict'
const NdMail = require('.')
    , argv = require('yargs').argv

let ndmail = new NdMail({
  imap: {
    user: argv.email,
    password: argv.password,
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
      user: argv.email,
      pass: argv.password
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

  if (argv.send) {
    ndmail.sendMail({
      from: argv.email,
      to: argv.send,
      subject: 'Test NdMail',
      html: '<h1>Hello this is a mail from NdMail</h1>'
    })
  }
  
})
