import { useMainButton } from '~/lib/useMainButton'
import { createEffect, createSignal, Match, Switch } from 'solid-js'
import { store } from '~/store'
import {
	API_BASE_URL,
} from '~/lib/api'

type PhotoUploadProps = {
	avatarUrl: string
	setAvatarUrl: (url: string) => void
	imgFile: File | null
	setImgFile: (file: File | null) => void
}

export default function PhotoUpload(props: PhotoUploadProps) {
	const mainButton = useMainButton()
	const [previewUrl, setPreviewUrl] = createSignal(store.user?.avatar_url || '')

	const handleFileChange = (event: any) => {
		const file = event.target.files[0]
		if (file) {
			const maxSize = 1024 * 1024 * 5 // 7MB

			if (file.size > maxSize) {
				// showAlert('Try to select a smaller file')
				return
			}

			props.setImgFile(file)
			setPreviewUrl('')

			const reader = new FileReader()
			reader.onload = e => {
				setPreviewUrl(e.target?.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const generateRandomAvatar = () => {
		const url = `${API_BASE_URL}/v1/avatar`

		const resp = fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${store.token}`,
			},
		})

		resp.then(response => {
			response.blob().then(blob => {
				const file = new File([blob], 'avatar.svg', {
					type: 'image/svg+xml',
				})
				props.setImgFile(file)
				setPreviewUrl('')
				setPreviewUrl(URL.createObjectURL(file))
			})
		})
	}

	createEffect(() => {
		if (props.avatarUrl || props.imgFile) {
			mainButton.enable('Save')
		} else {
			mainButton.disable('Save')
		}
	})

	return (
		<div class="w-full mt-5 flex h-full items-center justify-center">
			<div class="flex flex-col items-center justify-center gap-2">
				<Switch>
					<Match when={previewUrl()}>
						<ImageBox imgURL={previewUrl()} onFileChange={handleFileChange} />
					</Match>
					<Match when={!previewUrl()}>
						<UploadBox onFileChange={handleFileChange} />
					</Match>
				</Switch>
				<button class="h-10 text-link" onClick={generateRandomAvatar}>
					Generate a random avatar
				</button>
			</div>
		</div>
	)
}

function ImageBox(props: { imgURL: string; onFileChange: any }) {
	return (
		<div class="mt-5 flex h-full items-center justify-center">
			<div class="relative flex size-56 flex-col items-center justify-center gap-2">
				<img
					src={props.imgURL}
					alt="Uploaded image preview"
					class="size-56 rounded-xl object-cover"
				/>
				<input
					class="absolute size-full cursor-pointer rounded-xl opacity-0"
					type="file"
					accept="image/*"
					onChange={props.onFileChange}
				/>
			</div>
		</div>
	)
}

function UploadBox(props: { onFileChange: any }) {
	return (
		<>
			<div class="relative flex size-56 flex-col items-center justify-center rounded-xl">
				<input
					class="absolute size-full opacity-0"
					type="file"
					accept="image/*"
					onChange={props.onFileChange}
				/>
				<span class="material-symbols-rounded pointer-events-none z-10 text-[45px] text-secondary">
					camera_alt
				</span>
			</div>
		</>
	)
}
