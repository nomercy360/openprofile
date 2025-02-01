import { createStore } from 'solid-js/store'
import {
	Badge,
	fetchBadges,
	fetchCreateBadge,
	fetchPresignedUrl,
	fetchUpdateUser,
	UpdateUserRequest,
	uploadToS3, UserLocation,
} from '~/lib/api'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { setUser, store } from '~/store'
import FormLayout from '~/components/form-layout'
import { useBackButton } from '~/lib/useBackButton'
import { useMainButton } from '~/lib/useMainButton'
import { queryClient } from '~/App'
import { useNavigate } from '@solidjs/router'
import TextArea from '~/components/text-area'
import { BadgesSelect } from '~/components/badges-select'
import BadgeCreate from '~/components/badge-create'
import { createQuery } from '@tanstack/solid-query'
import { LocationSelect } from '~/components/location-select'
import PhotoUpload from '~/components/photo-upload'

const StepNames = {
	TITLE: 'TITLE',
	DESCRIPTION: 'DESCRIPTION',
	SELECT_BADGES: 'SELECT_BADGES',
	CREATE_BADGE: 'CREATE_BADGE',
	LOCATION: 'LOCATION',
	PHOTO_UPLOAD: 'PHOTO_UPLOAD',
} as const

type StepName = typeof StepNames[keyof typeof StepNames];

