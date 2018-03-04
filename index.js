'use strict'
const Imap = require('imap')
    , util = require('util')
    , nodemailer = require('nodemailer')
    , EventEmitter = require('events').EventEmitter
    , simpleParser = require('mailparser').simpleParser

let bind = function(fn, obj) {
  return function() { return fn.apply(obj, arguments) }
 }

module.exports = NdMail

/**
 * NdMail Constructor
 * @param {Object} opts 
 */
function NdMail(opts) {
  this.isReady = false 
  this.expectNextImapUid = 1
  this.fetchMailCb = null
  
  util.inherits(NdMail, EventEmitter)

  this.opts = Object.assign(NdMail.DEFAULTS, opts)
}

/**
 * Connecting to server
 */
NdMail.prototype.connect = function(fn) {
  this.imap = new Imap(this.opts.imap)
  this.smtp = nodemailer.createTransport(this.opts.smtp)
  

  // Register event
  this.imap.once('ready', fn)
  this.imap.once('error', bind(this.imapError, this))
  
  // Connect to imap server
  this.imap.connect()
}

/**
 * Fetch mail from uid
 * @param {Number} uid 
 */
NdMail.prototype.fetchMailFrom = function(uid, flag) {
  flag = flag || 'ALL'
  
  this.imap.openBox(this.opts.imap.inbox, true, this.fetchMessage(uid, flag))
}

/**
 * Start fetching message
 * @param {Number} uid 
 */
NdMail.prototype.fetchMessage = function(uid, flag) {
  let _this = this

  return function(err, box) {
    if (err) {
      throw err
    } else {
      let pattern = (box) ? (uid + ':' + box.uidnext) : (uid + ':*')
        , fetch = _this.imap.fetch(pattern, { bodies: '', struct: true })

      fetch.on('message', function(msg, seqno) {
        let rawMsg = new Buffer('')
          , uid = null
          
        msg.on('body', function(stream, info) {  
          let buffers = []

          stream.on('data', function(chunk) {
            buffers.push(chunk)
          })

          stream.once('end', function() {
            rawMsg = Buffer.concat(buffers)
          })
        })

        msg.once('attributes', function(attrs) {
          uid = attrs.uid 
        })

        msg.once('end', function() {
          _this.parseMessage(rawMsg, function(message) {
            message.uid = uid 
            message.seqno = seqno
            
            _this.expectNextImapUid = uid + 1
            _this.emit('mail', message)
          })
        })
      })

      fetch.on('end', function() {
        _this.imap.once('mail', bind(_this.imapNewMail, _this))
      })

      fetch.on('error', function(err) {
        _this.emit('error', err)
      })
    }
  }
}

/**
 * Fetch new mail 
 */
NdMail.prototype.imapNewMail = function() {
  this.fetchMessage(this.expectNextImapUid)()
}

/**
 * Emit error event
 * @param {Any} err 
 */
NdMail.prototype.imapError = function(err) {
  this.emit('imap_error', err)
}

/**
 * Parsing message
 * @param {Buffer}    message 
 * @param {Function}  fn
 */
NdMail.prototype.parseMessage = function(message, fn) {
  message = message || ''
  
  let msg = {}
    , _this = this 

  simpleParser(message).then(function(parsedMail) {
    if (parsedMail) {
      msg.messageId = parsedMail.messageId || ''
      
      if (parsedMail.from && parsedMail.from.text) {
        msg.from = parsedMail.from.value
      }

      msg.subject = parsedMail.subject || ''
      msg.headers = parsedMail.headers || {}
      msg.html = parsedMail.html || ''
      msg.text = parsedMail.text || ''
      msg.textAsHtml = parsedMail.textAsHtml || ''
      msg.references = parsedMail.references || []
      msg.date = parsedMail.date || parsedMail.receivedDate 
      msg.to = parsedMail.to.value || []
      
      if (parsedMail.cc) {
        msg.cc = parsedMail.cc.value || []
      }
      
      if (parsedMail.bcc) {
        msg.bcc = parsedMail.bcc.value || []
      }
      
      msg.inReplyTo = parsedMail.inReplyTo || ''
      msg.attachments = []
      
      let attachments = parsedMail.attachments || []

      attachments.forEach(function(parsedAttachment) {
        let attachment = _this.createAttachment(parsedAttachment.generatedFileName, parsedAttachment.content)
        
        if (parsedAttachment.contentType) 
          attachment.contentType = parsedAttachment.contentType
          
        if (parsedAttachment.contentDisposition) 
          attachment.contentDisposition = parsedAttachment.contentDisposition

        if (parsedAttachment.transferEncoding) 
          attachment.encoding = parsedAttachment.transferEncoding

        if (parsedAttachment.contentId) 
          attachment.cid = parsedAttachment.contentId

        msg.attachments.push(attachment)
      })
    }

    msg.size = message.length
    fn(msg)
  }).catch(function(err) {
    throw err 
  })
}

/**
 * Create attachment
 * @param {String}        fileName 
 * @param {Buffer|String} data 
 */
NdMail.prototype.createAttachment = function(fileName, data) {
  data = data || ''

  let attachment = {}
  
  attachment.fileName = fileName || 'unnamed'
  attachment.content = data || null 

  if (Buffer.isBuffer(data)) {
    attachment.encoding = 'binary'
    attachment.size = data.length
  } else {
    attachment.encoding = 'base64'
    attachment.size = (data.length / 4) * 3
  }

  attachment.cid = null 
  attachment.contentType = 'attachment'

  return attachment
}

/**
 * Send email
 * @param {Object} opts 
 */
NdMail.prototype.sendMail = function(opts) {
  this.smtp.sendMail(opts, function(err, info) {
    if (err) {
      this.emit('error', err)
    }
  })
}

/** 
 * Default configuration 
 */
NdMail.DEFAULTS = {
  imap: {},
  smtp: {}
}
