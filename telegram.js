const queryString = require('query-string')
const client = require('./axio-client')
const autoBind = require('auto-bind')

const Buttons = {
  CallBack: (text, callback_data, hide = false)=>{
    return {
      text,
      callback_data,
      hide
    }
  },
  Keyboard: (text, opts = null)=>{
    return {
      text,
      ...opts
    }
  }
}

const Keyboard = (type='inline', buttons, opts)=>{
  if(type==='inline'){
    return { reply_markup: { inline_keyboard: [buttons] } }
  }

  const options = opts ? opts : {resize_keyboard: true, one_time_keyboard: true}
  return { reply_markup: { keyboard: [buttons],  ...options } }
}


class Telegram {
  constructor({ token }) {
    this.baseUrl = 'https://api.telegram.org/'
    this.baseBotUrl = `${this.baseUrl}bot${token}/`
    autoBind(this)
  }

  async apiCall({ method, params, endpoint }) {
    try {
      const url = this.baseBotUrl + endpoint
      const response = await client[method](url, params)

      if (response && response.data && response.data.result) {
        return response.data.result
      }

      return null
    } catch (e) {
      console.warn(e)
      return null
    }
  }

  getUpdate(params) {
    return this.apiCall({ endpoint: `getUpdates?${queryString.stringify(params)}`, method: 'get' })
  }
  getMe() {
    return this.apiCall({ endpoint: 'getMe', method: 'get' })
  }
  sendMessage(params) {
    return this.apiCall({ endpoint: 'sendMessage', method: 'post', params })
  }
  forwardMessage(params) {
    return this.apiCall({ endpoint: 'forwardMessage', method: 'post', params })
  }
  sendPhoto(params) {
    return this.apiCall({ endpoint: 'sendPhoto', method: 'post', params })
  }
  sendAudio(params) {
    return this.apiCall({ endpoint: 'sendAudio', method: 'post', params })
  }
  sendDocument(params) {
    return this.apiCall({ endpoint: 'sendDocument', method: 'post', params })
  }
  sendVideo(params) {
    return this.apiCall({ endpoint: 'sendVideo', method: 'post', params })
  }
  sendAnimation(params) {
    return this.apiCall({ endpoint: 'sendAnimation', method: 'post', params })
  }
  sendVoice(params) {
    return this.apiCall({ endpoint: 'sendVoice', method: 'post', params })
  }
  sendVideoNote(params) {
    return this.apiCall({ endpoint: 'sendVideoNote', method: 'post', params })
  }
  sendMediaGroup(params) {
    return this.apiCall({ endpoint: 'sendMediaGroup', method: 'post', params })
  }

  sendLocation(params) {
    return this.apiCall({ endpoint: 'sendLocation', method: 'post', params })
  }

  editMessageLiveLocation(params) {
    return this.apiCall({ endpoint: 'editMessageLiveLocation', method: 'post', params })
  }

  stopMessageLiveLocation(params) {
    return this.apiCall({ endpoint: 'stopMessageLiveLocation', method: 'post', params })
  }

  sendVenue(params) {
    return this.apiCall({ endpoint: 'sendVenue', method: 'post', params })
  }

  sendContact(params) {
    return this.apiCall({ endpoint: 'sendContact', method: 'post', params })
  }

  sendPoll(params) {
    return this.apiCall({ endpoint: 'sendPoll', method: 'post', params })
  }
  sendChatAction(params) {
    return this.apiCall({ endpoint: 'sendChatAction', method: 'post', params })
  }

  getUserProfilePhotos(params) {
    return this.apiCall({ endpoint: `getUserProfilePhotos?${queryString.stringify(params)}`, method: 'get' })
  }
}

class Context extends Telegram {
  constructor(props){
    super(props)
    this.update = props.update
  }

  contextParams(params){



    return {
      chat_id: this.update.message.chat.id,
      ...params,
      ...Keyboard('keyboard',[
        Buttons.Keyboard('teste 1'),
        Buttons.Keyboard('teste 2')
      ])
    }
  }

  reply(text, params){
    this.sendMessage(
      this.contextParams({ text, params })
    )
  }




}

class Bot extends Telegram {
  constructor(props) {
    super(props)
    const { token, polling = true } = props

    this.polling = polling
    this.pollingTimeout = null
    this.updateInterval = 1500
    this.started = false

    this.listeners = {
      message: null,
      command: [],
    }

    this.props = props
  }

  lauch() {
    this.started = true
    this.pollingTimeout = setTimeout(this.lookingForUpdates, this.updateInterval)
  }

  async lookingForUpdates() {
    try {
      const updates = await this.getUpdate()
      this.check(updates)
    } catch (e) {
      console.warn(e)
    }
  }

  check(updates) {
    const length = updates.length
    for (let i = 0; i < length; i++) {
      this.checkUpdate(updates[i])
    }
  }

  checkUpdate(update) {
    const { message } = update
    const { text, entities } = message

    const isCommand = this.checkEntities(entities, text)

    if (!isCommand) {
      if (this.listeners.message) {
        this.listeners.message(
          message,
          new Context({ ...this.props, update })
        )
      }
    }
  }
  checkEntities(entities, text) {
    let isCommand = false
    if (entities && entities.length) {
      const length = entities.length
      for (let i = 0; i < length; i++) {
        if (entities[i].type === 'bot_command') {
          this.emit(entities[i].type, text)
          isCommand = true
        }
      }
    }

    return isCommand
  }

  stop() {
    this.started = false
    clearTimeout(this.pollingTimeout)
  }

  emit(type, command) {
    const length = this.listeners.command.length
    for (let i = 0; i < length; i++) {
      if (this.listeners.command[i].type === type && this.listeners.command[i].command === command) {
        this.listeners.command[i].handdler(command)
      }
    }
  }

  command(command, handdler) {
    this.listeners.command.push({ type: 'bot_command', command, handdler })
  }

  on(listener, handdler) {
    if (this.listeners[listener] !== 'undefined') {
      this.listeners[listener] = handdler
    }
  }
}

module.exports = Bot