export default function EditProfile() {
	const [editUser, setEditUser] = createStore<UpdateUserRequest>({
		first_name: '',
		last_name: '',
		title: '',
		description: '',
		avatar_url: '',
		city: '',
		country: '',
		badge_ids: [],
		opportunity_ids: [],
		location_name: '',
		country_code: '',
		latitude: 0,
		longitude: 0,
	})

	const [location, setLocation] = createSignal<UserLocation>({} as UserLocation)

	const [step, setStep] = createSignal<StepName>(StepNames.TITLE)

	const backButton = useBackButton()
	const mainButton = useMainButton()

	const [createBadge, setCreateBadge] = createStore<Badge>({ id: '', text: '', color: '27AE60', icon: '' })

	const [badgeSearch, setBadgeSearch] = createSignal('')

	const [imgFile, setImgFile] = createSignal<File | null>(null)
	const [imgUploadProgress, setImgUploadProgress] = createSignal(0)

	const navigate = useNavigate()

	const fetchBadgeQuery = createQuery<Badge[]>(() => ({
		queryKey: ['badges'],
		// then push selected to the top
		queryFn: () =>
			fetchBadges().then((badges: Badge[]) => {
				const selected = editUser.badge_ids
				return [
					...selected.map(id => badges.find((b: Badge) => b.id === id)),
					...badges.filter((b: Badge) => !selected.includes(b.id!)),
				]
			}) as Promise<Badge[]>,
	}))

	createEffect(() => {
		if (store.user?.chat_id) {
			setEditUser({
				first_name: store.user.first_name,
				last_name: store.user.last_name,
				title: store.user.title,
				description: store.user.description,
				avatar_url: store.user.avatar_url,
				city: store.user.city,
				country: store.user.country,
				country_code: store.user.country_code,
				badge_ids: store.user.badges?.map(b => b.id) || [],
				opportunity_ids: store.user.opportunities?.map(o => o.id) || [],
			})
		}
	})

	const formHeaders = {
		[StepNames.TITLE]: { title: 'Your Name', description: 'Tell us your name and title' },
		[StepNames.DESCRIPTION]: { title: 'Description', description: 'Tell us about yourself' },
		[StepNames.SELECT_BADGES]: { title: 'Badges', description: 'Select badges' },
		[StepNames.CREATE_BADGE]: { title: 'Create Badge', description: 'Create a badge' },
		[StepNames.LOCATION]: { title: 'Location', description: 'Tell us your location' },
		[StepNames.PHOTO_UPLOAD]: { title: 'Photo', description: 'Upload a photo' },
	}

	const decrementStep = () => {
		switch (step()) {
			case StepNames.TITLE:
				navigate('/')
				break
			case StepNames.DESCRIPTION:
				setStep(StepNames.TITLE)
				break
			case StepNames.SELECT_BADGES:
				setStep(StepNames.DESCRIPTION)
				break
			case StepNames.CREATE_BADGE:
				setStep(StepNames.SELECT_BADGES)
				break
			case StepNames.LOCATION:
				setStep(StepNames.SELECT_BADGES)
				break
			case StepNames.PHOTO_UPLOAD:
				setStep(StepNames.LOCATION)
				break
		}
	}

	const onContinue = async () => {
		switch (step()) {
			case StepNames.TITLE:
				setStep(StepNames.DESCRIPTION)
				break

			case StepNames.DESCRIPTION:
				setStep(StepNames.SELECT_BADGES)
				break

			case StepNames.SELECT_BADGES:
				setStep(StepNames.LOCATION)
				break

			case StepNames.CREATE_BADGE:
				setCreateBadge('text', badgeSearch())
				const { data, error } = await fetchCreateBadge(createBadge)
				if (error) {
					return
				}
				setEditUser('badge_ids', [...editUser.badge_ids, data!.id])
				queryClient.setQueryData(['badges'], (prev: Badge[] = []) => [data!, ...prev])
				setStep(StepNames.SELECT_BADGES)
				break

			case StepNames.LOCATION:
				setStep(StepNames.PHOTO_UPLOAD)
				break

			case StepNames.PHOTO_UPLOAD:
				try {
					if (imgFile() && imgFile() !== null) {
						mainButton.showProgress(true)
						try {
							const { cdn_url, url } = await fetchPresignedUrl(imgFile()!.name)
							await uploadToS3(
								url,
								imgFile()!,
								e => {
									setImgUploadProgress(Math.round((e.loaded / e.total) * 100))
								},
								() => {
									setImgUploadProgress(0)
								},
							)
							setEditUser('avatar_url', cdn_url)
						} catch (e) {
							console.error(e)
						}
					}

					mainButton.hideProgress()
					window.Telegram.WebApp.MainButton.showProgress(false)
					setEditUser('latitude', location().latitude)
					setEditUser('longitude', location().longitude)
					setEditUser('location_name', location().location_name)
					setEditUser('country_code', location().country_code)
					const { data, error } = await fetchUpdateUser(editUser)
					if (!error) {
						setUser(data)
						navigate('/')
					}
				} finally {
					window.Telegram.WebApp.MainButton.hideProgress()
				}
				break
		}
	}

	createEffect(() => {
		switch (step()) {
			case StepNames.TITLE:
				backButton.setVisible()
				backButton.onClick(decrementStep)
				mainButton.toggle(
					editUser.first_name && editUser.last_name && editUser.title,
					'Continue',
					'Add info to continue',
				)
				break

			case StepNames.DESCRIPTION:
				mainButton.toggle(
					editUser.description,
					'Continue',
					'Add description to continue',
				)
				break

			case StepNames.SELECT_BADGES:
				mainButton.toggle(!!editUser.badge_ids.length, 'Continue', 'Add badges to continue')
				break

			case StepNames.CREATE_BADGE:
				mainButton.toggle(!!badgeSearch(), `Create ${badgeSearch()}`)
				break

			case StepNames.LOCATION:
				mainButton.toggle(
					location().location_name && location().country_code && location().latitude && location().longitude,
					'Continue',
				)
				break

			case StepNames.PHOTO_UPLOAD:
				mainButton.enable('Save & Publish')
				break
		}
	})

	onMount(() => {
		mainButton.onClick(onContinue)
	})

	onCleanup(() => {
		mainButton.offClick(onContinue)
		mainButton.hide()
		backButton.offClick(decrementStep)
		backButton.hide()
	})

	return (
		<FormLayout
			step={Object.values(StepNames).indexOf(step()) + 1}
			maxSteps={Object.values(StepNames).length}
			title={formHeaders[step()].title}
			description={formHeaders[step()].description}
		>
			<Show when={step() === StepNames.TITLE}>
				<div class="flex flex-col items-start w-full">
					<label class="mb-[2px] text-xs font-bold ml-2 text-muted-foreground">First Name</label>
					<input
						class="h-10 rounded-xl bg-input focus:outline-none rounded px-3 w-full"
						value={editUser.first_name}
						onInput={e => setEditUser('first_name', e.currentTarget.value)}
					/>
					<label class="mt-3 mb-[2px] text-xs font-bold ml-2 text-muted-foreground">Last Name</label>
					<input
						class="h-10 rounded-xl bg-input focus:outline-none rounded px-3 w-full"
						value={editUser.last_name}
						onInput={e => setEditUser('last_name', e.currentTarget.value)}
					/>
					<label class="mt-3 mb-[2px] text-xs font-bold ml-2 text-muted-foreground">Title</label>
					<input
						class="h-10 rounded-xl bg-input focus:outline-none rounded px-3 w-full"
						value={editUser.title}
						onInput={e => setEditUser('title', e.currentTarget.value)}
					/>
				</div>
			</Show>
			<Show when={step() === StepNames.DESCRIPTION}>
				<div class="flex flex-col items-start w-full">
					<TextArea
						value={editUser.description}
						setValue={value => setEditUser('description', value)}
						placeholder="I'm a 20 y.o. designer from San Francisco. I love minimalism and clean design."
					/>
				</div>
			</Show>
			<Show when={step() === StepNames.SELECT_BADGES}>
				<div class="flex flex-col items-start w-full">
					<BadgesSelect
						selected={editUser.badge_ids}
						setSelected={badgeIds => setEditUser('badge_ids', badgeIds)}
						onCreateBadgeButtonClick={() => {
							setStep(StepNames.CREATE_BADGE)
						}}
						badges={fetchBadgeQuery.data || []}
						search={badgeSearch()}
						setSearch={setBadgeSearch}
					/>
				</div>
			</Show>
			<Show when={step() === StepNames.CREATE_BADGE}>
				<div class="flex flex-col items-start w-full">
					<BadgeCreate
						createBadge={createBadge}
						setCreateBadge={setCreateBadge}
					/>
				</div>
			</Show>
			<Show when={step() === StepNames.LOCATION}>
				<div class="flex flex-col items-start w-full">
					<LocationSelect
						location={location()}
						setLocation={setLocation}
					/>
				</div>
			</Show>
			<Show when={step() === StepNames.PHOTO_UPLOAD}>
				<div class="flex flex-col items-start w-full">
					<PhotoUpload
						avatarUrl={editUser.avatar_url}
						setAvatarUrl={avatarUrl => setEditUser('avatar_url', avatarUrl)}
						imgFile={imgFile()}
						setImgFile={setImgFile}
					/>
				</div>
			</Show>
		</FormLayout>
	)
}
