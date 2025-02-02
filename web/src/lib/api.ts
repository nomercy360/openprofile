import { store } from '~/store'
import { showToast } from '~/components/ui/toast'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
	try {
		const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${store.token}`,
				...(options.headers || {}),
			},
		})

		let data
		try {
			data = await response.json()
		} catch {
			showToast({ title: 'Failed to get response from server', variant: 'error', duration: 2500 })
			return { error: 'Failed to get response from server', data: null }
		}

		if (!response.ok) {
			const errorMessage =
				Array.isArray(data?.error)
					? data.error.join('\n')
					: typeof data?.error === 'string'
						? data.error
						: 'An error occurred'

			showToast({ title: errorMessage, variant: 'error', duration: 2500 })
			return { error: errorMessage, data: null }
		}

		return { data, error: null }
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
		showToast({ title: errorMessage, variant: 'error', duration: 2500 })
		return { error: errorMessage, data: null }
	}
}

export const uploadToS3 = (
	url: string,
	file: File,
	onProgress: (e: ProgressEvent) => void,
	onFinished: () => void,
): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		const req = new XMLHttpRequest()
		req.onreadystatechange = () => {
			if (req.readyState === 4) {
				if (req.status === 200) {
					onFinished()
					resolve()
				} else {
					reject(new Error('Failed to upload file'))
				}
			}
		}
		req.upload.addEventListener('progress', onProgress)
		req.open('PUT', url)
		req.send(file)
	})
}

export const fetchPresignedUrl = async (file: string) => {
	const { data } = await apiRequest(`/presigned-url?file_name=${file}`, {
		method: 'GET',
	})

	return data
}

export type UserLocation = {
	location_name: string
	country_code: string
	latitude: number
	longitude: number
}

export type UpdateUserRequest = {
	first_name: string
	last_name: string
	title: string
	description: string
	avatar_url: string
	city: string
	country: string
	badge_ids: string[]
	opportunity_ids: string[]
	latitude: number
	longitude: number
	location_name: string
	country_code: string
}

export type Badge = {
	id: string
	text: string
	color: string
	icon: string
}

export const fetchUpdateUser = async (user: any) => {
	return await apiRequest('/users', {
		method: 'PUT',
		body: JSON.stringify(user),
	})
}

export const fetchBadges = async () => {
	const { data } = await apiRequest('/badges')
	return data
}

export const fetchCreateBadge = async (badge: Badge) => {
	return await apiRequest('/badges', {
		method: 'POST',
		body: JSON.stringify(badge),
	})
}

type City = {
	id: string
	city_name: string
	country_code: string
	latitude: number
	longitude: number
}

export const fetchCities = async (query: string) => {
	const { data } = await apiRequest('/cities?query=' + query)
	return data
}

export const fetchProfiles = async (search: string) => {
	const { data } = await apiRequest(search ? `/users?search=${search}` : '/users')
	return data
}
