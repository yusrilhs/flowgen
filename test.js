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
})
