function createButtonHandlers(button: any) {
	const getColorSchemeParams = (isActive: boolean, text?: string) => {
		const baseParams = {
			is_active: isActive,
			is_visible: true,
			text,
			text_color: isActive ? '#F5F5F5' : '#D9D9D9',
			color: isActive ? '#000000' : '#7A7A7A',
		}

		if (window.Telegram.WebApp.colorScheme === 'dark') {
			baseParams.color = isActive ? '#141414' : '#B9BABF'
			baseParams.text_color = isActive ? '#FFFFFF' : '#838489'
		}

		return baseParams
	}

	return {
		setVisible: (text: string) => {
			button.setParams({
				is_visible: true,
				text,
			})
		},
		hide: () => {
			button.isVisible = false
		},
		enable: (text?: string) => {
			return button.setParams(getColorSchemeParams(true, text))
		},
		disable: (text?: string) => {
			return button.setParams(getColorSchemeParams(false, text))
		},
		toggle: (condition: any, textOn: string, textOff?: string) => {
			if (condition) {
				button.setParams(getColorSchemeParams(true, textOn))
			} else {
				button.setParams(getColorSchemeParams(false, textOff))
			}
		},
		setParams: (params: {
			text?: string;
			isVisible?: boolean;
			color?: string;
			textColor?: string;
			isEnabled?: boolean;
		}) => {
			return button.setParams({
				is_visible: params.isVisible,
				text: params.text,
				color: params.color,
				text_color: params.textColor,
				is_active: params.isEnabled,
			})
		},
		onClick: (callback: () => void) => {
			button.onClick(callback)
		},
		offClick: (callback: () => void) => {
			button.offClick(callback)
		},
		showProgress: (leaveActive = false) => {
			button.showProgress(leaveActive)
		},
		hideProgress: () => {
			button.hideProgress()
		},
	}
}

export function useMainButton() {
	return createButtonHandlers(window.Telegram.WebApp.MainButton)
}

export function useSecondaryButton() {
	return createButtonHandlers(window.Telegram.WebApp.SecondaryButton)
}
