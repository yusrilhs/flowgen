# NdMail

Just a simple mail utility for NodeJS.

## API

* `NdMail(opts)`

Constructor for NdMail that have 2 property `imap` and `smtp`. property `imap` will be passed to `node-imap` library, and `smtp` will be passed to `nodemailer` library.

### Method

* `connect(callback)`

Connect method is for connecting to imap server and create smtp transport.

* `fetchMailFrom(uid, flag)`

This method is for fetching mail from imap started with uid and filter by flag.

### Event

* `imap_error`

This event will fired when imap connection is error.

* `mail`

This event will fired when mail retrieved from imap is parsed. This will event will fired when new email is retrieved to.

#### More API is under development
