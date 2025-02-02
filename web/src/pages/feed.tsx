import { store } from '~/store'
import { createSignal, For, onMount, Show } from 'solid-js'
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
			<Show when={!store.user.badges.length}>
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
			<Show when={store.user.badges && store.user.description}>
				<>
					<div class="absolute top-0 left-0 w-full flex flex-row items-center justify-between p-5">
						<button
							class="flex items-center justify-center size-10 rounded-xl bg-secondary"
							onClick={() => shareProfileURL()}
						>
							<span class="material-symbols-rounded text-accent" style={{ 'font-size': '16px' }}>share</span>
						</button>
						<Link
							class="flex items-center justify-center size-10 rounded-xl bg-secondary"
							href={`/edit-profile`}
						>
							<span class="material-symbols-rounded text-accent" style={{ 'font-size': '16px' }}>edit</span>
						</Link>
					</div>
					<div class="px-10 text-center flex flex-col items-center justify-center h-full">
						<img
							src={store.user.avatar_url}
							class="size-[120px] rounded-[30px] border mb-6"
							alt={store.user.first_name}
						/>
						<p class="text-xl mb-1">
							{store.user.first_name} {store.user.last_name}
						</p>
						<p class="mb-6 text-sm text-muted-foreground">
							{store.user.description}
						</p>
						<div class="flex flex-row items-center justify-center flex-wrap gap-1">
							<For each={store.user.badges.slice(0, 4)}>
								{badge => (
									<div
										class="flex bg-secondary h-8 flex-row items-center justify-center gap-[5px] rounded-xl px-2 transition-colors duration-200 ease-in-out">
										<span
											class="material-symbols-rounded"
											style={{ 'font-size': '16px', 'color': `#${badge.color}` }}
										>
											{String.fromCodePoint(parseInt(badge.icon, 16))}
										</span>
										<p class="text-xs font-medium text-white">
											{badge.text}
										</p>
									</div>
								)}
							</For>
							<Show when={store.user.badges.length > 4}>
								<div
									class="flex h-8 flex-row items-center justify-center gap-[5px] rounded-xl px-2 transition-colors duration-200 ease-in-out bg-muted"
								>
									<p class="text-xs font-medium text-white">
										+{store.user.badges.length - 5} more
									</p>
								</div>
							</Show>
						</div>
					</div>
				</>
			</Show>
		</div>
	)
}
