import { store, UserProfile } from '~/store'
import { createSignal, For, onMount, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useTranslations } from '~/lib/locale-context'
import { Link } from '~/components/link'
import { createQuery } from '@tanstack/solid-query'
import { fetchCities, fetchProfiles } from '~/lib/api'
import SearchInput from '~/components/search-input'

export default function PeoplePage() {
	const navigate = useNavigate()

	const [search, setSearch] = createSignal('')

	const profilesQuery = createQuery<UserProfile[]>(() => ({
		queryKey: ['profiles', search()],
		queryFn: () => fetchProfiles(search()),
	}))

	const handleCloseSearch = () => {
		setSearch('')
	}

	return (
		<div class="h-full overflow-y-scroll bg-background text-foreground pb-[120px]">
			<SearchInput
				search={search()}
				setSearch={setSearch}
				placeholder="Search people..."
				class="h-20 px-5"
			/>
			<Show when={profilesQuery.isSuccess && profilesQuery.data?.length}>
				<div class="flex flex-col items-center w-full justify-start">
					<For each={profilesQuery.data}>
						{profile => (
							<>
								<div class="px-5 pb-5 pt-4 flex flex-col items-start justify-start space-y-3">
									<img
										src={profile.avatar_url}
										alt={profile.first_name}
										class="size-10 rounded-xl object-cover"
									/>
									<div>
										<p class="font-extrabold text-muted-foreground">
											{profile.first_name} {profile.last_name}
										</p>
										<p class="font-normal">
											{profile.description}
										</p>
									</div>
									<div class="flex flex-row items-center justify-start flex-wrap gap-1">
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
								<div class="h-px w-full bg-border"></div>
							</>
						)}
					</For>
				</div>
			</Show>
		</div>
	)
}
