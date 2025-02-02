import { Show } from 'solid-js'
import { cn } from '~/lib/utils'

interface SearchInputProps {
	search: string;
	setSearch: (value: string) => void;
	placeholder?: string;
	class?: string;
}

export default function SearchInput(props: SearchInputProps) {
	return (
		<div class={cn('w-full flex items-center gap-2', props.class)}>
			<input
				autocomplete="off"
				autocorrect="off"
				autocapitalize="off"
				spellcheck={false}
				maxLength={50}
				placeholder={props.placeholder || 'Search...'}
				type="text"
				value={props.search}
				onInput={(e) => props.setSearch(e.currentTarget.value)}
				class="flex-1 border border-border bg-secondary px-4 h-10 rounded-xl focus:outline-none"
			/>
			<Show when={props.search}>
				<button
					class="size-8 flex items-center justify-center bg-muted rounded-full"
					onClick={() => props.setSearch('')}
				>
          <span class="material-symbols-rounded text-accent" style={{ 'font-size': '16px' }}>
            close
          </span>
				</button>
			</Show>
		</div>
	)
}
