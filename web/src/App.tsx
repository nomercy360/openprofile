import { createEffect, createSignal, Match, Switch } from 'solid-js'
import { setSpace, setToken, setUser } from './store'
import { API_BASE_URL } from '~/lib/api'
import { NavigationProvider } from './lib/useNavigation'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { Toaster } from '~/components/ui/toast'
import { LocaleContextProvider } from '~/lib/locale-context'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 5, // 5 minutes
		},
		mutations: {
			retry: 2,
		},
	},
})

function transformStartParam(startParam?: string) {
	if (!startParam) return { redirect: null, referrer: null }

	// Check if the parameter starts with "redirect-to-"
	if (startParam.startsWith('u_')) {
		const path = startParam.slice('u_'.length)

		return { redirect: '/users/' + path, referrer: null }
	} else if (startParam.startsWith('r_')) {
		const referrer = startParam.slice('r_'.length)
		return { redirect: null, referrer }
	} else {
		return { redirect: null, referrer: null }
	}
}

export const [showCommunityPopup, setShowCommunityPopup] = createSignal(false)

export default function App(props: any) {
	const [isAuthenticated, setIsAuthenticated] = createSignal(false)
	const [isLoading, setIsLoading] = createSignal(true)

	const navigate = useNavigate()

	const updateCommunityPopup = (err: unknown, value: unknown) => {
		setShowCommunityPopup(value !== 'closed')
	}

	createEffect(async () => {
		try {
			console.log('WEBAPP:', window.Telegram)

			const initData = window.Telegram.WebApp.initData
			const startapp = window.Telegram.WebApp.initDataUnsafe.start_param

			const { redirect, referrer } = transformStartParam(startapp)

			const urlParams = new URLSearchParams(window.location.search)
			const space = urlParams.get('space') || 'openprofile'

			const resp = await fetch(`${API_BASE_URL}/auth/telegram`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query: initData,
					referrer_id: referrer,
					space,
				}),
			})

			if (resp.status !== 200) {
				setIsAuthenticated(false)
				setIsLoading(false)
				return
			}

			const data = await resp.json()

			setUser(data.user)
			setToken(data.token)
			setSpace(data.space)

			window.Telegram.WebApp.ready()
			window.Telegram.WebApp.expand()
			window.Telegram.WebApp.disableClosingConfirmation()
			window.Telegram.WebApp.disableVerticalSwipes()

			window.Telegram.WebApp.CloudStorage.getItem(
				'fb_community_popup',
				updateCommunityPopup,
			)

			// window.Telegram.WebApp.CloudStorage.removeItem('fb_community_popup')

			setIsAuthenticated(true)
			setIsLoading(false)

			if (redirect) {
				navigate(redirect)
			}

		} catch (e) {
			console.error('Failed to authenticate user:', e)
			setIsAuthenticated(false)
			setIsLoading(false)
		}
	})
	return (
		<NavigationProvider>
			<QueryClientProvider client={queryClient}>
				<Switch>
					<Match when={isAuthenticated()}>
						{props.children}
					</Match>
					<Match when={!isAuthenticated() && isLoading()}>
						<div class="min-h-screen w-full flex-col items-start justify-center bg-main" />
					</Match>
					<Match when={!isAuthenticated() && !isLoading()}>
						<div
							class="flex text-center h-screen w-full flex-col items-center justify-center text-3xl">
							<p>
								Today nothing is gonna work
							</p>
						</div>
					</Match>
				</Switch>
				<Toaster />
			</QueryClientProvider>
		</NavigationProvider>
	)
}
