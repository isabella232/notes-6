import { takeLatest, fork, put, all, call, take, select, delay } from 'redux-saga/effects'
import { ActionType, getType } from 'typesafe-actions'
import MainActions, { MainSelectors } from '../Redux/MainRedux'
import * as RNFS from 'react-native-fs'
import { API, pb } from '@textile/react-native-sdk'
import { Buffer } from 'buffer'
import Config from 'react-native-config'

const { PROMISE, API_URL } = Config

const JSON_SCHEMA = {
  name: 'notes',
  pin: true,
  mill: '/blob',
  plaintext: false
}

// watcher saga: watches for actions dispatched to the store, starts worker saga
export function* mainSagaInit() {
  yield all([
    takeLatest('NODE_STARTED', nodeStarted),
    takeLatest('GET_APP_THREAD_SUCCESS', refreshNotes),
    takeLatest('SUBMIT_NOTE', submitNewNote),
    takeLatest('PUBLIC_NOTE', createPublicNote),
    // takeLatest('PUBLIC_NOTE_SUCCESS', publicNoteSuccess),
    call(uploadAllNotes)
  ])
}

function * createPrivateThread(name, key) {
  const schema = pb.AddThreadConfig.Schema.create()
  schema.json = JSON.stringify(JSON_SCHEMA)
  const config = pb.AddThreadConfig.create()
  config.key = key
  config.name = name
  config.type = pb.Thread.Type.PRIVATE
  config.sharing = pb.Thread.Sharing.NOT_SHARED
  config.schema = schema

  const newTarget: pb.IThread = yield call(API.threads.add, config)
  yield put(MainActions.getThreadSuccess(newTarget))
}

function * createPublicThread(name, key) {
  const schema2 = pb.AddThreadConfig.Schema.create()
  schema2.json = JSON.stringify({
    name: 'public-notes',
    pin: true,
    mill: '/blob',
    plaintext: true
  })
  const config2 = pb.AddThreadConfig.create()
  config2.key = key
  config2.name = name
  config2.type = pb.Thread.Type.OPEN
  config2.sharing = pb.Thread.Sharing.NOT_SHARED
  config2.schema = schema2

  const newTarget2: pb.IThread = yield call(API.threads.add, config2)
  yield put(MainActions.getPublicThreadSuccess(newTarget2))
}

function * getOrCreateThread() {
  const APP_THREAD_NAME = 'private_notes_blob'
  const APP_THREAD_KEY = 'textile_notes-primary-blob'

  const PUBLIC_APP_THREAD_NAME = 'public_notes_blob'
  const PUBLIC_APP_THREAD_KEY = 'textile_public_notes-primary-blob'
  try {
    const threads: pb.ThreadList = yield call(API.threads.list)
    const target = threads.items.find((thread: pb.IThread) => thread.key === APP_THREAD_KEY)
    if (!target) {
      yield call(createPrivateThread, APP_THREAD_NAME, APP_THREAD_KEY)
    } else {
      yield put(MainActions.getThreadSuccess(target))
    }

    const pubTarget = threads.items.find((thread: pb.IThread) => thread.key === PUBLIC_APP_THREAD_KEY)
    if (!pubTarget) {
      yield call(createPublicThread, PUBLIC_APP_THREAD_NAME, PUBLIC_APP_THREAD_KEY)
    } else {
      yield put(MainActions.getPublicThreadSuccess(pubTarget))
    }
  } catch (err) {
    try {
      yield call(createPrivateThread, APP_THREAD_NAME, APP_THREAD_KEY)
      yield call(createPublicThread, PUBLIC_APP_THREAD_NAME, PUBLIC_APP_THREAD_KEY)
    } finally {
      // pass
    }
  }
}

export function * refreshNotes() {
  const appThread = yield select(MainSelectors.getAppThread)
  const allNotes: string[] = []
  try {
    const files = yield call(API.files.list, '', -1, appThread.id)
    const hashes = files.items.map((file) => file.files.map((ffs) => ffs.file.hash))
    for (const hash of [].concat.apply([], hashes)) {
      try {
        const data = yield call(API.files.data, hash)
        console.log(data)
        console.log('axh', data.split(',')[1])
        // console.log(Buffer.from(data.split(',')[1]).toString('utf8'))
        console.log('boom?', Buffer.from(data.split(',')[1], 'base64').toString(),
          Buffer.from(
            Buffer.from(data.split(',')[1], 'base64').toString(),
            'utf8'
          ).toString('ascii')
        )
        console.log((new Buffer.from(data.split(',')[1], 'base64')).toString('ascii'))
        console.log(Buffer.from(data.split(',')[1], 'base64').toString('utf8'))
        console.log(Buffer.from(data.split(',')[1]).toString('utf16le'))
        // console.log(Buffer.from(data.split(',')[1], 'utf8').toString('utf8'))
        // console.log(Buffer.from(data.split(',')[1], 'binary').toString('utf8'))
        // console.log(Buffer.from(data.split(',')[1], 'ascii').toString('utf8'))
        const buff = Buffer.from(data.split(',')[1])
        const newnew =  buff.toString('utf8')
        console.log('buf2',newnew)
        allNotes.push(newnew)
      } catch (err) {
        // console.log('file error', err.message)
      }
    }
  } catch (err) {
    // console.log('files error', err.message)
  } finally {
    yield put(MainActions.setNotes(allNotes))
  }
}

