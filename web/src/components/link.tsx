import type { AnchorProps } from '@solidjs/router'
import { A } from '@solidjs/router'
import type { Component } from 'solid-js'
import { store } from '~/store'

export const Link: Component<AnchorProps> = props => {
	const onClick = (e: MouseEvent) => {
		const targetUrl = new URL(props.href, window.location.toString())
		const currentUrl = new URL(window.location.toString())

		// Check if it's an external link
		const isExternal =
			targetUrl.protocol !== currentUrl.protocol ||
			targetUrl.host !== currentUrl.host

		if (isExternal) {
			e.preventDefault()
			return window.Telegram.WebApp.openLink('t.me/mini_hub_bot/app')
		}

		if (!props.href.startsWith('http')) {
			props.href = targetUrl.pathname + `?space=${store.space.handle}`
		}
	}

	return (
		<A {...props} onClick={onClick} class={props.class}>
			{props.children}
		</A>
	)
}
