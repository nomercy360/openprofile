import {
	createEffect,
	createSignal,
	For,
	Match,
	Show,
	Suspense,
	Switch,
} from 'solid-js'
import { Badge } from '~/lib/api'
import SearchInput from '~/components/search-input'

export function BadgesSelect(props: {
	selected: string[]
	setSelected: (selected: string[]) => void
	onCreateBadgeButtonClick: () => void
	badges: Badge[]
	search: string
	setSearch: (search: string) => void
}) {
	const [filteredBadges, setFilteredBadges] = createSignal(props.badges)

	const onBadgeClick = (badgeId: string) => {
		if (props.selected.includes(badgeId!)) {
			props.setSelected(props.selected.filter(b => b !== badgeId))
		} else if (props.selected.length < 10) {
			props.setSelected([...props.selected, badgeId!])
		}
	}

	createEffect(() => {
		if (props.badges && props.badges.length > 0) {
			setFilteredBadges(
				props.badges.filter((badge) =>
					badge.text?.toLowerCase().includes(props.search.toLowerCase()),
				),
			)
		}
	})

	return (
		<div class="w-full flex items-center justify-center flex-col">
			<SearchInput
				search={props.search}
				setSearch={props.setSearch}
				placeholder="Search ideas"
				class="mt-5 justify-between"
			/>
			<div class="flex h-9 w-full flex-row items-center justify-between">
				<Switch>
					<Match when={filteredBadges()?.length || 0 > 0}>
						<div />
						<div class="flex items-center justify-center text-sm text-secondary-foreground">
							{props.selected.length} / 10
						</div>
					</Match>
					<Match when={filteredBadges()?.length === 0}>
						<button
							class="size-full text-start text-sm text-secondary-foreground"
							onClick={() =>
								props.selected.length < 10 && props.onCreateBadgeButtonClick()
							}
						>
							Can’t find such thing. <span class="text-accent">Create it</span>
						</button>
						<p class="text-nowrap text-sm text-secondary-foreground">
							{props.selected.length} of 10
						</p>
					</Match>
				</Switch>
			</div>
			<div class="flex min-h-fit w-full flex-row flex-wrap items-center justify-center gap-1">
				<Suspense fallback={<div>Loading...</div>}>
					<For each={filteredBadges()}>
						{badge => (
							<button
								onClick={() => onBadgeClick(badge.id!)}
								class="flex h-8 flex-row items-center justify-center gap-[5px] rounded-xl px-2 transition-colors duration-200 ease-in-out"
								style={{
									'background-color': `${props.selected.includes(badge.id!) ? `#${badge.color}` : 'var(--secondary)'}`,
								}}
							>
								<span
									class="material-symbols-rounded"
									style={{
										'font-size': '16px',
										color: `${props.selected.includes(badge.id!) ? 'white' : `#${badge.color}`}`,
									}}
								>
									{String.fromCodePoint(parseInt(badge.icon!, 16))}
								</span>
								<p
									class="text-xs font-medium"
									classList={{
										'text-white': props.selected.includes(badge.id!),
										'text-foreground': !props.selected.includes(badge.id!),
									}}
								>
									{badge.text}
								</p>
							</button>
						)}
					</For>
				</Suspense>
			</div>
		</div>
	)
}
