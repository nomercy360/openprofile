import { Link } from '~/components/link'
import { cn } from '~/lib/utils'
import { useLocation } from '@solidjs/router'
import { store } from '~/store'

export default function NavigationTabs(props: any) {
	const location = useLocation()

	const tabs = [
		{ href: '/', icon: 'self_improvement', activePath: '/' },
		{ href: '/people', icon: 'groups', activePath: '/people' },
		{ href: '/matches', icon: 'sports_soccer', activePath: '/matches' },
	]

	return (
		<div class="h-screen bg-background text-foreground">
			<div
				class="flex flex-row items-start h-[100px] fixed bottom-0 w-full bg-background z-50 transform -translate-x-1/2 left-1/2"
			>
				<div class="px-2.5 py-4 flex flex-row w-full items-center justify-between">
					<Link
						href={`/spaces/${store.space.id}`}
					>
						<img
							src={store.space.picture_url}
							alt={store.space.name}
							class="rounded-xl size-10 shrink-0 object-cover"
						/>
					</Link>
					<div class="flex flex-row items-center justify-between gap-4">
						{tabs.map(({ href, icon, activePath }) => (
							<Link
								href={href}
								class={cn('bg-primary/10 size-10 rounded-xl p-2 flex items-center flex-col h-full text-sm gap-1', {
									'bg-primary text-primary-foreground': location.pathname === activePath,
								})}
							>
							<span class="material-symbols-rounded icon-fill text-[24px]">
								{icon}
							</span>
							</Link>
						))}
					</div>
				</div>
			</div>
			{props.children}
		</div>
	)
}
