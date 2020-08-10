import * as React from 'react'
import { useDispatch } from 'react-redux'

import { MOVE_THROUGH_RATE } from './globals'
import { electronResizeWindow } from 'av/env/electron-window'

import { useSelector } from 'av/store'
import { mediaSlice } from 'av/store/slices/media'

type Props = Readonly<{ nativeMedia: React.ElementType, onClick?: () => void }>

export const Media: React.FC<Props> = props => {
  const url = useSelector(({ media }) => media.url)
  const loaded = useSelector(({ media }) => media.loaded)
  const playing = useSelector(({ media }) => media.playing)
  const playbackTimeInStore = useSelector(({ media }) => media.playbackTime)
  const playbackTimeNeedsUpdating = useSelector(({ media }) => media.playbackTimeNeedsUpdating)
  const playbackRate = useSelector(({ media }) => media.playbackRate)
  const volume = useSelector(({ media }) => media.volume)
  const moveThrough = useSelector(({ media }) => media.moveThrough)
  const dispatch = useDispatch()

  const nativeMedia = React.useRef<HTMLMediaElement | null>(null)
  const wasPlaying = React.useRef<boolean>(false)

  /**
   * Playback
   */

  const playbackFrameRequestId = React.useRef<number>(0)

  const playbackFrame = (): void => {
    if (!nativeMedia.current) return
    dispatch(mediaSlice.actions.storePlaybackTime(nativeMedia.current.currentTime))
    playbackFrameRequestId.current = requestAnimationFrame(playbackFrame)
  }

  React.useEffect(() => {
    if (!nativeMedia.current || !loaded) return

    if (playing) {
      nativeMedia.current.play()
      playbackFrameRequestId.current = requestAnimationFrame(playbackFrame)
    } else {
      nativeMedia.current.pause()
      cancelAnimationFrame(playbackFrameRequestId.current)
    }

    return () => cancelAnimationFrame(playbackFrameRequestId.current)
  }, [loaded, playing])

  /**
   * Playback time changed
   */

  React.useEffect(() => {
    if (nativeMedia.current && playbackTimeNeedsUpdating) {
      nativeMedia.current.currentTime = playbackTimeInStore
      dispatch(mediaSlice.actions.setPlaybackTimeNeedsUpdating(false))
    }
  }, [playbackTimeNeedsUpdating])

  /**
   * Playback rate changed
   */

  React.useEffect(() => {
    if (!nativeMedia.current) return
    nativeMedia.current.playbackRate = playbackRate
  }, [playbackRate])

  /**
   * Volume changed
   */

  React.useEffect(() => {
    if (!nativeMedia.current) return
    nativeMedia.current.volume = volume
  }, [volume])

  /**
   * Move through (rewinding and fast-forwarding while paused)
   */

  const moveThroughFrameRequestId = React.useRef<number>(0)
  const lastMoveThroughFrameTime = React.useRef<number>(0)

  const moveThroughFrame = (time: number): void => {
    if (!nativeMedia.current) return

    const frameTimeDelta = time - lastMoveThroughFrameTime.current
    lastMoveThroughFrameTime.current = time

    let playbackTimeDelta = frameTimeDelta / 1000 * MOVE_THROUGH_RATE * playbackRate
    if (moveThrough === 'rewind') playbackTimeDelta *= -1

    nativeMedia.current.currentTime += playbackTimeDelta
    dispatch(mediaSlice.actions.storePlaybackTime(nativeMedia.current.currentTime))

    moveThroughFrameRequestId.current = requestAnimationFrame(moveThroughFrame)
  }

  React.useEffect(() => {
    if (moveThrough === 'rewind' || (moveThrough === 'fastForward' && !playing)) {
      wasPlaying.current = playing
      dispatch(mediaSlice.actions.setPlaying(false))

      lastMoveThroughFrameTime.current = performance.now()
      moveThroughFrameRequestId.current = requestAnimationFrame(moveThroughFrame)
    } else {
      cancelAnimationFrame(moveThroughFrameRequestId.current)
      if (wasPlaying.current) dispatch(mediaSlice.actions.setPlaying(true))
    }

    return () => {
      cancelAnimationFrame(moveThroughFrameRequestId.current)
    }
  }, [moveThrough])

  /**
   * Fast-forwarding while playing
   */

  const lastPlaybackRate = React.useRef<number>(playbackRate)

  React.useEffect(() => {
    if (!nativeMedia.current) return

    if (playing) {
      if (moveThrough === 'fastForward') {
        lastPlaybackRate.current = nativeMedia.current.playbackRate
        nativeMedia.current.playbackRate = MOVE_THROUGH_RATE
      } else {
        nativeMedia.current.playbackRate = lastPlaybackRate.current
      }
    } else {
      // Ensure playback rate is reset when fast-forwarding through the end.
      nativeMedia.current.playbackRate = playbackRate
    }
  }, [moveThrough])

  /**
   * Component
   */

  return (
    <props.nativeMedia
      ref={nativeMedia}
      src={url}
      onLoadedData={() => {
        if (!nativeMedia.current) return
        dispatch(mediaSlice.actions.loaded({ duration: nativeMedia.current.duration }))

        if (nativeMedia.current instanceof HTMLVideoElement) {
          electronResizeWindow(nativeMedia.current.videoWidth, nativeMedia.current.videoHeight)
        } else {
          electronResizeWindow()
        }
      }}
      onClick={props.onClick}
    />
  )
}