export function * postNoteToThread(action: ActionType<typeof MainActions.submitNote>) {
  const appThread = yield select(MainSelectors.getAppThread)
  // const path = RNFS.DocumentDirectoryPath + '/' + fakeUUID() + '.txt'
  // yield call(RNFS.writeFile, path, action.payload.note.trim(), 'utf8')
  // const result = yield call(API.files.prepare, path, appThread.id)
  // yield call(RNFS.unlink, path)
  // const dir = result.dir
  // if (!dir) {
  //   return
  // }
  // const file = Buffer.from(action.payload.note.trim())
  const buf = Buffer.from(action.payload.note.trim(), 'utf16le')
  // const input = buf.toString('base64')
  // const input = ( new Buffer(action.payload.note.trim()) ).toString('base64')
  // const input = Buffer.from(action.payload.note.trim()).toString() //.toString('base64')
  // const input = action.payload.note.trim().


  // const input = 'vanilla'
  // const result = yield call(API.files.prepareFiles, input, appThread.id)
  // yield call(API.files.add, result.dir, appThread.id)


  // const input2 = new Buffer('buffer toString').toString()
  // const result2 = yield call(API.files.prepareFiles, input2, appThread.id)
  // yield call(API.files.add, result2.dir, appThread.id)


  // const input3 = new Buffer('buffer toLocaleString').toLocaleString()
  // const result3 = yield call(API.files.prepareFiles, input3, appThread.id)
  // yield call(API.files.add, result3.dir, appThread.id)

  // const input4 = new Buffer('stackabuse.com').toString('base64')
  const input4 = 'stackabuse.com'
  console.log('input4', input4)
  const result4 = yield call(API.files.prepareFiles, input4, appThread.id)
  console.log(result4)
  yield call(API.files.add, result4.dir, appThread.id)

  // const input5 = new Buffer('buffer binary').toString('binary')
  // const result5 = yield call(API.files.prepareFiles, input5, appThread.id)
  // yield call(API.files.add, result5.dir, appThread.id)

  yield call(refreshNotes)
}
export function * nodeStarted(action: ActionType<typeof MainActions.nodeStarted>) {
  console.info('Running nodeStarted Saga')
  yield call(getOrCreateThread)
  yield put(MainActions.uploadAllNotes())
}

export function * submitNewNote(action: ActionType<typeof MainActions.submitNote>) {
  try {
    yield call(postNoteToThread, action)
  } finally {
    yield put(MainActions.uploadAllNotes())
  }
}

export function * uploadANote(note: string) {
  const email = yield select(MainSelectors.email)
  if (!email) {
    return
  }
  const param = {
    email,
    message: note,
    promise: PROMISE
  }
  try {
    const response = yield call (fetch, API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'text/html'
      },
      body: JSON.stringify(param)
    })
    if (response.status === 200) {
      console.info('axh', response.status)
      yield put(MainActions.uploadSuccess(note))
    } else {
      console.info('axh', response.status)
    }
  } catch (error) {
    console.info('axh error', error.message)
  }
}
export function * uploadAllNotes() {
  while (yield take(getType(MainActions.uploadAllNotes))) {
    try {
      const notes = yield select(MainSelectors.notes)
      for (const note of notes) {
        yield call(uploadANote, note)
      }
    } catch (error) {
      // pass
    }
  }
}

function fakeUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
    // tslint:disable-next-line:no-bitwise
    const r = Math.random() * 16 | 0
    // tslint:disable-next-line:no-bitwise
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function * createPublicNote(action: ActionType<typeof MainActions.submitNote>) {
  try {
    const publicThread = yield select(MainSelectors.getPublicThread)
    // const path = RNFS.DocumentDirectoryPath + '/' + fakeUUID() + '.txt'
    // yield call(RNFS.writeFile, path, action.payload.note.trim(), 'utf8')
    // const result = yield call(API.files.prepare, path, publicThread.id)
    // yield call(RNFS.unlink, path)
    // const dir = result.dir
    // if (!dir) {
    //   return
    // }
    const result = yield call(API.files.prepareFiles, action.payload.note.trim(), publicThread.id)

    const block = yield call(API.files.add, result.dir, publicThread.id)

    const files = yield call(API.files.list, '', -1, publicThread.id)
    const latest = files.items.length > 0 ? files.items[0] : undefined
    if (latest) {
      const file = latest.files[0].file
      if (file && file.targets.indexOf(block.target) > -1) {
        const hash = file.hash
        const url = `https://ipfs.io/ipfs/${hash}`
        yield put(MainActions.publishNoteStarting(url))
        yield call(publishPublicNote, url)
      } else {
        yield put(MainActions.publicNoteFailure())
      }
    } else {
      yield put(MainActions.publicNoteFailure())
    }
  } catch (error) {
    yield put(MainActions.publicNoteFailure())
  }
}

export function * forkFetch(url: string) {
  const response = yield call(fetch, url)
  if (response.status === 200) {
    yield put(MainActions.publicNoteSuccess())
  }
}
export function * publishPublicNote(url: string) {
  try {
    yield fork(forkFetch, url)
    yield delay(11000)
    yield put(MainActions.publicNoteSuccess())
  } catch (error) {
    yield put(MainActions.publicNoteFailure())
  }
}
