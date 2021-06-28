import * as preact from 'preact'
import useEvent from '@react-hook/event'
import { view } from '@risingstack/react-easy-state'

import { useControlsStore, useMedia } from '@/store'

import { Audio } from '@/elements/media/audio'
import { Video } from '@/elements/media/video'

export const Media: preact.FunctionComponent = view(() => {
  const { shortcutDisplay } = useControlsStore()
  const media = useMedia()

  useEvent(document, 'keypress', (key): void => {
    if (key.code === 'Space') {
      if (media.playing) {
        media.pause()
        shortcutDisplay.display('pause')
      } else {
        media.play()
        shortcutDisplay.display('play')
      }
    }
  })

  if (media.info.type === 'audio') {
    return <Audio />
  } else if (media.info.type === 'video') {
    return <Video />
  } else {
    throw new Error('Invalid media type')
  }
})
