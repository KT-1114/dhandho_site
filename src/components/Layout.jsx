import { DashboardLayout, PageContainer } from '@toolpad/core'
import React from 'react'
import { Outlet } from 'react-router-dom'

export default function Layout() {
    return (
        <DashboardLayout defaultSidebarCollapsed>
            <PageContainer >
                <Outlet />
            </PageContainer>
        </DashboardLayout>
    )
}
