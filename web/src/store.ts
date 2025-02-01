import { createStore } from 'solid-js/store'
import { createSignal } from 'solid-js'


type User = {
	id: string
	first_name: string
	last_name: string
	username: string
	avatar_url: string
	chat_id: number
	language_code: 'en' | 'ru'
	created_at: string
	token: string
	badges: { id: string, name: string, color: string }[]
	opportunities: { id: string, name: string, color: string }[]
	city: string
	country: string
	country_code: string
	title: string
	description: string
}

export type Space = {
	id: string
	handle: string
	name: string
	description: string
	picture_url: string
	created_at: string
	updated_at: string
}

export const [store, setStore] = createStore<{
	user: User
	space: Space
	token: string
}>({
	user: {} as User,
	token: '',
	space: {} as Space,
})

export const setUser = (user: any) => setStore('user', user)

export const setToken = (token: string) => setStore('token', token)

export const setSpace = (space: Space) => setStore('space', space)
