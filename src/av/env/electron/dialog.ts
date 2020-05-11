import electron from 'electron'

export const confirm = async (question: string): Promise<boolean> => {
  return electron.ipcRenderer.invoke('confirm', question)
}

export const error = (message: string): void => {
  electron.ipcRenderer.invoke('error', message)
}