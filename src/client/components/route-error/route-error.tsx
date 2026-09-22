import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '@/client/kit/button'
import { StatusPage } from '@/client/kit/status-page'

export function RouteError({ error, reset }: ErrorComponentProps) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<StatusPage
			action={
				<Button onClick={reset} variant="secondary">
					Try again
				</Button>
			}
			description="Something went wrong on our side. Your letters are safe."
			title="Something went wrong"
		/>
	)
}
