import { createContext, useContext } from 'react'
export const AppStateContext = createContext(null)
export function useApp() { const value=useContext(AppStateContext); if (!value) throw new Error('App state is unavailable'); return value }
