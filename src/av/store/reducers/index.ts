import { combineReducers } from 'redux'

import { State } from '../state'
import { Action } from '../actions'

import { reducer as general } from './general'
import { reducer as settings } from './settings'
import { reducer as media } from './media'
import { reducer as dialog } from './dialog'

export const reducer = combineReducers<State, Action>({ general, settings, media, dialog })
