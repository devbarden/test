import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { StatusPage } from '@/components/layout/status-page'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

export function RouteError({ error, reset }: ErrorComponentProps) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<StatusPage
			action={
				<Button onClick={reset} variant="secondary">
					{m['common.tryAgain']()}
				</Button>
			}
			description={m['fallbacks.error.description']()}
			title={m['fallbacks.error.title']()}
		/>
	)
}
