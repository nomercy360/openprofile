import { lazy } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

import NavigationTabs from '~/components/navigation-tabs'
import EditProfile from '~/pages/edit-profile'
import FeedPage from '~/pages/feed'
import PeoplePage from '~/pages/people'

export const routes: RouteDefinition[] = [
	{
		path: '/',
		component: NavigationTabs,
		children: [
			{
				'path': '/',
				'component': FeedPage,
			},
			{
				'path': '/people',
				'component': PeoplePage,
			},
		],
	},
	{
		'path': '/edit-profile',
		'component': EditProfile,
	},
	{
		path: '**',
		component: lazy(() => import('./pages/404')),
	},
]
