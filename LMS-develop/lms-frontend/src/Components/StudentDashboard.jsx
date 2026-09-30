
import { useState } from 'react';
import Sidebar from './DashboardItems/components/Sidebar';
import Header from './DashboardItems/components/Header';
import OverviewCards from './DashboardItems/components/OverviewCards';
import ActiveCourses from './DashboardItems/components/ActiveCourses';
import RecentActivity from './DashboardItems/components/RecentActivity';
import QuickActions from './DashboardItems/components/QuickActions';

export const StudentDashboard = () => {
    const [activeNav, setActiveNav] = useState('dashboard');

    return (
        <div className="min-h-screen bg-[#F5F6FA] font-sans">
            <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

            <div className="ml-64">
                <Header />

                <main className="p-8">
                    <OverviewCards />
                    <ActiveCourses />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                        <div className="lg:col-span-2">
                            <RecentActivity />
                        </div>
                        <div>
                            <QuickActions />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
