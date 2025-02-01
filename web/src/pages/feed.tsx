import { store } from '~/store'
import { createSignal, onMount, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useTranslations } from '~/lib/locale-context'
import { Link } from '~/components/link'

export const [isOnboardingComplete, setIsOnboardingComplete] = createSignal(false)

export default function FeedPage() {
	const navigate = useNavigate()

	function shareProfileURL() {
		const url =
			'https://t.me/share/url?' +
			new URLSearchParams({
				url: 'https://t.me/footbon_bot/app?startapp=u_' + store.user?.username,
			}).toString() +
			`&text=Check out ${store.user?.first_name}'s profile`

		window.Telegram.WebApp.openTelegramLink(url)
	}

	// const updateOnboardingComplete = (err: unknown, value: unknown) => {
	// 	const isComplete = value === 'true'
	// 	if (!isComplete && !isOnboardingComplete()) {
	// 		navigate('/onboarding')
	// 	}
	// }
	//
	// onMount(() => {
	// 	// window.Telegram.WebApp.CloudStorage.removeItem('onboarding_complete')
	//
	// 	window.Telegram.WebApp.CloudStorage.getItem(
	// 		'onboarding_complete',
	// 		updateOnboardingComplete,
	// 	)
	// })

	const { t } = useTranslations()

	return (
		<div class="h-full overflow-y-scroll bg-background text-foreground pb-[120px]">
			<Show when={store.user.badges}>
				<div class="px-10 text-center flex flex-col items-center justify-center h-full">
					<img
						src="/logo.png"
						class="size-[120px] mb-6"
					/>
					<p class="text-xl mb-2">
						Open up for the community
					</p>
					<p class="mb-6 text-sm text-muted-foreground">
						Set up profile, find interesting people and let others discover you. It’s free and takes 5 minutes
					</p>
					<Link
						href="/edit-profile"
						class="flex bg-primary justify-center text-primary-foreground rounded-lg h-8 items-center px-2.5 text-xs font-semibold">
						Set up profile
					</Link>
				</div>
			</Show>
		</div>
	)
}
