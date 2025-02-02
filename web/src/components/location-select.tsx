import { createEffect, createSignal, Show, For, createResource } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { fetchCities, UserLocation } from '~/lib/api'
import { cn } from '~/lib/utils'
import SearchInput from '~/components/search-input'

type LocationSelectProps = {
	location: UserLocation
	setLocation: (location: UserLocation) => void
}

export function LocationSelect(props: LocationSelectProps) {
	const [address, setAddress] = createSignal<string | null>(null)
	const [status, setStatus] = createSignal<'loading' | 'granted' | 'denied' | 'unavailable'>('loading')
	const [isFetchingLocation, setIsFetchingLocation] = createSignal(false)
	const [isDecodingLocation, setIsDecodingLocation] = createSignal(false)
	const [coords, setCoords] = createSignal('')

	createEffect(() => {
		const { LocationManager } = window.Telegram.WebApp
		if (!LocationManager.isInited) {
			LocationManager.init(() => {
				checkLocationStatus()
			})
		} else {
			checkLocationStatus()
		}
	})

	const checkLocationStatus = () => {
		const { LocationManager } = window.Telegram.WebApp

		if (!LocationManager.isLocationAvailable) {
			setStatus('unavailable')
			return
		}

		if (LocationManager.isAccessGranted) {
			setIsFetchingLocation(true)
			LocationManager.getLocation((loc: any) => {
				setIsFetchingLocation(false)
				if (loc) {
					setCoords(`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`)
					setStatus('granted')
					decodeLocation(loc.latitude, loc.longitude)
				} else {
					setStatus('denied')
				}
			})
		} else {
			setStatus('denied')
		}
	}

	const requestLocationAccess = () => {
		const { LocationManager } = window.Telegram.WebApp
		setIsFetchingLocation(true)
		LocationManager.getLocation((loc: any) => {
			setIsFetchingLocation(false)
			if (loc) {
				setCoords(`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`)
				setStatus('granted')
				decodeLocation(loc.latitude, loc.longitude)
			} else {
				setStatus('denied')
			}
		})
	}

	const decodeLocation = async (latitude: number, longitude: number) => {
		setIsDecodingLocation(true)
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=en`,
			)
			const data = await response.json()
			if (data.address) {
				const city = data.address.city || data.address.town || data.address.village || ''
				const country = data.address.country || ''
				const countryCode = data.address.country_code.toUpperCase()

				const locationData: UserLocation = {
					latitude,
					longitude,
					location_name: city ? `${city}, ${country}` : country,
					country_code: countryCode,
				}

				setAddress(locationData.location_name)
				props.setLocation(locationData)
			} else {
				setAddress('Unknown location')
			}
		} catch (error) {
			console.error('Failed to fetch location:', error)
			setAddress('Failed to decode location')
		} finally {
			setIsDecodingLocation(false)
		}
	}

	return (
		<div class="flex w-full flex-col space-y-2">
			<Show when={status() === 'granted'}>
				<div class="rounded-lg bg-secondary p-2.5">
					<Show when={isFetchingLocation()}>
						<p class="text-muted-foreground">Fetching location...</p>
					</Show>
					<Show when={!isFetchingLocation()}>
						<span class="text-xs font-semibold">📍 {coords()}</span>
					</Show>
					<Show when={isDecodingLocation()}>
						<p class="text-muted-foreground">Loading location...</p>
					</Show>
					<Show when={!isDecodingLocation() && address()}>
						<p class="text-sm text-secondary-foreground">{address()}</p>
					</Show>
				</div>
			</Show>

			<Show when={status() === 'denied'}>
				<button onClick={requestLocationAccess} class="text-sm font-semibold h-10 text-accent-foreground underline">
					Request Location Access
				</button>
			</Show>

			<Show when={status() === 'unavailable'}>
				<span class="text-red-500">Location services unavailable</span>
			</Show>

			<Show when={status() === 'loading'}>
				<span class="text-gray-500">Checking location...</span>
			</Show>

			<Show when={status() === 'denied' || status() === 'unavailable'}>
				<CitySearch setLocation={props.setLocation} />
			</Show>
		</div>
	)
}

type CitySearchProps = {
	setLocation: (location: UserLocation) => void
}

async function fetchCountryFlags() {
	const { default: countryFlags } = await import('~/assets/countries.json')
	return countryFlags
}

export function CitySearch(props: CitySearchProps) {
	const [search, setSearch] = createSignal('')
	const [selectedCity, setSelectedCity] = createSignal<UserLocation | null>(null)
	const [countryFlags, {}] = createResource<{ code: string; flag: string, viewBox: string }[]>(fetchCountryFlags)

	// Fetch cities based on user input
	const citiesQuery = createQuery(() => ({
		queryKey: ['cities', search()],
		queryFn: () => fetchCities(search()),
		enabled: search().length > 2, // Only fetch if search is meaningful
	}))

	const handleCitySelection = (city: any) => {
		setSelectedCity(city)
		props.setLocation({
			location_name: city.city_name,
			country_code: city.country_code,
			latitude: city.latitude,
			longitude: city.longitude,
		})
	}

	const getFlagForCountry = (countryCode: string) => {
		return countryFlags()?.find((c) => c.code === countryCode)
	}

	return (
		<div class="mt-3">
			<SearchInput
				search={search()}
				setSearch={setSearch}
				placeholder={'Search for a city'}
				class="w-full"
			/>

			<Show when={citiesQuery.isFetching}>
				<p class="text-muted-foreground">Searching...</p>
			</Show>

			<Show when={citiesQuery.data?.length}>
				<ul class="mt-2 max-h-[280px] overflow-y-auto border rounded-md">
					<For each={citiesQuery.data}>
						{(city) => {
							const flagData = getFlagForCountry(city.country_code)
							return (
								<li
									class={cn('p-2 cursor-pointer flex items-center space-x-2', selectedCity() === city && 'bg-primary text-primary-foreground')}
									onClick={() => handleCitySelection(city)}>
									<Show when={getFlagForCountry(city.country_code)}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="z-10 size-5"
											viewBox={flagData!.viewBox}
											innerHTML={flagData!.flag}
										/>
									</Show>
									<span>{city.city_name}</span>
								</li>
							)
						}}
					</For>
				</ul>
			</Show>

			<Show when={!citiesQuery.isFetching && search().length > 2 && !citiesQuery.data?.length}>
				<p class="text-red-500">No cities found.</p>
			</Show>
		</div>
	)
}
